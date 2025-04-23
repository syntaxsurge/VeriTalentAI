'use server'

import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { issueCredential } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { users, teams, teamMembers } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import {
  candidateCredentials,
  CredentialStatus,
  candidates,
} from '@/lib/db/schema/viskify'

/* -------------------------------------------------------------------------- */
/*                               H E L P E R S                                */
/* -------------------------------------------------------------------------- */

function buildError(message: string) {
  return { error: message }
}

/* -------------------------------------------------------------------------- */
/*                       A P P R O V E  /  S I G N  V C                       */
/* -------------------------------------------------------------------------- */

export const approveCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    /* 1. issuer ownership */
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return buildError('Issuer not found.')
    if (!issuer.did) return buildError('Link a DID before approving credentials.')

    /* 2. credential row */
    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(eq(candidateCredentials.id, credentialId), eq(candidateCredentials.issuerId, issuer.id)),
      )
      .limit(1)
    if (!cred) return buildError('Credential not found for this issuer.')
    if (cred.status === CredentialStatus.VERIFIED)
      return buildError('Credential already verified.')

    /* 3. subject DID */
    const [candRow] = await db
      .select({ cand: candidates, candUser: users })
      .from(candidates)
      .leftJoin(users, eq(candidates.userId, users.id))
      .where(eq(candidates.id, cred.candidateId))
      .limit(1)
    if (!candRow?.candUser) return buildError('Candidate user not found.')

    const [teamRow] = await db
      .select({ did: teams.did })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, candRow.candUser.id))
      .limit(1)
    if (!teamRow?.did)
      return buildError('Candidate has no DID – ask them to create one before verification.')

    /* 4. Issue VC if not yet issued */
    let vcJson: any = null
    if (!cred.vcJson) {
      try {
        vcJson = await issueCredential({
          issuerDid: issuer.did,
          subjectDid: teamRow.did,
          attributes: {
            credentialTitle: cred.title,
            candidateName: candRow.candUser.name || candRow.candUser.email || 'Unknown',
          },
          credentialName: cred.type,
        })
      } catch (err: any) {
        return buildError(`Failed to issue credential: ${err?.message || String(err)}`)
      }
    }

    /* 5. persist */
    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.VERIFIED,
        verified: true,
        verifiedAt: new Date(),
        vcJson: vcJson ? JSON.stringify(vcJson) : cred.vcJson, // preserve if already exists
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential verified.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                              R E J E C T                                   */
/* -------------------------------------------------------------------------- */

export const rejectCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return buildError('Issuer not found.')

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.REJECTED,
        verified: false,
        verifiedAt: new Date(),
      })
      .where(
        and(eq(candidateCredentials.id, credentialId), eq(candidateCredentials.issuerId, issuer.id)),
      )

    return { success: 'Credential rejected.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                            U N V E R I F Y                                 */
/* -------------------------------------------------------------------------- */

export const unverifyCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return buildError('Issuer not found.')

    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(eq(candidateCredentials.id, credentialId), eq(candidateCredentials.issuerId, issuer.id)),
      )
      .limit(1)
    if (!cred) return buildError('Credential not found for this issuer.')
    if (cred.status !== CredentialStatus.VERIFIED)
      return buildError('Only verified credentials can be unverified.')

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.UNVERIFIED,
        verified: false,
        verifiedAt: null,
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential marked unverified.' }
  },
)
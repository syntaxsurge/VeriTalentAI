'use server'

import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { issueCredential } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { users, teams, teamMembers } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                         A P P R O V E  /  I S S U E                        */
/* -------------------------------------------------------------------------- */

export const approveCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _formData, user) => {
    /* Issuer & credential ------------------------------------------------- */
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return { error: 'Issuer not found.' }
    if (!issuer.did) return { error: 'Link a cheqd DID before approving credentials.' }

    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )
      .limit(1)
    if (!cred) return { error: 'Credential not found for this issuer.' }
    if (cred.status === CredentialStatus.VERIFIED) return { error: 'Credential already verified.' }

    /* Candidate + subject DID -------------------------------------------- */
    const [candRow] = await db
      .select({ cand: candidates, candUser: users })
      .from(candidates)
      .leftJoin(users, eq(candidates.userId, users.id))
      .where(eq(candidates.id, cred.candidateId))
      .limit(1)
    if (!candRow?.candUser) return { error: 'Candidate user not found.' }

    const [teamRow] = await db
      .select({ did: teams.did })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, candRow.candUser.id))
      .limit(1)

    const subjectDid = teamRow?.did
    if (!subjectDid)
      return { error: 'Candidate has no DID – ask them to create one before verification.' }

    /* Issue VC via cheqd Studio ------------------------------------------ */
    let credential
    try {
      credential = await issueCredential({
        issuerDid: issuer.did,
        subjectDid,
        attributes: {
          title: cred.title,
          type: cred.type,
          candidateName: candRow.candUser.name || candRow.candUser.email || 'Unknown',
        },
        credentialName: 'ViskifyCredential',
      })
    } catch (err: any) {
      return { error: `Failed to issue credential via cheqd: ${err?.message || String(err)}` }
    }

    /* Persist DB changes -------------------------------------------------- */
    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.VERIFIED,
        verified: true,
        verifiedAt: new Date(),
        vcJwt: credential?.proof?.jwt ?? null,
        vcJson: JSON.stringify(credential),
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential verified and issued via cheqd.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                              R E J E C T                                   */
/* -------------------------------------------------------------------------- */

export const rejectCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _formData, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return { error: 'Issuer not found.' }

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.REJECTED,
        verified: false,
        verifiedAt: new Date(),
      })
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )

    return { success: 'Credential rejected.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                            U N V E R I F Y                                 */
/* -------------------------------------------------------------------------- */

export const unverifyCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _formData, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return { error: 'Issuer not found.' }

    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )
      .limit(1)
    if (!cred) return { error: 'Credential not found for this issuer.' }
    if (cred.status !== CredentialStatus.VERIFIED)
      return { error: 'Only verified credentials can be unverified.' }

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

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
/*                               U T I L S                                    */
/* -------------------------------------------------------------------------- */

function buildError(message: string, ctx?: Record<string, unknown>) {
  if (ctx) console.error('[VC‑Issue] Context:', ctx)
  return { error: message }
}

/* -------------------------------------------------------------------------- */
/*                       A P P R O V E  /  S I G N  V C                       */
/* -------------------------------------------------------------------------- */

export const approveCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    /* ------------------ issuer validation ------------------ */
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (!issuer) return buildError('Issuer not found.')
    if (!issuer.did)
      return buildError('Link a DID before approving credentials.')

    /* ------------------ credential lookup ------------------ */
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

    if (!cred) return buildError('Credential not found for this issuer.')
    if (cred.status === CredentialStatus.VERIFIED)
      return buildError('Credential is already verified.')

    /* ------------------ candidate & DID -------------------- */
    const [cand] = await db
      .select({ cand: candidates, candUser: users })
      .from(candidates)
      .leftJoin(users, eq(candidates.userId, users.id))
      .where(eq(candidates.id, cred.candidateId))
      .limit(1)

    /* ---- NEW: ensure candUser is not null for TS safety --- */
    if (!cand || !cand.candUser)
      return buildError('Candidate user not found.')

    const [teamRow] = await db
      .select({ did: teams.did })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, cand.candUser.id))
      .limit(1)

    const subjectDid = teamRow?.did
    if (!subjectDid)
      return buildError(
        'Candidate has no DID – ask them to generate one before verification.',
      )

    /* ------------------ VC handling ------------------------ */
    let vcJwt = cred.vcIssuedId ?? undefined
    const debugCtx: Record<string, unknown> = {
      credentialId,
      issuerId: issuer.id,
      issuerDid: issuer.did,
      credentialStatus: cred.status,
      subjectDid,
    }

    try {
      if (!vcJwt) {
        const vc = await issueCredential({
          issuerDid: issuer.did,
          subjectDid,
          attributes: {
            credentialTitle: cred.title,
            candidateName:
              cand.candUser?.name || cand.candUser?.email || 'Unknown',
          },
          credentialName: cred.type,
        })
        vcJwt = vc?.proof?.jwt
        if (!vcJwt) {
          return buildError(
            'Verifiable credential issued without a JWT proof.',
            { ...debugCtx, vc },
          )
        }
      }
    } catch (err: any) {
      return buildError(
        `Failed to issue verifiable credential: ${
          err?.message || String(err)
        }`,
        { ...debugCtx, err },
      )
    }

    /* ------------------ persist changes -------------------- */
    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.VERIFIED,
        verified: true,
        verifiedAt: new Date(),
        vcIssuedId: vcJwt,
      })
      .where(eq(candidateCredentials.id, cred.id))

    console.info('[VC‑Issue] Credential approved & VC stored', {
      credentialId,
      issuerId: issuer.id,
    })

    return { success: 'Credential approved.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                              R E J E C T                                   */
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
        vcIssuedId: null,
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
/*                            U N V E R I F Y                                 */
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
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
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

    return { success: 'Credential status set to unverified.' }
  },
)
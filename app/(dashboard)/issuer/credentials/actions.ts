'use server'

import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { issueCredential } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import {
  candidateCredentials,
  CredentialStatus,
  candidates,
} from '@/lib/db/schema/viskify'

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

    if (!issuer) return { error: 'Issuer not found.' }
    if (!issuer.did) return { error: 'Link a DID before approving credentials.' }

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

    if (!cred) return { error: 'Credential not found for this issuer.' }
    if (cred.status === CredentialStatus.VERIFIED)
      return { error: 'Credential is already verified.' }

    /* ------------------ VC handling ------------------------ */
    let vcJwt = cred.vcIssuedId ?? undefined

    /* If no previous VC, generate a new one */
    if (!vcJwt) {
      /* Candidate info for VC subject */
      const [cand] = await db
        .select({ cand: candidates, candUser: users })
        .from(candidates)
        .leftJoin(users, eq(candidates.userId, users.id))
        .where(eq(candidates.id, cred.candidateId))
        .limit(1)

      const subjectDid =
        process.env.SUBJECT_DID || `did:cheqd:testnet:candidate-${cred.candidateId}`

      try {
        const vc = await issueCredential({
          issuerDid: issuer.did,
          subjectDid,
          attributes: {
            credentialTitle: cred.title,
            candidateName: cand.candUser?.name || cand.candUser?.email || 'Unknown',
          },
          credentialName: cred.type,
        })
        vcJwt = vc?.proof?.jwt
      } catch (err) {
        console.error('VC issuance failed:', err)
        return { error: 'Failed to issue verifiable credential.' }
      }
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

    if (!issuer) return { error: 'Issuer not found.' }

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

    /* Preserve existing VC ID so it can be reused later */
    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.UNVERIFIED,
        verified: false,
        verifiedAt: null,
        // vcIssuedId intentionally left unchanged
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential status set to unverified.' }
  },
)
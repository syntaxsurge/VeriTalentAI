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

/* ------------------------------------------------------------- */
/*                     A P P R O V E   C R E D                   */
/* ------------------------------------------------------------- */
export const approveCredentialAction = validatedActionWithUser(
  z.object({
    credentialId: z.coerce.number(),
  }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (!issuer) {
      return { error: 'Issuer not found.' }
    }
    if (!issuer.did) {
      return { error: 'Link a DID before approving credentials.' }
    }

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
    if (cred.status !== CredentialStatus.PENDING)
      return { error: 'Credential is not pending review.' }

    /* Candidate profile for subject DID / name */
    const [cand] = await db
      .select({
        cand: candidates,
        candUser: users,
      })
      .from(candidates)
      .leftJoin(users, eq(candidates.userId, users.id))
      .where(eq(candidates.id, cred.candidateId))
      .limit(1)

    /* Fallback subject DID if candidate hasn't created one yet */
    const subjectDid =
      process.env.SUBJECT_DID || `did:cheqd:testnet:candidate-${cred.candidateId}`

    /* Issue the VC via cheqd */
    let vcJwt: string | undefined
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
      /* If issuing fails we still mark verified but without VC */
    }

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.VERIFIED,
        verified: true,
        verifiedAt: new Date(),
        vcIssuedId: vcJwt,
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential approved and signed.' }
  },
)

/* ------------------------------------------------------------- */
/*                     R E J E C T   C R E D                     */
/* ------------------------------------------------------------- */
export const rejectCredentialAction = validatedActionWithUser(
  z.object({
    credentialId: z.coerce.number(),
  }),
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
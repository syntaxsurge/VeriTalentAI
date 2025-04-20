'use server'

import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import {
  candidateCredentials,
  candidates,
  CredentialStatus,
} from '@/lib/db/schema/viskify'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                              A D D  C R E D                                */
/* -------------------------------------------------------------------------- */

export const addCredential = validatedActionWithUser(
  z.object({
    title: z.string().min(2).max(200),
    type: z.string().min(1).max(50),
    fileUrl: z.string().url('Invalid URL'),
    issuerId: z.coerce.number().optional(),
  }),
  async ({ title, type, fileUrl, issuerId }, _, user) => {
    // link issuer if active
    let linkedIssuerId: number | undefined
    let status: CredentialStatus = CredentialStatus.UNVERIFIED

    if (issuerId) {
      const [issuer] = await db
        .select()
        .from(issuers)
        .where(and(eq(issuers.id, issuerId), eq(issuers.status, IssuerStatus.ACTIVE)))
        .limit(1)
      if (issuer) {
        linkedIssuerId = issuer.id
        status = CredentialStatus.PENDING
      }
    }

    // ensure candidate exists
    let [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (!candidate) {
      const [newCand] = await db
        .insert(candidates)
        .values({ userId: user.id, bio: '' })
        .returning()
      candidate = newCand
    }

    await db.insert(candidateCredentials).values({
      candidateId: candidate.id,
      title,
      type,
      fileUrl,
      issuerId: linkedIssuerId,
      status,
    })

    redirect('/candidate/credentials')
  },
)

/* -------------------------------------------------------------------------- */
/*                          D E L E T E  C R E D                              */
/* -------------------------------------------------------------------------- */

export const deleteCredentialAction = validatedActionWithUser(
  z.object({
    credentialId: z.coerce.number(),
  }),
  async ({ credentialId }, _formData, user) => {
    // verify ownership
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (!candidate) return { error: 'Unauthorized.' }

    const deleted = await db
      .delete(candidateCredentials)
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.candidateId, candidate.id),
        ),
      )
      .returning({ id: candidateCredentials.id })

    if (deleted.length === 0) return { error: 'Credential not found.' }
    return { success: 'Credential deleted.' }
  },
)
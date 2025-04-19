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
} from '@/lib/db/schema/veritalent'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

export const addCredential = validatedActionWithUser(
  z.object({
    title: z.string().min(2).max(200),
    type: z.string().min(1).max(50),
    fileUrl: z.string().url('Invalid URL'),
    issuerId: z.coerce.number().optional(),
  }),
  async ({ title, type, fileUrl, issuerId }, _, user) => {
    // If issuerId provided ensure it exists & active
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
      const [newCand] = await db.insert(candidates).values({ userId: user.id, bio: '' }).returning()
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
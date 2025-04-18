'use server'

import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials, candidates, CredentialStatus } from '@/lib/db/schema/veritalent'

export const addCredential = validatedActionWithUser(
  z.object({
    title: z.string().min(2).max(200),
    type: z.string().min(1).max(50),
    fileUrl: z.string().url('Invalid URL'),
  }),
  async (data, _, user) => {
    const { title, type, fileUrl } = data

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
      status: CredentialStatus.UNVERIFIED,
    })

    redirect('/candidate/credentials')
  },
)

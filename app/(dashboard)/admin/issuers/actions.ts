'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

export const updateIssuerStatusAction = validatedActionWithUser(
  z
    .object({
      issuerId: z.coerce.number(),
      status: z.enum([IssuerStatus.PENDING, IssuerStatus.ACTIVE, IssuerStatus.REJECTED]),
      rejectionReason: z.string().max(2000).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.status === IssuerStatus.REJECTED && !val.rejectionReason) {
        ctx.addIssue({
          code: 'custom',
          message: 'Rejection reason is required when rejecting an issuer.',
          path: ['rejectionReason'],
        })
      }
    }),
  async ({ issuerId, status, rejectionReason }, _, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    await db
      .update(issuers)
      .set({
        status,
        rejectionReason: status === IssuerStatus.REJECTED ? rejectionReason ?? null : null,
      })
      .where(eq(issuers.id, issuerId))

    revalidatePath('/admin/issuers')
    return { success: `Issuer status updated to ${status}.` }
  },
)
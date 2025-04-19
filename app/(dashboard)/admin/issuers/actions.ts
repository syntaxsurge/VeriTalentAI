'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/**
 * Admin‑only action: update the lifecycle status of an issuer.
 * `status` must be one of the IssuerStatus enum values.
 */
export const updateIssuerStatusAction = validatedActionWithUser(
  z.object({
    issuerId: z.coerce.number(),
    status: z.enum([IssuerStatus.PENDING, IssuerStatus.ACTIVE, IssuerStatus.REJECTED]),
  }),
  async ({ issuerId, status }, _, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    await db.update(issuers).set({ status }).where(eq(issuers.id, issuerId))
    return { success: `Issuer status updated to ${status}.` }
  },
)
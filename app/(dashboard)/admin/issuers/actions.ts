'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/**
 * Admin‑only action: update the lifecycle status of an issuer.
 */
export const updateIssuerStatusAction = validatedActionWithUser(
  z.object({
    issuerId: z.coerce.number(),
    status: z.enum([IssuerStatus.PENDING, IssuerStatus.ACTIVE, IssuerStatus.REJECTED]),
  }),
  async ({ issuerId, status }, _, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    await db.update(issuers).set({ status }).where(eq(issuers.id, issuerId))

    // Ensure the UI re‑fetches fresh data immediately
    revalidatePath('/admin/issuers')

    return { success: `Issuer status updated to ${status}.` }
  },
)
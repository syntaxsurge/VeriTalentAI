'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                               V A L I D A T I O N                          */
/* -------------------------------------------------------------------------- */

const updateIssuerStatusSchema = z
  .object({
    issuerId: z.coerce.number(),
    status: z.enum([
      IssuerStatus.PENDING,
      IssuerStatus.ACTIVE,
      IssuerStatus.REJECTED,
    ]),
    rejectionReason: z.string().max(2000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === IssuerStatus.REJECTED && !val.rejectionReason) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Rejection reason is required when rejecting an issuer.',
        path: ['rejectionReason'],
      })
    }
  })

/* -------------------------------------------------------------------------- */
/*                         I N N E R   A C T I O N                            */
/* -------------------------------------------------------------------------- */

const _updateIssuerStatus = validatedActionWithUser(
  updateIssuerStatusSchema,
  async ({ issuerId, status, rejectionReason }, _formData, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    await db
      .update(issuers)
      .set({
        status,
        rejectionReason:
          status === IssuerStatus.REJECTED ? rejectionReason ?? null : null,
      })
      .where(eq(issuers.id, issuerId))

    revalidatePath('/admin/issuers')
    return { success: `Issuer status updated to ${status}.` }
  },
)

/* -------------------------------------------------------------------------- */
/*                     E X P O R T E D   S E R V E R   A C T I O N            */
/* -------------------------------------------------------------------------- */

/**
 * Next.js requires exported server actions to be async functions declared
 * at the module level; we wrap the validated action to fulfil that contract.
 */
export const updateIssuerStatusAction = async (
  ...args: Parameters<typeof _updateIssuerStatus>
) => {
  'use server'
  return _updateIssuerStatus(...args)
}
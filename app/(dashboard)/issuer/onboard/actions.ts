'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                             C R E A T E   I S S U E R                       */
/* -------------------------------------------------------------------------- */
export const createIssuerAction = validatedActionWithUser(
  z.object({
    name: z.string().min(2).max(200),
    domain: z.string().min(3).max(255),
    logoUrl: z.string().url('Invalid URL').optional(),
    did: z.string().min(10).optional(),
  }),
  async (data, _, user) => {
    // ensure user doesn't already own an issuer
    const existing = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (existing.length > 0) {
      return { error: 'You already have an issuer organisation.' }
    }

    await db.insert(issuers).values({
      ownerUserId: user.id,
      name: data.name,
      domain: data.domain.toLowerCase(),
      logoUrl: data.logoUrl,
      did: data.did,
      status: IssuerStatus.PENDING,
    })

    return { success: 'Issuer created and pending review.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                         U P D A T E   I S S U E R   D I D                   */
/* -------------------------------------------------------------------------- */
export const updateIssuerDidAction = validatedActionWithUser(
  z.object({
    did: z.string().min(10, 'Invalid DID'),
  }),
  async (data, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (!issuer) {
      return { error: 'Issuer not found for your account.' }
    }

    await db
      .update(issuers)
      .set({ did: data.did, status: IssuerStatus.ACTIVE })
      .where(eq(issuers.id, issuer.id))

    return { success: 'DID linked successfully — issuer is now active.' }
  },
)

'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                               S C H E M A S                                */
/* -------------------------------------------------------------------------- */

/**
 * DID schema:
 *   • Trim surrounding whitespace.
 *   • Convert blank strings to <undefined> so that an empty field bypasses validation.
 *   • If a value remains, enforce a minimum length of 10 characters.
 */
const didSchema = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .refine((val) => val === undefined || val.length >= 10, {
    message: 'Invalid DID',
  })
  .optional()

/* -------------------------------------------------------------------------- */
/*                         C R E A T E   I S S U E R                          */
/* -------------------------------------------------------------------------- */
export const createIssuerAction = validatedActionWithUser(
  z.object({
    name: z.string().min(2).max(200),
    domain: z.string().min(3).max(255),
    logoUrl: z.string().url('Invalid URL').optional(),
    did: didSchema,
  }),
  async (data, _, user) => {
    /* Prevent multiple issuers per user */
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
      did: data.did ?? undefined, // never persist an empty string
      status: IssuerStatus.PENDING,
    })

    return { success: 'Issuer created and pending review.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                         U P D A T E   I S S U E R   D I D                  */
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
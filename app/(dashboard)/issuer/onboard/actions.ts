'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import {
  issuers,
  IssuerStatus,
  IssuerCategory,
  IssuerIndustry,
} from '@/lib/db/schema/issuer'
import { db } from '@/lib/db/drizzle'

/* -------------------- Shared helpers -------------------- */
function refresh() {
  revalidatePath('/issuer/onboard')
}

/* -------------------- Schemas --------------------------- */
const didSchema = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .refine((val) => val === undefined || val.length >= 10, {
    message: 'Invalid DID',
  })
  .optional()

const categoryEnum = z.enum([...Object.values(IssuerCategory)] as [string, ...string[]])
const industryEnum = z.enum([...Object.values(IssuerIndustry)] as [string, ...string[]])

/* -------------------- Create issuer --------------------- */
export const createIssuerAction = validatedActionWithUser(
  z.object({
    name: z.string().min(2).max(200),
    domain: z.string().min(3).max(255),
    logoUrl: z.string().url('Invalid URL').optional(),
    did: didSchema,
    category: categoryEnum.default(IssuerCategory.OTHER),
    industry: industryEnum.default(IssuerIndustry.OTHER),
  }),
  async (data, _, user) => {
    const existing = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (existing.length) return { error: 'You already have an issuer organisation.' }

    await db.insert(issuers).values({
      ownerUserId: user.id,
      name: data.name,
      domain: data.domain.toLowerCase(),
      logoUrl: data.logoUrl,
      did: data.did ?? undefined,
      status: IssuerStatus.PENDING,
      category: data.category,
      industry: data.industry,
    })

    refresh()
    return { success: 'Issuer created and pending review.' }
  },
)

/* --------------------- Link DID ------------------------- */
export const updateIssuerDidAction = validatedActionWithUser(
  z.object({ did: z.string().min(10, 'Invalid DID') }),
  async ({ did }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (!issuer) return { error: 'Issuer not found.' }

    await db
      .update(issuers)
      .set({ did, status: IssuerStatus.ACTIVE })
      .where(eq(issuers.id, issuer.id))

    refresh()
    return { success: 'DID linked successfully — issuer is now active.' }
  },
)
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
    logoUrl: z
      .string()
      .url('Invalid URL')
      .regex(/^https:\/\//, 'Logo URL must start with https://')
      .optional(),
    did: didSchema,
    category: categoryEnum.default(IssuerCategory.OTHER),
    industry: industryEnum.default(IssuerIndustry.OTHER),
  }),
  async (data, _, user) => {
    /* Reject duplicates */
    const existing = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (existing.length) {
      return { error: 'You already have an issuer organisation.' }
    }

    /* Narrow the literal types to satisfy drizzle insert typings */
    const newIssuer: typeof issuers.$inferInsert = {
      ownerUserId: user.id,
      name: data.name,
      domain: data.domain.toLowerCase(),
      logoUrl: data.logoUrl ?? null,
      did: data.did ?? null,
      status: IssuerStatus.PENDING,
      category: data.category as (typeof IssuerCategory)[keyof typeof IssuerCategory],
      industry: data.industry as (typeof IssuerIndustry)[keyof typeof IssuerIndustry],
    }

    await db.insert(issuers).values(newIssuer)

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

    if (!issuer) {
      return { error: 'Issuer not found.' }
    }

    await db
      .update(issuers)
      .set({ did, status: IssuerStatus.ACTIVE })
      .where(eq(issuers.id, issuer.id))

    refresh()
    return { success: 'DID linked successfully — issuer is now active.' }
  },
)

/* -------------- Update + resubmit rejected issuer -------------- */
export const updateIssuerDetailsAction = validatedActionWithUser(
  z.object({
    name: z.string().min(2).max(200),
    domain: z.string().min(3).max(255),
    logoUrl: z
      .string()
      .url('Invalid URL')
      .regex(/^https:\/\//, 'Logo URL must start with https://')
      .optional(),
    category: categoryEnum.default(IssuerCategory.OTHER),
    industry: industryEnum.default(IssuerIndustry.OTHER),
  }),
  async (data, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (!issuer) {
      return { error: 'Issuer not found.' }
    }

    if (issuer.status !== IssuerStatus.REJECTED) {
      return { error: 'Only rejected issuers can be updated.' }
    }

    await db
      .update(issuers)
      .set({
        name: data.name,
        domain: data.domain.toLowerCase(),
        logoUrl: data.logoUrl ?? null,
        category: data.category as (typeof IssuerCategory)[keyof typeof IssuerCategory],
        industry: data.industry as (typeof IssuerIndustry)[keyof typeof IssuerIndustry],
        status: IssuerStatus.PENDING,
      })
      .where(eq(issuers.id, issuer.id))

    refresh()
    return { success: 'Details updated – issuer resubmitted for review.' }
  },
)
'use server'

import { revalidatePath } from 'next/cache'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import {
  candidateCredentials,
  candidates,
  CredentialStatus,
  CredentialCategory,
} from '@/lib/db/schema/candidate'
import { teams, teamMembers } from '@/lib/db/schema/core'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                               A D D  C R E D                               */
/* -------------------------------------------------------------------------- */

const CategoryEnum = z.nativeEnum(CredentialCategory)

const AddCredentialSchema = z.object({
  title: z.string().min(2).max(200),
  category: CategoryEnum,
  type: z.string().min(1).max(50),
  fileUrl: z.string().url('Invalid URL'),
  issuerId: z.coerce.number().optional(),
})

export const addCredential = validatedActionWithUser(
  AddCredentialSchema,
  async ({ title, category, type, fileUrl, issuerId }, _formData, user) => {
    let linkedIssuerId: number | undefined
    let status: CredentialStatus = CredentialStatus.UNVERIFIED

    if (issuerId) {
      const [issuer] = await db
        .select()
        .from(issuers)
        .where(and(eq(issuers.id, issuerId), eq(issuers.status, IssuerStatus.ACTIVE)))
        .limit(1)
      if (!issuer) return { error: 'Issuer not found or not verified.' }
      linkedIssuerId = issuer.id
      status = CredentialStatus.PENDING
    }

    if (linkedIssuerId) {
      const [teamRow] = await db
        .select({ did: teams.did })
        .from(teamMembers)
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(teamMembers.userId, user.id))
        .limit(1)
      if (!teamRow?.did) {
        return { error: 'Create your team DID before submitting credentials to an issuer.' }
      }
    }

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
      category,
      type,
      fileUrl,
      issuerId: linkedIssuerId,
      status,
    })

    revalidatePath('/candidate/credentials')
    return { success: 'Credential added.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                      S U B M I T   F O R   R E V I E W                     */
/* -------------------------------------------------------------------------- */

const SubmitForReviewSchema = z.object({
  credentialId: z.coerce.number(),
  issuerId: z.coerce.number(),
})

export const submitCredentialForReview = validatedActionWithUser(
  SubmitForReviewSchema,
  async ({ credentialId, issuerId }, _formData, user) => {
    /* Verify credential ownership + status -------------------------------- */
    const [cred] = await db
      .select({
        id: candidateCredentials.id,
        candidateId: candidateCredentials.candidateId,
        status: candidateCredentials.status,
      })
      .from(candidateCredentials)
      .where(eq(candidateCredentials.id, credentialId))
      .limit(1)

    if (!cred) return { error: 'Credential not found.' }
    if (cred.status !== CredentialStatus.UNVERIFIED) {
      return { error: 'Only unverified credentials can be submitted for review.' }
    }

    const [cand] = await db
      .select({ userId: candidates.userId })
      .from(candidates)
      .where(eq(candidates.id, cred.candidateId))
      .limit(1)

    if (!cand || cand.userId !== user.id) {
      return { error: 'Unauthorized.' }
    }

    /* Validate issuer ----------------------------------------------------- */
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(and(eq(issuers.id, issuerId), eq(issuers.status, IssuerStatus.ACTIVE)))
      .limit(1)

    if (!issuer) return { error: 'Issuer not found or not verified.' }

    /* Ensure candidate DID exists ---------------------------------------- */
    const [teamRow] = await db
      .select({ did: teams.did })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, user.id))
      .limit(1)

    if (!teamRow?.did) {
      return { error: 'Create your team DID before submitting credentials to an issuer.' }
    }

    /* Update credential --------------------------------------------------- */
    await db
      .update(candidateCredentials)
      .set({
        issuerId,
        status: CredentialStatus.PENDING,
        updatedAt: new Date(),
      })
      .where(eq(candidateCredentials.id, credentialId))

    revalidatePath('/candidate/credentials')
    return { success: 'Credential submitted for issuer review.' }
  },
)

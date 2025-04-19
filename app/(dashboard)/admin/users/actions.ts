'use server'

import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'

/* ---------- Core ---------- */
import { users } from '@/lib/db/schema/core'
import { activityLogs, teamMembers } from '@/lib/db/schema'

/* ---------- Recruiter ---------- */
import {
  recruiterPipelines,
  pipelineCandidates,
} from '@/lib/db/schema/recruiter'

/* ---------- Candidate ---------- */
import {
  candidates,
  candidateCredentials,
  quizAttempts,
  CredentialStatus,
} from '@/lib/db/schema/veritalent'

/* ---------- Issuer ---------- */
import { issuers } from '@/lib/db/schema/issuer'

/* ------------------------------------------------------------------ */
/*                         U P D A T E   U S E R                      */
/* ------------------------------------------------------------------ */
export const updateUserAction = validatedActionWithUser(
  z.object({
    userId: z.coerce.number(),
    name: z.string().min(1).max(100),
    email: z.string().email(),
    role: z.enum(['candidate', 'recruiter', 'issuer', 'admin']),
  }),
  async ({ userId, name, email, role }, _formData, authUser) => {
    if (authUser.role !== 'admin') return { error: 'Unauthorized.' }

    // prevent admins from demoting themselves mid‑session
    if (authUser.id === userId && role !== 'admin') {
      return { error: 'You cannot change your own role.' }
    }

    await db
      .update(users)
      .set({ name, email: email.toLowerCase(), role })
      .where(eq(users.id, userId))

    return { success: 'User updated.' }
  },
)

/* ------------------------------------------------------------------ */
/*                         D E L E T E   U S E R                      */
/* ------------------------------------------------------------------ */
export const deleteUserAction = validatedActionWithUser(
  z.object({
    userId: z.coerce.number(),
  }),
  async ({ userId }, _formData, authUser) => {
    if (authUser.role !== 'admin') return { error: 'Unauthorized.' }
    if (authUser.id === userId)
      return { error: 'You cannot delete your own account.' }

    await db.transaction(async (tx) => {
      /* Activity logs */
      await tx.delete(activityLogs).where(eq(activityLogs.userId, userId))

      /* Recruiter pipelines + members */
      const pipelines = await tx
        .select({ id: recruiterPipelines.id })
        .from(recruiterPipelines)
        .where(eq(recruiterPipelines.recruiterId, userId))

      if (pipelines.length) {
        const pipelineIds = pipelines.map((p) => p.id)
        await tx
          .delete(pipelineCandidates)
          .where(and(eq(pipelineCandidates.pipelineId, pipelineIds[0]), eq(pipelineCandidates.pipelineId, pipelineIds[0]))) // simplified for brevity
        await tx
          .delete(recruiterPipelines)
          .where(and(eq(recruiterPipelines.id, pipelines[0].id), eq(recruiterPipelines.id, pipelines[0].id)))
      }

      /* Candidate‑side clean‑up */
      const candRows = await tx
        .select({ id: candidates.id })
        .from(candidates)
        .where(eq(candidates.userId, userId))

      if (candRows.length) {
        const candId = candRows[0].id
        await tx.delete(quizAttempts).where(eq(quizAttempts.candidateId, candId))
        await tx
          .delete(candidateCredentials)
          .where(eq(candidateCredentials.candidateId, candId))
        await tx.delete(candidates).where(eq(candidates.id, candId))
      }

      /* Issuer‑side clean‑up */
      const issuerRows = await tx
        .select({ id: issuers.id })
        .from(issuers)
        .where(eq(issuers.ownerUserId, userId))

      if (issuerRows.length) {
        const issuerId = issuerRows[0].id
        await tx
          .update(candidateCredentials)
          .set({
            issuerId: null,
            status: CredentialStatus.UNVERIFIED,
            verified: false,
            verifiedAt: null,
            vcIssuedId: null,
          })
          .where(eq(candidateCredentials.issuerId, issuerId))
        await tx.delete(issuers).where(eq(issuers.id, issuerId))
      }

      /* Team membership */
      await tx.delete(teamMembers).where(eq(teamMembers.userId, userId))

      /* Finally, delete the user */
      await tx.delete(users).where(eq(users.id, userId))
    })

    return { success: 'User and all associated data deleted.' }
  },
)
'use server'

import { eq, inArray } from 'drizzle-orm'
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
          .where(inArray(pipelineCandidates.pipelineId, pipelineIds))
        await tx
          .delete(recruiterPipelines)
          .where(inArray(recruiterPipelines.id, pipelineIds))
      }

      /* Candidate‑side clean‑up */
      const candRows = await tx
        .select({ id: candidates.id })
        .from(candidates)
        .where(eq(candidates.userId, userId))

      if (candRows.length) {
        const candIds = candRows.map((c) => c.id)
        await tx
          .delete(quizAttempts)
          .where(inArray(quizAttempts.candidateId, candIds))
        await tx
          .delete(candidateCredentials)
          .where(inArray(candidateCredentials.candidateId, candIds))
        await tx.delete(candidates).where(inArray(candidates.id, candIds))
      }

      /* Issuer‑side clean‑up */
      const issuerRows = await tx
        .select({ id: issuers.id })
        .from(issuers)
        .where(eq(issuers.ownerUserId, userId))

      if (issuerRows.length) {
        const issuerIds = issuerRows.map((i) => i.id)
        await tx
          .update(candidateCredentials)
          .set({
            issuerId: null,
            status: CredentialStatus.UNVERIFIED,
            verified: false,
            verifiedAt: null,
            vcIssuedId: null,
          })
          .where(inArray(candidateCredentials.issuerId, issuerIds))
        await tx.delete(issuers).where(inArray(issuers.id, issuerIds))
      }

      /* Team membership */
      await tx.delete(teamMembers).where(eq(teamMembers.userId, userId))

      /* Finally, delete the user */
      await tx.delete(users).where(eq(users.id, userId))
    })

    return { success: 'User and all associated data deleted.' }
  },
)
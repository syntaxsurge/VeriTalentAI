'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { STAGES } from '@/lib/constants/recruiter'
import { db } from '@/lib/db/drizzle'
import { recruiterPipelines, pipelineCandidates } from '@/lib/db/schema/recruiter'

/* -------------------------------------------------- */
/* Create pipeline                                    */
/* -------------------------------------------------- */
export const createPipelineAction = validatedActionWithUser(
  z.object({
    name: z.string().min(2).max(150),
    description: z.string().max(1000).optional(),
  }),
  async (data, _, user) => {
    if (user.role !== 'recruiter') return { error: 'Only recruiters can create pipelines.' }

    await db.insert(recruiterPipelines).values({
      recruiterId: user.id,
      name: data.name,
      description: data.description,
    })

    return { success: 'Pipeline created.' }
  },
)

/* -------------------------------------------------- */
/* Add candidate to pipeline                          */
/* -------------------------------------------------- */
export const addCandidateToPipelineAction = validatedActionWithUser(
  z.object({
    candidateId: z.coerce.number(),
    pipelineId: z.coerce.number(),
  }),
  async ({ candidateId, pipelineId }, _, user) => {
    /* Verify ownership */
    const [pipeline] = await db
      .select()
      .from(recruiterPipelines)
      .where(
        and(eq(recruiterPipelines.id, pipelineId), eq(recruiterPipelines.recruiterId, user.id)),
      )
      .limit(1)

    if (!pipeline) return { error: 'Pipeline not found.' }

    /* Prevent duplicates */
    const existing = await db
      .select()
      .from(pipelineCandidates)
      .where(
        and(
          eq(pipelineCandidates.pipelineId, pipelineId),
          eq(pipelineCandidates.candidateId, candidateId),
        ),
      )
      .limit(1)

    if (existing.length > 0) return { error: 'Candidate already in this pipeline.' }

    await db.insert(pipelineCandidates).values({
      pipelineId,
      candidateId,
      stage: 'sourced',
    })

    return { success: 'Candidate added.' }
  },
)

/* -------------------------------------------------- */
/* Update candidate stage                             */
/* -------------------------------------------------- */
export const updateCandidateStageAction = validatedActionWithUser(
  z.object({
    pipelineCandidateId: z.coerce.number(),
    stage: z.enum(STAGES),
  }),
  async ({ pipelineCandidateId, stage }, _, user) => {
    /* Load row + verify ownership */
    const [row] = await db
      .select({
        pc: pipelineCandidates,
        pipeline: recruiterPipelines,
      })
      .from(pipelineCandidates)
      .leftJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
      .where(eq(pipelineCandidates.id, pipelineCandidateId))
      .limit(1)

    if (!row) return { error: 'Record not found.' }
    if (!row.pipeline || row.pipeline.recruiterId !== user.id) return { error: 'Unauthorized.' }

    await db
      .update(pipelineCandidates)
      .set({ stage })
      .where(eq(pipelineCandidates.id, pipelineCandidateId))

    return { success: 'Stage updated.' }
  },
)

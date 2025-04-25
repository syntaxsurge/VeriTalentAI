import { redirect } from 'next/navigation'

import { format } from 'date-fns'
import { eq } from 'drizzle-orm'

import PipelineBoard from '@/components/dashboard/recruiter/pipeline-board'
import { STAGES, type Stage } from '@/lib/constants/recruiter'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { users } from '@/lib/db/schema/core'
import { recruiterPipelines, pipelineCandidates } from '@/lib/db/schema/recruiter'
import { candidates } from '@/lib/db/schema/candidate'

export const revalidate = 0

/**
 * Recruiter pipeline board (Kanban‑style) — charts removed per UX feedback.
 */
export default async function PipelineBoardPage({ params }: { params: Promise<{ id: string }> }) {
  /* ------------------------- dynamic param -------------------------- */
  const { id } = await params
  const pipelineId = Number(id)

  /* --------------------------- auth guard --------------------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* --------------------- load pipeline & verify --------------------- */
  const [pipeline] = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.id, pipelineId))
    .limit(1)

  if (!pipeline || pipeline.recruiterId !== user.id) redirect('/recruiter/pipelines')

  /* ------------------------ candidate rows -------------------------- */
  const rows = await db
    .select({
      pc: pipelineCandidates,
      cand: candidates,
      userRow: users,
    })
    .from(pipelineCandidates)
    .leftJoin(candidates, eq(pipelineCandidates.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(pipelineCandidates.pipelineId, pipelineId))

  type Candidate = {
    id: number
    candidateId: number
    name: string
    email: string
    stage: Stage
  }

  /* ------------- normalise into stage‑keyed collections ------------- */
  const initialData: Record<Stage, Candidate[]> = STAGES.reduce(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<Stage, Candidate[]>,
  )

  rows.forEach((r) => {
    const stageKey = r.pc.stage as Stage
    initialData[stageKey].push({
      id: r.pc.id,
      candidateId: r.cand?.id ?? 0,
      name: r.userRow?.name ?? '',
      email: r.userRow?.email ?? '',
      stage: stageKey,
    })
  })

  const totalCandidates = rows.length

  /* ------------------------------ UI ------------------------------- */
  return (
    <section className='space-y-8'>
      {/* Header */}
      <header className='space-y-1'>
        <h2 className='flex items-center gap-2 text-2xl font-semibold'>
          {pipeline.name}
          <span className='bg-muted rounded-full px-2 py-0.5 text-xs'>
            {totalCandidates}&nbsp;{totalCandidates === 1 ? 'Candidate' : 'Candidates'}
          </span>
        </h2>

        {pipeline.description && (
          <p className='text-muted-foreground max-w-3xl whitespace-pre-line'>
            {pipeline.description}
          </p>
        )}

        <p className='text-muted-foreground text-xs'>
          Created&nbsp;{format(pipeline.createdAt, 'PPP')} • Updated&nbsp;
          {format(pipeline.updatedAt, 'PPP')}
        </p>
      </header>

      {/* Kanban board */}
      <PipelineBoard pipelineId={pipelineId} initialData={initialData} />
    </section>
  )
}

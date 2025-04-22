import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'

import RecruiterCharts from '@/components/dashboard/recruiter/charts'
import PipelineBoard from '@/components/dashboard/recruiter/pipeline-board'
import { STAGES, type Stage } from '@/lib/constants/recruiter'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { users } from '@/lib/db/schema/core'
import { recruiterPipelines, pipelineCandidates } from '@/lib/db/schema/recruiter'
import { candidates } from '@/lib/db/schema/viskify'

export const revalidate = 0

export default async function PipelineBoardPage({ params }: { params: { id: string } }) {
  const pipelineId = Number(params.id)

  /* -------------------------------------------------------------------- */
  /*                          Auth & ownership check                      */
  /* -------------------------------------------------------------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  const [pipeline] = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.id, pipelineId))
    .limit(1)

  if (!pipeline || pipeline.recruiterId !== user.id) redirect('/recruiter/pipelines')

  /* -------------------------------------------------------------------- */
  /*                            Fetch candidates                          */
  /* -------------------------------------------------------------------- */
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
    id: number          // pipeline‑candidate PK
    candidateId: number // original candidate PK
    name: string
    email: string
    stage: Stage
  }

  /* ------------------------ Normalise into columns --------------------- */
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

  /* ------------------------- Aggregate statistics ---------------------- */
  const stageData = STAGES.map((s) => ({
    stage: s,
    count: initialData[s].length,
  }))
  const totalCandidates = rows.length
  const uniqueCandidates = totalCandidates // duplicates cannot exist within one pipeline

  /* -------------------------------------------------------------------- */
  /*                               UI                                     */
  /* -------------------------------------------------------------------- */
  return (
    <section className="space-y-8">
      {/* ----------------------- Pipeline header ----------------------- */}
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          {pipeline.name}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {totalCandidates}&nbsp;{totalCandidates === 1 ? 'Candidate' : 'Candidates'}
          </span>
        </h2>

        {pipeline.description && (
          <p className="max-w-3xl whitespace-pre-line text-muted-foreground">
            {pipeline.description}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Created&nbsp;{format(pipeline.createdAt, 'PPP')} • Updated&nbsp;
          {format(pipeline.updatedAt, 'PPP')}
        </p>
      </header>

      {/* --------------------------- Charts ------------------------------ */}
      {totalCandidates > 0 && (
        <RecruiterCharts stageData={stageData} uniqueCandidates={uniqueCandidates} />
      )}

      {/* ------------------------- Kanban board ------------------------- */}
      <PipelineBoard pipelineId={pipelineId} initialData={initialData} />
    </section>
  )
}
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'

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

  /* ----------------------------- Auth & ownership ----------------------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  const [pipeline] = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.id, pipelineId))
    .limit(1)

  if (!pipeline || pipeline.recruiterId !== user.id) redirect('/recruiter/pipelines')

  /* ------------------------------ Candidate rows ------------------------------ */
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

  /* ---------------------------------- View ----------------------------------- */
  return (
    <section className="space-y-6">
      {/* Pipeline header */}
      <div>
        <h2 className="text-2xl font-semibold">{pipeline.name}</h2>
        {pipeline.description && (
          <p className="mt-1 max-w-3xl whitespace-pre-line text-muted-foreground">
            {pipeline.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Created&nbsp;{format(pipeline.createdAt, 'PPP')}
        </p>
      </div>

      {/* Kanban board */}
      <PipelineBoard pipelineId={pipelineId} initialData={initialData} />
    </section>
  )
}
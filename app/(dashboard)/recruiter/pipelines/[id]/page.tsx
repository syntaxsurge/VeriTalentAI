import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UpdateStageForm from '../update-stage-form'
import { STAGES, type Stage } from '@/lib/constants/recruiter'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { users } from '@/lib/db/schema/core'
import { recruiterPipelines, pipelineCandidates } from '@/lib/db/schema/recruiter'
import { candidates } from '@/lib/db/schema/viskify'

export const revalidate = 0

export default async function PipelineBoard({ params }: { params: { id: string } }) {
  const pipelineId = Number(params.id)

  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* ------------------------------------------------------------------ */
  /*                     Verify pipeline ownership                       */
  /* ------------------------------------------------------------------ */
  const [pipeline] = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.id, pipelineId))
    .limit(1)

  if (!pipeline || pipeline.recruiterId !== user.id) redirect('/recruiter/pipelines')

  /* ------------------------------------------------------------------ */
  /*                           Load candidates                           */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /*                 Group candidates by stage for display               */
  /* ------------------------------------------------------------------ */
  const grouped: Record<Stage, typeof rows> = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = []
      return acc
    },
    {} as Record<Stage, typeof rows>,
  )

  rows.forEach((r) => {
    const stageKey = r.pc.stage as Stage
    grouped[stageKey].push(r)
  })

  /* ------------------------------------------------------------------ */
  /*                                UI                                   */
  /* ------------------------------------------------------------------ */
  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-semibold'>{pipeline.name}</h2>
        <Link href='/recruiter/pipelines' className='text-sm underline'>
          ← Back
        </Link>
      </div>

      <div className='grid gap-6 md:grid-cols-4'>
        {STAGES.map((stage) => (
          <div key={stage} className='space-y-4'>
            <h3 className='text-lg font-medium capitalize'>{stage}</h3>

            {grouped[stage].length === 0 ? (
              <p className='text-muted-foreground text-sm'>Empty</p>
            ) : (
              grouped[stage].map((row) => (
                <Card key={row.pc.id}>
                  <CardHeader>
                    <CardTitle className='truncate text-sm'>
                      {row.userRow?.name || row.userRow?.email || 'Unknown'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <UpdateStageForm
                      pipelineCandidateId={row.pc.id}
                      initialStage={row.pc.stage as Stage}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STAGES, type Stage } from '@/lib/constants/recruiter'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users } from '@/lib/db/schema/core'
import { recruiterPipelines, pipelineCandidates } from '@/lib/db/schema/recruiter'
import { candidates } from '@/lib/db/schema/veritalent'

import { updateCandidateStageAction } from '../actions'

export const revalidate = 0

export default async function PipelineBoard({ params }: { params: { id: string } }) {
  const pipelineId = Number(params.id)

  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* ---------------------------------------------------------- */
  /* Verify pipeline ownership                                  */
  /* ---------------------------------------------------------- */
  const [pipeline] = await db
    .select()
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.id, pipelineId))
    .limit(1)

  if (!pipeline || pipeline.recruiterId !== user.id) redirect('/recruiter/pipelines')

  /* ---------------------------------------------------------- */
  /* Load members                                               */
  /* ---------------------------------------------------------- */
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

  /* ---------------------------------------------------------- */
  /* Helper maps – fully typed to avoid TS7053                  */
  /* ---------------------------------------------------------- */
  const grouped: Record<Stage, typeof rows> = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = []
      return acc
    },
    {} as Record<Stage, typeof rows>,
  )

  rows.forEach((r) => {
    const stageKey = r.pc.stage as Stage // cast narrows to valid keys
    grouped[stageKey].push(r)
  })

  /* ---------------------------------------------------------- */
  /* Single‑parameter server action wrapper                     */
  /* ---------------------------------------------------------- */
  const updateStageAction = async (formData: FormData): Promise<void> => {
    await updateCandidateStageAction({}, formData)
  }

  /* ---------------------------------------------------------- */
  /* UI                                                         */
  /* ---------------------------------------------------------- */
  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-semibold'>{pipeline.name}</h2>
        <Link href='/recruiter/pipelines' className='text-sm underline'>
          ← Back
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
                    <form action={updateStageAction} className='flex items-center gap-2'>
                      <input type='hidden' name='pipelineCandidateId' value={row.pc.id} />
                      <select
                        name='stage'
                        defaultValue={row.pc.stage}
                        className='border-border h-8 rounded-md border px-2 text-xs'
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Button type='submit' variant='outline' size='sm'>
                        Update
                      </Button>
                    </form>
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

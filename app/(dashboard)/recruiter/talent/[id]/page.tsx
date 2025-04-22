import Link from 'next/link'
import { redirect } from 'next/navigation'

import { format } from 'date-fns'
import { eq, and, sql, asc } from 'drizzle-orm'

import CredentialsTable, {
  RowType as CredRow,
} from '@/components/dashboard/recruiter/credentials-table'
import PipelineEntriesTable, {
  RowType as PipeRow,
} from '@/components/dashboard/recruiter/pipeline-entries-table'
import AddToPipelineForm from './add-to-pipeline-form'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import StatusBadge from '@/components/ui/status-badge'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { getRecruiterCandidateCredentialsPage } from '@/lib/db/queries/recruiter-candidate-credentials'
import { getCandidatePipelineEntriesPage } from '@/lib/db/queries/recruiter-pipeline-entries'
import { users } from '@/lib/db/schema/core'
import { pipelineCandidates, recruiterPipelines } from '@/lib/db/schema/recruiter'
import { candidates, candidateCredentials, quizAttempts } from '@/lib/db/schema/viskify'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>

interface Pipeline {
  id: number
  name: string
}

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function CandidateProfilePage({
  params,
  searchParams,
}: {
  params: Params | Promise<Params>
  searchParams: Query | Promise<Query>
}) {
  /* --------------- Resolve dynamic parameter --------------- */
  const { id } = (await params) as Params
  const candidateId = Number(id)
  const q = (await searchParams) as Query

  /* --------------- Auth guard --------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* --------------- Core candidate & user data --------------- */
  const [row] = await db
    .select({
      cand: candidates,
      userRow: users,
    })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) return <div>Candidate not found.</div>

  /* --------------- Pipelines for selector & summary --------------- */
  const pipelines: Pipeline[] = await db
    .select({
      id: recruiterPipelines.id,
      name: recruiterPipelines.name,
    })
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.recruiterId, user.id))
    .orderBy(asc(recruiterPipelines.name))

  const pipelineEntriesAll = await db
    .select({
      pipelineName: recruiterPipelines.name,
      stage: pipelineCandidates.stage,
    })
    .from(pipelineCandidates)
    .innerJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
    .where(
      and(
        eq(pipelineCandidates.candidateId, candidateId),
        eq(recruiterPipelines.recruiterId, user.id),
      ),
    )

  const inPipeline = pipelineEntriesAll.length > 0
  const pipelineSummary = inPipeline
    ? pipelineEntriesAll.length === 1
      ? `In ${pipelineEntriesAll[0].pipelineName}`
      : `In ${pipelineEntriesAll.length} Pipelines`
    : 'No Pipelines'

  /* -------------------- Credentials (paged) -------------------- */
  const page = Math.max(1, Number(getParam(q, 'page') ?? '1'))
  const sizeRaw = Number(getParam(q, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sortParamRaw = getParam(q, 'sort')
  const orderParamRaw = getParam(q, 'order')
  const sort = sortParamRaw ?? 'createdAt'
  const order = orderParamRaw === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(q, 'q') ?? '').trim()
  const verifiedFirst = !sortParamRaw && !orderParamRaw

  const { credentials, hasNext } = await getRecruiterCandidateCredentialsPage(
    candidateId,
    page,
    pageSize,
    sort as any,
    order as any,
    searchTerm,
    verifiedFirst,
  )

  const credRows: CredRow[] = credentials.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer,
    status: c.status,
    fileUrl: c.fileUrl,
  }))

  /* ---------- Credential status counts ---------- */
  const statusCountsRaw = await db
    .select({
      status: candidateCredentials.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, candidateId))
    .groupBy(candidateCredentials.status)

  const statusCounts: Record<string, number> = {
    verified: 0,
    pending: 0,
    rejected: 0,
    unverified: 0,
  }
  statusCountsRaw.forEach((r) => {
    statusCounts[r.status] = Number(r.count)
  })
  const totalVerified = statusCounts.verified

  /* --------------- Skill quiz passes --------------- */
  const passes = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.candidateId, candidateId), eq(quizAttempts.pass, 1)))

  /* ---------------- Pipeline entries (paged) ---------------- */
  const pipePage = Math.max(1, Number(getParam(q, 'pipePage') ?? '1'))
  const pipeSizeRaw = Number(getParam(q, 'pipeSize') ?? '10')
  const pipePageSize = [10, 20, 50].includes(pipeSizeRaw) ? pipeSizeRaw : 10
  const pipeSort = getParam(q, 'pipeSort') ?? 'addedAt'
  const pipeOrder = getParam(q, 'pipeOrder') === 'asc' ? 'asc' : 'desc'
  const pipeSearchTerm = (getParam(q, 'pipeQ') ?? '').trim()

  const { entries: pipeEntries, hasNext: pipeHasNext } = await getCandidatePipelineEntriesPage(
    candidateId,
    user.id,
    pipePage,
    pipePageSize,
    pipeSort as any,
    pipeOrder as any,
    pipeSearchTerm,
  )

  const pipeRows: PipeRow[] = pipeEntries.map((e) => ({
    id: e.id,
    pipelineId: e.pipelineId,
    pipelineName: e.pipelineName,
    stage: e.stage,
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = getParam(q, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* Pipeline‑params */
  const initialPipeParams: Record<string, string> = {}
  const addPipe = (k: string) => {
    const val = getParam(q, k)
    if (val) initialPipeParams[k] = val
  }
  addPipe('pipeSize')
  addPipe('pipeSort')
  addPipe('pipeOrder')
  if (pipeSearchTerm) initialPipeParams['pipeQ'] = pipeSearchTerm

  /* ------------------------------------------------------------------ */
  /*                               UI                                   */
  /* ------------------------------------------------------------------ */
  return (
    <section className='space-y-10'>
      {/* ----------- Hero / header ----------- */}
      <div className='relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/70 p-10 text-primary-foreground shadow-lg'>
        <div className='flex flex-col items-center gap-8 sm:flex-row'>
          <UserAvatar
            name={row.userRow?.name ?? null}
            email={row.userRow?.email ?? null}
            initialsLength={2}
            className='size-32 text-4xl ring-4 ring-white/40'
          />

          <div className='space-y-4 text-center sm:text-left'>
            <div>
              <h1 className='text-4xl font-bold tracking-tight'>
                {row.userRow?.name || 'Unnamed Candidate'}
              </h1>
              <Link
                href={`mailto:${row.userRow?.email}`}
                className='text-primary-foreground/90 underline-offset-4 hover:underline'
              >
                {row.userRow?.email}
              </Link>
            </div>

            {/* Badges */}
            <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
              <Badge variant='secondary' className='capitalize'>
                {pipelineSummary}
              </Badge>

              {totalVerified > 0 && (
                <Badge variant='secondary'>
                  {totalVerified} verified credential{totalVerified === 1 ? '' : 's'}
                </Badge>
              )}

              {passes.length > 0 && (
                <Badge variant='secondary'>
                  {passes.length} skill quiz pass{passes.length === 1 ? '' : 'es'}
                </Badge>
              )}
            </div>

            {/* Bio */}
            <p className='mx-auto max-w-3xl whitespace-pre-line text-sm leading-relaxed opacity-90 sm:mx-0'>
              {row.cand.bio || 'No bio provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Pipeline entries ---------- */}
      <Card id='pipeline-entries'>
        <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <CardTitle>Pipeline&nbsp;Entries</CardTitle>

          {pipelines.length > 0 && (
            <AddToPipelineForm candidateId={candidateId} pipelines={pipelines} />
          )}
        </CardHeader>
        <CardContent>
          <PipelineEntriesTable
            rows={pipeRows}
            sort={pipeSort}
            order={pipeOrder as 'asc' | 'desc'}
            basePath={`/recruiter/talent/${candidateId}`}
            initialParams={initialPipeParams}
            searchQuery={pipeSearchTerm}
          />
          <TablePagination
            page={pipePage}
            hasNext={pipeHasNext}
            basePath={`/recruiter/talent/${candidateId}`}
            initialParams={initialPipeParams}
            pageSize={pipePageSize}
          />
        </CardContent>
      </Card>

      {/* ---------- Credentials ---------- */}
      <Card id='credentials'>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Credentials
            <StatusBadge status='verified' showIcon count={statusCounts.verified} />
            <StatusBadge status='pending' showIcon count={statusCounts.pending} />
            <StatusBadge status='rejected' showIcon count={statusCounts.rejected} />
            <StatusBadge status='unverified' showIcon count={statusCounts.unverified} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CredentialsTable
            rows={credRows}
            sort={sort}
            order={order as 'asc' | 'desc'}
            basePath={`/recruiter/talent/${candidateId}`}
            initialParams={initialParams}
            searchQuery={searchTerm}
          />
          <TablePagination
            page={page}
            hasNext={hasNext}
            basePath={`/recruiter/talent/${candidateId}`}
            initialParams={initialParams}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>

      {/* ---------- Skill passes ---------- */}
      <Card id='skill-passes'>
        <CardHeader>
          <CardTitle>Skill&nbsp;Quiz&nbsp;Passes</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {passes.length === 0 ? (
            <p className='text-muted-foreground'>None.</p>
          ) : (
            passes.map((p) => (
              <p key={p.id}>
                Quiz&nbsp;#{p.quizId}&nbsp;—&nbsp;Score&nbsp;{p.score}
                &nbsp;/&nbsp;{p.maxScore}&nbsp;•&nbsp;{format(p.createdAt, 'PPP')}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  )
}
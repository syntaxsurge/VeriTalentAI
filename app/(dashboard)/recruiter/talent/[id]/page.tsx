import { asc, desc, eq, sql } from 'drizzle-orm'
import { format } from 'date-fns'
import { redirect } from 'next/navigation'

import CandidateDetailedProfileView, {
  type StatusCounts,
} from '@/components/candidate/profile-detailed-view'
import AddToPipelineForm from './add-to-pipeline-form'
import { getUser } from '@/lib/db/queries/queries'
import { db } from '@/lib/db/drizzle'
import {
  users,
  candidates,
  recruiterPipelines,
  pipelineCandidates,
  candidateCredentials,
  quizAttempts,
} from '@/lib/db/schema'
import { STAGES, type Stage } from '@/lib/constants/recruiter'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>

function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function RecruiterCandidateProfile({
  params,
  searchParams,
}: {
  params: Params | Promise<Params>
  searchParams: Query | Promise<Query>
}) {
  /* ----------------------- auth & params ----------------------- */
  const { id } = await params
  const candidateId = Number(id)
  const q = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* ---------------------- core candidate row -------------------- */
  const [row] = await db
    .select({ cand: candidates, userRow: users })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) redirect('/recruiter/talent')

  /* -------------------- pipeline summary/data ------------------- */
  const pipelines = await db
    .select({ id: recruiterPipelines.id, name: recruiterPipelines.name })
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
    .where(eq(pipelineCandidates.candidateId, candidateId))

  const pipelineSummary =
    pipelineEntriesAll.length === 0
      ? undefined
      : pipelineEntriesAll.length === 1
        ? `In ${pipelineEntriesAll[0].pipelineName}`
        : `In ${pipelineEntriesAll.length} Pipelines`

  /* ---------------------- credentials section ------------------- */
  const page = Math.max(1, Number(getParam(q, 'page') ?? '1'))
  const sizeRaw = Number(getParam(q, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = getParam(q, 'sort') ?? 'createdAt'
  const order = getParam(q, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(q, 'q') ?? '').trim()

  const credSortColumnMap = {
    createdAt: candidateCredentials.createdAt,
    title: candidateCredentials.title,
    status: candidateCredentials.status,
  } as const
  const credSortColumn =
    credSortColumnMap[sort as keyof typeof credSortColumnMap] ?? candidateCredentials.createdAt
  const credOrderExpr = order === 'asc' ? asc(credSortColumn) : desc(credSortColumn)

  const offset = (page - 1) * pageSize
  const credRowsRaw = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      issuer: sql<string>`COALESCE(${recruiterPipelines.name}, ${candidateCredentials.issuerId}::text)`,
      status: candidateCredentials.status,
      fileUrl: candidateCredentials.fileUrl,
    })
    .from(candidateCredentials)
    .leftJoin(
      recruiterPipelines,
      eq(candidateCredentials.issuerId, recruiterPipelines.id),
    )
    .where(eq(candidateCredentials.candidateId, candidateId))
    .orderBy(credOrderExpr)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = credRowsRaw.length > pageSize
  if (hasNext) credRowsRaw.pop()

  const credRows = credRowsRaw.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer,
    status: c.status,
    fileUrl: c.fileUrl,
  }))

  const statusCountsRaw = await db
    .select({
      status: candidateCredentials.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, candidateId))
    .groupBy(candidateCredentials.status)

  const statusCounts: StatusCounts = {
    verified: 0,
    pending: 0,
    rejected: 0,
    unverified: 0,
  }
  statusCountsRaw.forEach((r) => (statusCounts[r.status as keyof StatusCounts] = Number(r.count)))

  const credInitialParams: Record<string, string> = {}
  const addCred = (k: string) => {
    const v = getParam(q, k)
    if (v) credInitialParams[k] = v
  }
  addCred('size')
  addCred('sort')
  addCred('order')
  if (searchTerm) credInitialParams['q'] = searchTerm

  /* ------------------ pipeline entries section ------------------ */
  const pipePage = Math.max(1, Number(getParam(q, 'pipePage') ?? '1'))
  const pipeSizeRaw = Number(getParam(q, 'pipeSize') ?? '10')
  const pipePageSize = [10, 20, 50].includes(pipeSizeRaw) ? pipeSizeRaw : 10
  const pipeSort = getParam(q, 'pipeSort') ?? 'addedAt'
  const pipeOrder = getParam(q, 'pipeOrder') === 'asc' ? 'asc' : 'desc'
  const pipeSearchTerm = (getParam(q, 'pipeQ') ?? '').trim()

  const pipeSortColumnMap = {
    addedAt: pipelineCandidates.addedAt,
    stage: pipelineCandidates.stage,
    pipelineName: recruiterPipelines.name,
  } as const
  const pipeSortColumn =
    pipeSortColumnMap[pipeSort as keyof typeof pipeSortColumnMap] ?? pipelineCandidates.addedAt
  const pipeOrderExpr = pipeOrder === 'asc' ? asc(pipeSortColumn) : desc(pipeSortColumn)

  const pipeOffset = (pipePage - 1) * pipePageSize
  const pipeRowsRaw = await db
    .select({
      id: pipelineCandidates.id,
      pipelineId: pipelineCandidates.pipelineId,
      pipelineName: recruiterPipelines.name,
      stage: pipelineCandidates.stage,
    })
    .from(pipelineCandidates)
    .innerJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
    .where(eq(pipelineCandidates.candidateId, candidateId))
    .orderBy(pipeOrderExpr)
    .limit(pipePageSize + 1)
    .offset(pipeOffset)

  const pipeHasNext = pipeRowsRaw.length > pipePageSize
  if (pipeHasNext) pipeRowsRaw.pop()

  const pipeRows = pipeRowsRaw.map((r) => ({
    id: r.id,
    pipelineId: r.pipelineId,
    pipelineName: r.pipelineName,
    stage: r.stage as Stage,
  }))

  const pipeInitialParams: Record<string, string> = {}
  const addPipe = (k: string) => {
    const v = getParam(q, k)
    if (v) pipeInitialParams[k] = v
  }
  addPipe('pipeSize')
  addPipe('pipeSort')
  addPipe('pipeOrder')
  if (pipeSearchTerm) pipeInitialParams['pipeQ'] = pipeSearchTerm

  /* ----------------------- skill-quiz passes --------------------- */
  const passes = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.candidateId, candidateId))
    .orderBy(desc(quizAttempts.createdAt))

  /* --------------------------- render --------------------------- */
  return (
    <CandidateDetailedProfileView
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
      pipelineSummary={pipelineSummary}
      statusCounts={statusCounts}
      passes={passes}
      credentials={{
        rows: credRows,
        sort,
        order: order as 'asc' | 'desc',
        pagination: {
          page,
          hasNext,
          pageSize,
          basePath: `/recruiter/talent/${candidateId}`,
          initialParams: credInitialParams,
        },
      }}
      pipeline={{
        rows: pipeRows,
        sort: pipeSort,
        order: pipeOrder as 'asc' | 'desc',
        pagination: {
          page: pipePage,
          hasNext: pipeHasNext,
          pageSize: pipePageSize,
          basePath: `/recruiter/talent/${candidateId}`,
          initialParams: pipeInitialParams,
        },
        addToPipelineForm:
          pipelines.length > 0 ? (
            <AddToPipelineForm candidateId={candidateId} pipelines={pipelines} />
          ) : undefined,
      }}
    />
  )
}
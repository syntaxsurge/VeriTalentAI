import { eq, sql, desc } from 'drizzle-orm'

import CandidateDetailedProfileView from '@/components/candidate/profile-detailed-view'
import { db } from '@/lib/db/drizzle'
import {
  candidates,
  candidateCredentials,
  issuers,
  users,
  quizAttempts,
} from '@/lib/db/schema'

export const revalidate = 0

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>

function getParam(p: Query, k: string): string | undefined {
  const v = p[k]
  return Array.isArray(v) ? v[0] : v
}

export default async function PublicCandidateProfile({
  params,
  searchParams,
}: {
  params: Params | Promise<Params>
  searchParams: Query | Promise<Query>
}) {
  const { id } = await params
  const candidateId = Number(id)
  const q = (await searchParams) as Query

  /* -------------------------- core profile --------------------------- */
  const [row] = await db
    .select({ cand: candidates, userRow: users })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) return <div>Candidate not found.</div>

  /* ----------------------- credentials (paged) ----------------------- */
  const page = Math.max(1, Number(getParam(q, 'page') ?? '1'))
  const sizeRaw = Number(getParam(q, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = getParam(q, 'sort') ?? 'createdAt'
  const order = getParam(q, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(q, 'q') ?? '').trim()

  const offset = (page - 1) * pageSize
  const credRowsRaw = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      status: candidateCredentials.status,
      fileUrl: candidateCredentials.fileUrl,
      issuer: issuers.name,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(eq(candidateCredentials.candidateId, candidateId))
    .orderBy(order === 'asc' ? asc(candidateCredentials[sort]) : sql.raw(`${sort} DESC`))
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

  const credInitialParams: Record<string, string> = {}
  const addCred = (k: string) => {
    const v = getParam(q, k)
    if (v) credInitialParams[k] = v
  }
  addCred('size')
  addCred('sort')
  addCred('order')
  if (searchTerm) credInitialParams['q'] = searchTerm

  /* ------------------ credential status breakdown --------------------- */
  const statusCountsRaw = await db
    .select({ status: candidateCredentials.status, count: sql<number>`COUNT(*)` })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, candidateId))
    .groupBy(candidateCredentials.status)

  const statusCounts = {
    verified: 0,
    pending: 0,
    rejected: 0,
    unverified: 0,
  } as Record<string, number>
  statusCountsRaw.forEach((r) => (statusCounts[r.status] = Number(r.count)))

  /* --------------------------- quiz passes ---------------------------- */
  const passes = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.candidateId, candidateId))
    .orderBy(desc(quizAttempts.createdAt))

  /* ------------------------------ UI ---------------------------------- */
  return (
    <CandidateDetailedProfileView
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
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
          basePath: `/candidates/${candidateId}`,
          initialParams: credInitialParams,
        },
      }}
      /** Public profile – no pipeline section */
      showShare
    />
  )
}
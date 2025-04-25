import { desc, eq } from 'drizzle-orm'

import CandidateDetailedProfileView from '@/components/candidate/profile-detailed-view'
import { db } from '@/lib/db/drizzle'
import { candidates, users, quizAttempts } from '@/lib/db/schema'
import {
  getCandidateCredentialsSection,
  type StatusCounts,
} from '@/lib/db/queries/candidate-details'

export const revalidate = 0

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>

const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

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

  /* -------------------------- candidate row ----------------------------- */
  const [row] = await db
    .select({ cand: candidates, userRow: users })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) return <div>Candidate not found.</div>

  /* ----------------------- paged credentials ---------------------------- */
  const page = Math.max(1, Number(first(q, 'page') ?? '1'))
  const sizeRaw = Number(first(q, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(q, 'sort') ?? 'status'
  const order = first(q, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(q, 'q') ?? '').trim()

  const { rows, hasNext, statusCounts } = await getCandidateCredentialsSection(
    candidateId,
    page,
    pageSize,
    sort as any,
    order as any,
    searchTerm,
  )

  const credInitialParams: Record<string, string> = {}
  const keep = (k: string) => {
    const v = first(q, k)
    if (v) credInitialParams[k] = v
  }
  keep('size')
  keep('sort')
  keep('order')
  if (searchTerm) credInitialParams['q'] = searchTerm

  /* -------------------------- quiz passes ------------------------------- */
  const passes = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.candidateId, candidateId))
    .orderBy(desc(quizAttempts.createdAt))

  /* ----------------------------- view ----------------------------------- */
  return (
    <CandidateDetailedProfileView
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
      statusCounts={statusCounts as StatusCounts}
      passes={passes}
      credentials={{
        rows,
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
      showShare
    />
  )
}
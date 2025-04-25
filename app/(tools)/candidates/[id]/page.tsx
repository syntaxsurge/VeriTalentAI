import { desc, eq, and } from 'drizzle-orm'

import CandidateDetailedProfileView from '@/components/candidate/profile-detailed-view'
import { db } from '@/lib/db/drizzle'
import { candidates, users, quizAttempts, issuers } from '@/lib/db/schema'
import {
  getCandidateCredentialsSection,
  type StatusCounts,
} from '@/lib/db/queries/candidate-details'
import {
  candidateCredentials,
  CredentialCategory,
} from '@/lib/db/schema/viskify'

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

  /* -------------------- experiences & projects ------------------- */
  const credsBase = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      createdAt: candidateCredentials.createdAt,
      issuerName: issuers.name,
      link: candidateCredentials.fileUrl,
      description: candidateCredentials.type,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(eq(candidateCredentials.candidateId, candidateId))

  const experienceRows = await credsBase
    .where(and(eq(candidateCredentials.category, CredentialCategory.EXPERIENCE)))
    .orderBy(desc(candidateCredentials.createdAt))

  const projectRows = await credsBase
    .where(and(eq(candidateCredentials.category, CredentialCategory.PROJECT)))
    .orderBy(desc(candidateCredentials.createdAt))

  const experiences = experienceRows.map((e) => ({
    id: e.id,
    title: e.title,
    company: e.issuerName,
    createdAt: e.createdAt,
  }))

  const projects = projectRows.map((p) => ({
    id: p.id,
    title: p.title,
    link: p.link,
    description: p.description,
    createdAt: p.createdAt,
  }))

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
      candidateId={candidateId}
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
      statusCounts={statusCounts as StatusCounts}
      passes={passes}
      experiences={experiences}
      projects={projects}
      socials={{
        twitterUrl: row.cand.twitterUrl,
        githubUrl: row.cand.githubUrl,
        linkedinUrl: row.cand.linkedinUrl,
        websiteUrl: row.cand.websiteUrl,
      }}
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
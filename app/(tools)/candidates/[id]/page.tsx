import { desc, eq, and } from 'drizzle-orm'

import CandidateDetailedProfileView from '@/components/candidate/profile-detailed-view'
import {
  type RowType as CredRowType,
} from '@/components/dashboard/recruiter/credentials-table'
import { db } from '@/lib/db/drizzle'
import { candidates, users, quizAttempts, issuers } from '@/lib/db/schema'
import {
  getCandidateCredentialsSection,
  type StatusCounts,
} from '@/lib/db/queries/candidate-details'
import {
  candidateCredentials,
  CredentialCategory,
  CredentialStatus,
} from '@/lib/db/schema/candidate'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>

type Experience = {
  id: number
  title: string
  company: string | null
  createdAt: Date
}

type Project = {
  id: number
  title: string
  link: string | null
  description: string | null
  createdAt: Date
}

/* Helpers */
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

/* -------------------------------------------------------------------------- */
/*                                 PAGE                                       */
/* -------------------------------------------------------------------------- */

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

  /* -------------------- experiences & projects -------------------------- */
  const baseSelect = () =>
    db
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

  const experienceRows = await baseSelect()
    .where(
      and(
        eq(candidateCredentials.candidateId, candidateId),
        eq(candidateCredentials.category, CredentialCategory.EXPERIENCE),
      ),
    )
    .orderBy(desc(candidateCredentials.createdAt))

  const projectRows = await baseSelect()
    .where(
      and(
        eq(candidateCredentials.candidateId, candidateId),
        eq(candidateCredentials.category, CredentialCategory.PROJECT),
      ),
    )
    .orderBy(desc(candidateCredentials.createdAt))

  const experiences: Experience[] = experienceRows.map((e) => ({
    id: e.id,
    title: e.title,
    company: e.issuerName,
    createdAt: e.createdAt,
  }))

  const projects: Project[] = projectRows.map((p) => ({
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

  /* Restrict sort key to accepted values */
  const allowedSortKeys = ['createdAt', 'status', 'title', 'issuer'] as const
  type SortKey = typeof allowedSortKeys[number]
  const sortRaw = (first(q, 'sort') ?? 'status') as string
  const sort: SortKey = allowedSortKeys.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : 'status'

  const order = first(q, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(q, 'q') ?? '').trim()

  const { rows: rawCredRows, hasNext, statusCounts } = await getCandidateCredentialsSection(
    candidateId,
    page,
    pageSize,
    sort,
    order as 'asc' | 'desc',
    searchTerm,
  )

  /* Align with recruiter RowType (no `type` or `vcJson`, status is enum) */
  const credRows: CredRowType[] = rawCredRows.map((c) => ({
    id: c.id,
    title: c.title,
    category: (c as any).category ?? CredentialCategory.OTHER,
    issuer: (c as any).issuer ?? null,
    status: (c as any).status as CredentialStatus,
    fileUrl: (c as any).fileUrl ?? null,
  }))

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
      showShare
    />
  )
}
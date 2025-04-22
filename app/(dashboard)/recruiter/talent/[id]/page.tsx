import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq, and, sql } from 'drizzle-orm'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
} from 'lucide-react'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import {
  candidates,
  candidateCredentials,
  CredentialStatus,
  quizAttempts,
} from '@/lib/db/schema/viskify'
import {
  pipelineCandidates,
  recruiterPipelines,
} from '@/lib/db/schema/recruiter'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  TablePagination,
} from '@/components/ui/tables/table-pagination'
import CredentialsTable, {
  RowType as CredRow,
} from '@/components/dashboard/recruiter/credentials-table'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/ui/status-badge'

import { getRecruiterCandidateCredentialsPage } from '@/lib/db/queries/recruiter-candidate-credentials'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

function initials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.split(' ')
    return (
      (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')
    ).toUpperCase()
  }
  return email?.slice(0, 2).toUpperCase() ?? ''
}

function statusChip(
  label: string,
  count: number,
  color: string,
  Icon: any,
) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      <Icon className="h-3 w-3" />
      {label}: {count}
    </span>
  )
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

  /* --------------- Skill quiz passes --------------- */
  const passes = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.candidateId, candidateId), eq(quizAttempts.pass, 1)))

  /* --------------- Pipeline membership --------------- */
  const pipelineEntries = await db
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

  const inPipeline = pipelineEntries.length > 0

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

  /* ------------------------------------------------------------------ */
  /*                               UI                                   */
  /* ------------------------------------------------------------------ */
  return (
    <section className="space-y-8">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-20 text-2xl">
          <AvatarFallback>
            {initials(row.userRow?.name, row.userRow?.email)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h2 className="text-3xl font-semibold">
            {row.userRow?.name || 'Unnamed Candidate'}
          </h2>
          <Link
            href={`mailto:${row.userRow?.email}`}
            className="text-sm text-primary underline"
          >
            {row.userRow?.email}
          </Link>

          {inPipeline ? (
            <Badge className="bg-primary/10 text-primary">In&nbsp;Pipeline</Badge>
          ) : (
            <Badge variant="outline">Not&nbsp;in&nbsp;Your&nbsp;Pipelines</Badge>
          )}
        </div>
      </div>

      {/* ---------- Bio ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm">
            {row.cand.bio || 'No bio provided.'}
          </p>
        </CardContent>
      </Card>

      {/* ---------- Credentials ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Credentials
            {/* Status chips */}
            {statusChip(
              'Verified',
              statusCounts.verified,
              'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
              CheckCircle2,
            )}
            {statusChip(
              'Pending',
              statusCounts.pending,
              'bg-amber-500/10 text-amber-700 dark:text-amber-400',
              Clock,
            )}
            {statusChip(
              'Rejected',
              statusCounts.rejected,
              'bg-rose-500/10 text-rose-700 dark:text-rose-400',
              XCircle,
            )}
            {statusChip(
              'Unverified',
              statusCounts.unverified,
              'bg-muted text-muted-foreground',
              HelpCircle,
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No credentials submitted.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <CredentialsTable
                  rows={credRows}
                  sort={sort}
                  order={order as 'asc' | 'desc'}
                  basePath={`/recruiter/talent/${candidateId}`}
                  initialParams={initialParams}
                  searchQuery={searchTerm}
                />
              </div>
              <TablePagination
                page={page}
                hasNext={hasNext}
                basePath={`/recruiter/talent/${candidateId}`}
                initialParams={initialParams}
                pageSize={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ---------- Skill passes ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Skill&nbsp;Quiz&nbsp;Passes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {passes.length === 0 ? (
            <p className="text-muted-foreground">None.</p>
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

      {/* ---------- Pipeline details ---------- */}
      {inPipeline && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline&nbsp;Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pipelineEntries.map((e, idx) => (
              <p key={idx} className="flex items-center gap-2">
                {e.pipelineName}
                <StatusBadge status={e.stage} />
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  )
}
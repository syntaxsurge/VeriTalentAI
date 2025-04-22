import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq, and } from 'drizzle-orm'
import { format } from 'date-fns'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { users } from '@/lib/db/schema/core'
import {
  candidates,
  candidateCredentials,
  CredentialStatus,
  quizAttempts,
} from '@/lib/db/schema/viskify'
import {
  recruiterPipelines,
  pipelineCandidates,
} from '@/lib/db/schema/recruiter'
import { issuers } from '@/lib/db/schema/issuer'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/tables/table'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Params = { id: string }

type CredentialRow = {
  id: number
  title: string
  issuer: string | null
  status: CredentialStatus
  fileUrl: string | null
}

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function initials(name?: string | null, email?: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.split(' ')
    return (
      (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')
    ).toUpperCase()
  }
  return email?.slice(0, 2).toUpperCase() ?? ''
}

function statusColor(status: CredentialStatus): string {
  switch (status) {
    case CredentialStatus.VERIFIED:
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    case CredentialStatus.PENDING:
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
    case CredentialStatus.REJECTED:
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
    default:
      return 'bg-muted'
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function CandidateProfilePage({
  params,
}: {
  params: Params | Promise<Params>
}) {
  /* --------------- Resolve dynamic parameter --------------- */
  const { id } = (await params) as Params
  const candidateId = Number(id)

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

  /* --------------- Credentials (all statuses) --------------- */
  const creds = (await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      status: candidateCredentials.status,
      issuer: issuers.name,
      fileUrl: candidateCredentials.fileUrl,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(eq(candidateCredentials.candidateId, candidateId))) as CredentialRow[]

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
          <CardTitle>Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          {creds.length === 0 ? (
            <p className="text-muted-foreground text-sm">No credentials submitted.</p>
          ) : (
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creds.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.issuer || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusColor(
                          c.status,
                        )}`}
                      >
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {c.fileUrl ? (
                        <a
                          href={c.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                Quiz&nbsp;#{p.quizId}&nbsp;—&nbsp;Score&nbsp;{p.score}&nbsp;/&nbsp;{p.maxScore}
                &nbsp;•&nbsp;{format(p.createdAt, 'PPP')}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      {/* ---------- Pipeline details (if any) ---------- */}
      {inPipeline && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline&nbsp;Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pipelineEntries.map((e, idx) => (
              <p key={idx}>
                {e.pipelineName} — <span className="capitalize">{e.stage}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  )
}
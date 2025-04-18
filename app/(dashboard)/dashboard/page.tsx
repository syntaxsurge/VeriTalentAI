import { redirect } from 'next/navigation'

import { and, eq } from 'drizzle-orm'

import { QuickActions, type QuickAction } from '@/components/dashboard/quick-actions'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users, teams } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { recruiterPipelines, pipelineCandidates } from '@/lib/db/schema/recruiter'
import {
  candidates,
  candidateCredentials,
  CredentialStatus,
  quizAttempts,
} from '@/lib/db/schema/veritalent'

export const revalidate = 0

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ------------------------------------------------------------------ */
  /* Candidate metrics                                                  */
  /* ------------------------------------------------------------------ */
  let verifiedCount = 0
  let skillPassCount = 0

  if (user.role === 'candidate') {
    const [candidateRow] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (candidateRow) {
      verifiedCount = (
        await db
          .select()
          .from(candidateCredentials)
          .where(
            and(
              eq(candidateCredentials.candidateId, candidateRow.id),
              eq(candidateCredentials.status, CredentialStatus.VERIFIED),
            ),
          )
      ).length

      skillPassCount = (
        await db
          .select()
          .from(quizAttempts)
          .where(and(eq(quizAttempts.candidateId, candidateRow.id), eq(quizAttempts.pass, 1)))
      ).length
    }
  }

  /* ------------------------------------------------------------------ */
  /* Recruiter metrics                                                  */
  /* ------------------------------------------------------------------ */
  let pipelineTotal = 0
  let uniqueCandidates = 0

  if (user.role === 'recruiter') {
    const pipelines = await db
      .select()
      .from(recruiterPipelines)
      .where(eq(recruiterPipelines.recruiterId, user.id))
    pipelineTotal = pipelines.length

    const pcRows = await db
      .select({ candidateId: pipelineCandidates.candidateId })
      .from(pipelineCandidates)
      .leftJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
      .where(eq(recruiterPipelines.recruiterId, user.id))

    uniqueCandidates = new Set(pcRows.map((r) => r.candidateId)).size
  }

  /* ------------------------------------------------------------------ */
  /* Issuer metrics                                                     */
  /* ------------------------------------------------------------------ */
  let pendingReq = 0
  let issuedCreds = 0

  if (user.role === 'issuer') {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)

    if (issuer) {
      pendingReq = (
        await db
          .select()
          .from(candidateCredentials)
          .where(
            and(
              eq(candidateCredentials.issuerId, issuer.id),
              eq(candidateCredentials.status, CredentialStatus.PENDING),
            ),
          )
      ).length

      issuedCreds = (
        await db
          .select()
          .from(candidateCredentials)
          .where(
            and(
              eq(candidateCredentials.issuerId, issuer.id),
              eq(candidateCredentials.status, CredentialStatus.VERIFIED),
            ),
          )
      ).length
    }
  }

  /* ------------------------------------------------------------------ */
  /* Admin metrics                                                      */
  /* ------------------------------------------------------------------ */
  let totalUsers = 0
  let totalTeams = 0

  if (user.role === 'admin') {
    totalUsers = (await db.select().from(users)).length
    totalTeams = (await db.select().from(teams)).length
  }

  /* ------------------------------------------------------------------ */
  /* Quick actions – none for candidates to avoid redundancy            */
  /* ------------------------------------------------------------------ */
  const quickActions: Record<string, QuickAction[]> = {
    candidate: [],
  }

  return (
    <section className='space-y-10'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold'>
          Welcome back, <span className='break-all'>{user.name || user.email}</span>
        </h1>
        <RoleBadge role={user.role} />
        <p className='text-muted-foreground max-w-prose'>
          Your personalised VeriTalent workspace overview.
        </p>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {user.role === 'candidate' && (
          <>
            <MetricCard title='Verified Credentials' value={verifiedCount} />
            <MetricCard title='AI Skill Passes' value={skillPassCount} />
          </>
        )}

        {user.role === 'recruiter' && (
          <>
            <MetricCard title='Pipelines' value={pipelineTotal} />
            <MetricCard title='Unique Candidates' value={uniqueCandidates} />
          </>
        )}

        {user.role === 'issuer' && (
          <>
            <MetricCard title='Pending Requests' value={pendingReq} />
            <MetricCard title='Credentials Signed' value={issuedCreds} />
          </>
        )}

        {user.role === 'admin' && (
          <>
            <MetricCard title='Total Users' value={totalUsers} />
            <MetricCard title='Total Teams' value={totalTeams} />
          </>
        )}
      </div>

      <QuickActions actions={quickActions[user.role] ?? []} />
    </section>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-4xl font-extrabold'>{value}</p>
      </CardContent>
    </Card>
  )
}

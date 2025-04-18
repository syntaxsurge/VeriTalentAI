import { redirect } from 'next/navigation'
import { and, eq, desc } from 'drizzle-orm'

import {
  BadgeCheck,
  Award,
  FolderKanban,
  Users,
  Mail,
  CheckCircle,
  User2,
  Building2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleBadge } from '@/components/dashboard/role-badge'
import CandidateCharts from '@/components/dashboard/candidate-charts'
import RecruiterCharts from '@/components/dashboard/recruiter-charts'
import IssuerCharts from '@/components/dashboard/issuer-charts'

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

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ------------------------------------------------------------------ */
  /* Candidate metrics & datasets                                       */
  /* ------------------------------------------------------------------ */
  let verifiedCount = 0
  let skillPassCount = 0
  let scoreData: { date: string; score: number }[] = []
  let statusData: { name: string; value: number }[] = []

  if (user.role === 'candidate') {
    const [candidateRow] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (candidateRow) {
      /* Verified credentials */
      const credRows = await db
        .select({ status: candidateCredentials.status })
        .from(candidateCredentials)
        .where(eq(candidateCredentials.candidateId, candidateRow.id))

      const statusCounter: Record<string, number> = {}
      credRows.forEach((r) => {
        statusCounter[r.status] = (statusCounter[r.status] || 0) + 1
      })

      statusData = Object.entries(statusCounter).map(([name, value]) => ({ name, value }))
      verifiedCount = statusCounter[CredentialStatus.VERIFIED] ?? 0

      /* Skill‑quiz scores (last 10) */
      const attempts = await db
        .select({ score: quizAttempts.score, createdAt: quizAttempts.createdAt })
        .from(quizAttempts)
        .where(eq(quizAttempts.candidateId, candidateRow.id))
        .orderBy(desc(quizAttempts.createdAt))
        .limit(10)

      scoreData = attempts
        .map((a) => ({ date: a.createdAt.toISOString().split('T')[0], score: a.score ?? 0 }))
        .reverse()

      skillPassCount = attempts.filter((a) => (a.score ?? 0) >= 70).length
    }
  }

  /* ------------------------------------------------------------------ */
  /* Recruiter metrics & datasets                                       */
  /* ------------------------------------------------------------------ */
  let pipelineTotal = 0
  let uniqueCandidates = 0
  let stageData: { stage: string; count: number }[] = []

  if (user.role === 'recruiter') {
    const pipelines = await db
      .select()
      .from(recruiterPipelines)
      .where(eq(recruiterPipelines.recruiterId, user.id))
    pipelineTotal = pipelines.length

    const pcRows = await db
      .select({ stage: pipelineCandidates.stage, candidateId: pipelineCandidates.candidateId })
      .from(pipelineCandidates)
      .leftJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
      .where(eq(recruiterPipelines.recruiterId, user.id))

    const stageCounter: Record<string, number> = {}
    const candidateSet = new Set<number>()
    pcRows.forEach((r) => {
      stageCounter[r.stage] = (stageCounter[r.stage] || 0) + 1
      candidateSet.add(r.candidateId)
    })
    uniqueCandidates = candidateSet.size
    stageData = Object.entries(stageCounter).map(([stage, count]) => ({ stage, count }))
  }

  /* ------------------------------------------------------------------ */
  /* Issuer metrics & datasets                                          */
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
  /* Metric definitions                                                 */
  /* ------------------------------------------------------------------ */
  const metrics: Record<string, { title: string; value: number; icon: React.ComponentType<any> }[]> =
    {
      candidate: [
        { title: 'Verified Credentials', value: verifiedCount, icon: BadgeCheck },
        { title: 'AI Skill Passes', value: skillPassCount, icon: Award },
      ],
      recruiter: [
        { title: 'Pipelines', value: pipelineTotal, icon: FolderKanban },
        { title: 'Unique Candidates', value: uniqueCandidates, icon: Users },
      ],
      issuer: [
        { title: 'Pending Requests', value: pendingReq, icon: Mail },
        { title: 'Credentials Signed', value: issuedCreds, icon: CheckCircle },
      ],
      admin: [
        { title: 'Total Users', value: totalUsers, icon: User2 },
        { title: 'Total Teams', value: totalTeams, icon: Building2 },
      ],
    }

  /* ------------------------------------------------------------------ */
  /* JSX                                                                */
  /* ------------------------------------------------------------------ */
  return (
    <section className="space-y-12">
      {/* Greeting */}
      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
          Welcome back, <span className="break-all">{user.name || user.email}</span>
        </h1>
        <div className="flex items-center gap-3">
          <RoleBadge role={user.role} />
          <p className="text-muted-foreground text-sm">
            Your personalised VeriTalent workspace overview.
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics[user.role]?.map((m) => (
          <MetricCard key={m.title} title={m.title} value={m.value} Icon={m.icon} />
        ))}
      </div>

      {/* Insights / charts */}
      {user.role === 'candidate' && (
        <CandidateCharts scoreData={scoreData} statusData={statusData} />
      )}

      {user.role === 'recruiter' && (
        <RecruiterCharts stageData={stageData} uniqueCandidates={uniqueCandidates} />
      )}

      {user.role === 'issuer' && <IssuerCharts pending={pendingReq} verified={issuedCreds} />}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

type MetricProps = {
  title: string
  value: number
  Icon: React.ComponentType<{ className?: string }>
}

function MetricCard({ title, value, Icon }: MetricProps) {
  return (
    <Card className="relative overflow-hidden shadow-sm transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {title}
        </CardTitle>
        {/* Brighter icon for better visibility */}
        <Icon className="absolute right-4 top-4 h-6 w-6 text-gray-400 dark:text-gray-300" />
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-extrabold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}
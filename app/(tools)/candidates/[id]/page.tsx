import { eq, sql } from 'drizzle-orm'

import CandidateProfileView, {
  Credential,
} from '@/components/candidate/profile-view'
import { db } from '@/lib/db/drizzle'
import {
  candidates,
  candidateCredentials,
  quizAttempts,
  users,
  issuers,
} from '@/lib/db/schema'

export const revalidate = 0

export default async function PublicCandidateProfile({
  params,
}: {
  params: { id: string }
}) {
  const candidateId = Number(params.id)

  /* ------------------------- Core profile ------------------------- */
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

  /* ----------------------- Credentials + counts ------------------- */
  const credRows = await db
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
    .orderBy(sql`created_at DESC`)

  const statusCounts = {
    verified: 0,
    pending: 0,
    rejected: 0,
    unverified: 0,
  }
  credRows.forEach((c) => {
    statusCounts[c.status as keyof typeof statusCounts]++
  })

  const credentials: Credential[] = credRows.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer,
    status: c.status,
    fileUrl: c.fileUrl,
  }))

  /* ----------------------- Skill passes count --------------------- */
  const [{ passes } = { passes: 0 }] = await db
    .select({ passes: sql<number>`COUNT(*)` })
    .from(quizAttempts)
    .where(eq(quizAttempts.candidateId, candidateId))
    .andWhere(eq(quizAttempts.pass, 1))

  /* ---------------------------- View ------------------------------ */
  return (
    <CandidateProfileView
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
      statusCounts={statusCounts}
      passes={passes}
      credentials={credentials}
      showShare
    />
  )
}
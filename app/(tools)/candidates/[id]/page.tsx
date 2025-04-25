import { eq, sql, desc, and } from 'drizzle-orm'

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

/**
 * Public-facing candidate profile.
 *
 * • Awaits the `params` promise per Next 15 async dynamic API.
 * • Uses desc(candidateCredentials.createdAt) to avoid ambiguous column errors.
 */
export default async function PublicCandidateProfile({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  /* ------------------------- Dynamic param ------------------------- */
  const { id } = await Promise.resolve(params)
  const candidateId = Number(id)

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
    .orderBy(desc(candidateCredentials.createdAt))

  const statusCounts: Record<string, number> = {
    verified: 0,
    pending: 0,
    rejected: 0,
    unverified: 0,
  }
  credRows.forEach((c) => {
    statusCounts[c.status]++
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
    .where(
      and(
        eq(quizAttempts.candidateId, candidateId),
        eq(quizAttempts.pass, 1),
      ),
    )

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
import { redirect } from 'next/navigation'
import { asc, eq, notInArray } from 'drizzle-orm'

import HighlightsBoard from '@/components/dashboard/candidate/highlights-board'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import {
  candidateCredentials,
  CredentialCategory,
  candidateHighlights,
  candidates,
} from '@/lib/db/schema/candidate'

export const revalidate = 0

export default async function CandidateHighlightsSettings() {
  /* --------------------------- auth guard --------------------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [cand] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!cand) redirect('/candidate/profile')

  /* ------------------------ credentials fetch ----------------------- */
  const creds = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      category: candidateCredentials.category,
    })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, cand.id))
    .orderBy(asc(candidateCredentials.createdAt))

  /* ------------------------ highlights fetch ------------------------ */
  const hlRows = await db
    .select()
    .from(candidateHighlights)
    .where(eq(candidateHighlights.candidateId, cand.id))
    .orderBy(asc(candidateHighlights.sortOrder))

  const byCat = {
    EXPERIENCE: [] as typeof creds,
    PROJECT: [] as typeof creds,
  }
  hlRows.forEach((h) => {
    const cred = creds.find((c) => c.id === h.credentialId)
    if (cred && (cred.category === CredentialCategory.EXPERIENCE || cred.category === CredentialCategory.PROJECT)) {
      byCat[cred.category].push(cred)
    }
  })

  const selectedIds = new Set(hlRows.map((h) => h.credentialId))
  const available = creds.filter((c) => !selectedIds.has(c.id))

  return (
    <section className='flex-1 space-y-6 p-4 lg:p-8'>
      <h1 className='text-lg font-medium lg:text-2xl'>Profile Highlights</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select &amp; Order Your Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <HighlightsBoard
            selectedExperience={byCat.EXPERIENCE}
            selectedProject={byCat.PROJECT}
            available={available}
          />
        </CardContent>
      </Card>
    </section>
  )
}
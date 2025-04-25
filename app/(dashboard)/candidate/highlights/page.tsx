import { redirect } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'

import HighlightsBoard from '@/components/dashboard/candidate/highlights-board'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  /* --------------------------- Auth guard --------------------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [cand] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!cand) redirect('/candidate/profile')

  /* ------------------------ Credentials fetch ----------------------- */
  const creds = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      category: candidateCredentials.category,
    })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, cand.id))
    .orderBy(asc(candidateCredentials.createdAt))

  /* ------------------------ Highlights fetch ------------------------ */
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
    if (
      cred &&
      (cred.category === CredentialCategory.EXPERIENCE ||
        cred.category === CredentialCategory.PROJECT)
    ) {
      byCat[cred.category].push(cred)
    }
  })

  const selectedIds = new Set(hlRows.map((h) => h.credentialId))
  const available = creds.filter((c) => !selectedIds.has(c.id))

  /* --------------------------- Render --------------------------- */
  return (
    <section className='flex-1 space-y-8 p-4 lg:p-8'>
      {/* Hero */}
      <header className='space-y-2 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-transparent p-6 shadow-sm'>
        <h1 className='text-2xl font-extrabold tracking-tight'>
          Profile&nbsp;Highlights
        </h1>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Choose up to&nbsp;
          <Badge variant='secondary' className='mx-1'>
            5
          </Badge>
          credentials each for{' '}
          <Badge variant='secondary' className='mx-1'>
            Experience
          </Badge>
          and{' '}
          <Badge variant='secondary' className='mx-1'>
            Projects
          </Badge>
          to showcase at the top of your profile — much like featured posts on
          social platforms such as LinkedIn.
        </p>
      </header>

      {/* Highlights board */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>
            Manage Your Highlights
          </CardTitle>
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
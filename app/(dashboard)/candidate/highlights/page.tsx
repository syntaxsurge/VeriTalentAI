import { redirect } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'

import ProfileHeader from '@/components/candidate/profile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import HighlightsBoard from '@/components/dashboard/candidate/highlights-board'
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
  /* ------------------------------------------------------------------ */
  /*                               Auth                                 */
  /* ------------------------------------------------------------------ */
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [candRow] = await db
    .select({ id: candidates.id, bio: candidates.bio })
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!candRow) redirect('/candidate/profile')

  /* ------------------------------------------------------------------ */
  /*                       Fetch credentials + highlights                */
  /* ------------------------------------------------------------------ */
  const creds = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      category: candidateCredentials.category,
    })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, candRow.id))
    .orderBy(asc(candidateCredentials.createdAt))

  const hlRows = await db
    .select()
    .from(candidateHighlights)
    .where(eq(candidateHighlights.candidateId, candRow.id))
    .orderBy(asc(candidateHighlights.sortOrder))

  /* Group highlighted creds by category */
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

  /* ------------------------------------------------------------------ */
  /*                               View                                 */
  /* ------------------------------------------------------------------ */
  return (
    <section className='flex-1 space-y-10'>
      {/* Header */}
      <ProfileHeader
        name={user.name ?? null}
        email={user.email ?? ''}
        avatarSrc={(user as any)?.image ?? undefined}
      />

      {/* Highlights management */}
      <Card className='shadow-md transition-shadow hover:shadow-lg'>
        <CardHeader className='pt-12 space-y-2'>
          <CardTitle className='text-2xl font-extrabold tracking-tight'>
            Profile&nbsp;Highlights
          </CardTitle>
          <p className='text-muted-foreground text-sm'>
            Showcase up to&nbsp;
            <Badge variant='secondary' className='mx-1'>
              5
            </Badge>
            credentials each for&nbsp;
            <Badge variant='secondary' className='mx-1'>
              Experience
            </Badge>
            and&nbsp;
            <Badge variant='secondary' className='mx-1'>
              Projects
            </Badge>
            &nbsp;– just like the featured section on LinkedIn.
          </p>
        </CardHeader>

        <CardContent className='pt-0'>
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
import { redirect } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'

import { Star } from 'lucide-react'

import ProfileHeader from '@/components/candidate/profile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import HighlightsBoard, {
  type Credential as HighlightCredential,
} from '@/components/dashboard/candidate/highlights-board'
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

  /* ------------------ Prepare selected + available lists ------------- */
  const selectedIds = new Set(hlRows.map((h) => h.credentialId))

  const selectedExperience: HighlightCredential[] = []
  const selectedProject: HighlightCredential[] = []

  hlRows.forEach((h) => {
    const cred = creds.find((c) => c.id === h.credentialId)
    if (!cred) return
    if (cred.category === CredentialCategory.EXPERIENCE) {
      selectedExperience.push({
        id: cred.id,
        title: cred.title,
        category: 'EXPERIENCE',
      })
    } else if (cred.category === CredentialCategory.PROJECT) {
      selectedProject.push({
        id: cred.id,
        title: cred.title,
        category: 'PROJECT',
      })
    }
  })

  const available: HighlightCredential[] = creds
    .filter(
      (c) =>
        (c.category === CredentialCategory.EXPERIENCE ||
          c.category === CredentialCategory.PROJECT) &&
        !selectedIds.has(c.id),
    )
    .map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category as 'EXPERIENCE' | 'PROJECT',
    }))

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
        <CardHeader className='flex items-center gap-3 space-y-0'>
          <Star className='text-primary h-10 w-10 flex-shrink-0' />
          <div>
            <CardTitle className='text-2xl font-extrabold tracking-tight'>
              Profile Highlights
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Showcase up to <span className='font-semibold'>5</span> credentials each for{' '}
              <span className='font-semibold'>Experience</span> and{' '}
              <span className='font-semibold'>Projects</span>.
            </p>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          <HighlightsBoard
            selectedExperience={selectedExperience}
            selectedProject={selectedProject}
            available={available}
          />
        </CardContent>
      </Card>
    </section>
  )
}
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { candidates } from '@/lib/db/schema/viskify'

import ProfileForm from './profile-form'

export const revalidate = 0

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  return (
    <section className='mx-auto max-w-5xl space-y-10'>
      {/* ------------------------------------------------------------------ */}
      {/*                               Hero                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className='relative isolate'>
        {/* Banner */}
        <div className='h-48 rounded-3xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 shadow-lg' />

        {/* Avatar */}
        <div className='absolute -bottom-12 left-8'>
          <UserAvatar
            src={(user as any)?.image ?? undefined}
            name={user.name ?? null}
            email={user.email ?? null}
            className='size-24 ring-4 ring-background'
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                             Profile Form                           */}
      {/* ------------------------------------------------------------------ */}
      <Card className='shadow-md transition-shadow hover:shadow-lg'>
        <CardHeader className='pt-16'>
          <CardTitle className='text-2xl font-extrabold tracking-tight'>Edit Profile</CardTitle>
          <p className='text-muted-foreground text-sm'>Present yourself professionally to recruiters.</p>
        </CardHeader>

        <CardContent>
          <ProfileForm
            defaultName={user.name || ''}
            defaultBio={candidate?.bio || ''}
            defaultTwitterUrl={candidate?.twitterUrl || ''}
            defaultGithubUrl={candidate?.githubUrl || ''}
            defaultLinkedinUrl={candidate?.linkedinUrl || ''}
            defaultWebsiteUrl={candidate?.websiteUrl || ''}
          />
        </CardContent>
      </Card>
    </section>
  )
}
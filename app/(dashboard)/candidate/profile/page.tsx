import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { User } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <section className='mx-auto max-w-xl'>
      <Card className='shadow-md transition-shadow hover:shadow-lg'>
        <CardHeader className='flex flex-row items-center gap-3'>
          <User className='text-primary h-8 w-8 flex-shrink-0' />
          <div>
            <CardTitle className='text-2xl font-extrabold tracking-tight'>My Profile</CardTitle>
            <p className='text-muted-foreground text-sm'>Tell recruiters who you are.</p>
          </div>
        </CardHeader>

        <CardContent>
          <ProfileForm defaultName={user.name || ''} defaultBio={candidate?.bio || ''} />
        </CardContent>
      </Card>
    </section>
  )
}
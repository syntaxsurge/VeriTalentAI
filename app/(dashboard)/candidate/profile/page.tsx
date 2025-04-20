import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
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
    <section className='max-w-xl'>
      <h2 className='mb-4 text-xl font-semibold'>My Profile</h2>
      <ProfileForm defaultName={user.name || ''} defaultBio={candidate?.bio || ''} />
    </section>
  )
}

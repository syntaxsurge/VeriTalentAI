import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { DidRequiredModal } from '@/components/dashboard/candidate/did-required-modal'
import { getUser } from '@/lib/db/queries/queries'
import { db } from '@/lib/db/drizzle'
import { teams, teamMembers } from '@/lib/db/schema/core'

import AddCredentialForm from './add-credential-form'
import { addCredential } from '../actions'

export const revalidate = 0

export default async function AddCredentialPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* Require team DID before allowing credential submission */
  const [{ did } = {}] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  if (!did) return <DidRequiredModal />

  /* Wrapper to invoke server action from client component */
  const addCredentialAction = async (formData: FormData): Promise<void> => {
    'use server'
    await addCredential({}, formData)
  }

  return (
    <section className='max-w-xl space-y-6'>
      <h2 className='text-2xl font-bold tracking-tight'>Add Credential</h2>
      <AddCredentialForm addCredentialAction={addCredentialAction} />
    </section>
  )
}
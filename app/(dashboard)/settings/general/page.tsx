import { redirect } from 'next/navigation'
import { Settings as SettingsIcon } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import { getUser } from '@/lib/db/queries/queries'

import GeneralForm from './general-form'

export const revalidate = 0

export default async function GeneralSettingsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  return (
    <section className='mx-auto max-w-5xl py-10'>
      <PageCard
        icon={SettingsIcon}
        title='Account Information'
        description='Update your name and email address.'
      >
        <GeneralForm defaultName={user.name || ''} defaultEmail={user.email} />
      </PageCard>
    </section>
  )
}
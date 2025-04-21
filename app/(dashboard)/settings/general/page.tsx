import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUser } from '@/lib/db/queries/queries'

import GeneralForm from './general-form'

export const revalidate = 0

export default async function GeneralSettingsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>General Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneralForm defaultName={user.name || ''} defaultEmail={user.email} />
        </CardContent>
      </Card>
    </section>
  )
}
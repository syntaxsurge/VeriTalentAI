import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getUser } from '@/lib/db/queries/queries'

import { Login } from '../../login'

export default async function CandidateSignUpPage() {
  const user = await getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <Suspense>
      <Login mode='signup' fixedRole='candidate' />
    </Suspense>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/lib/auth'

import DeleteAccountForm from './delete-account-form'
import UpdatePasswordForm from './update-password-form'

export default function SecurityPage() {
  const { userPromise } = useUser()
  const router = useRouter()

  useEffect(() => {
    userPromise.then((u) => {
      if (!u) router.replace('/sign-in')
    })
  }, [userPromise, router])

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>Security Settings</h1>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-4 text-sm'>
            Account deletion is non-reversible. Please proceed with caution.
          </p>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </section>
  )
}

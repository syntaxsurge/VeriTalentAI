'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useActionState, use, useEffect } from 'react'

import { Lock, Trash2, Loader2 } from 'lucide-react'

import { updatePassword, deleteAccount } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormStatus } from '@/components/ui/form-status'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/auth'

type ActionState = {
  error?: string
  success?: string
}

export default function SecurityPage() {
  const { userPromise } = useUser()
  const user = use(userPromise)

  const router = useRouter()
  useEffect(() => {
    if (!user) {
      router.replace('/sign-in')
    }
  }, [user, router])

  const [passwordState, passwordAction, isPasswordPending] = useActionState<ActionState, FormData>(
    updatePassword,
    {
      error: '',
      success: '',
    },
  )

  const [deleteState, deleteAction, isDeletePending] = useActionState<ActionState, FormData>(
    deleteAccount,
    {
      error: '',
      success: '',
    },
  )

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(() => passwordAction(new FormData(event.currentTarget)))
  }

  const handleDeleteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(() => deleteAction(new FormData(event.currentTarget)))
  }

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>Security Settings</h1>

      {/* Update password */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={handlePasswordSubmit}>
            <div>
              <Label htmlFor='current-password'>Current Password</Label>
              <Input
                id='current-password'
                name='currentPassword'
                type='password'
                autoComplete='current-password'
                required
                minLength={8}
                maxLength={100}
                placeholder='Enter current password'
              />
            </div>
            <div>
              <Label htmlFor='new-password'>New Password</Label>
              <Input
                id='new-password'
                name='newPassword'
                type='password'
                autoComplete='new-password'
                required
                minLength={8}
                maxLength={100}
                placeholder='Enter new password'
              />
            </div>
            <div>
              <Label htmlFor='confirm-password'>Confirm New Password</Label>
              <Input
                id='confirm-password'
                name='confirmPassword'
                type='password'
                required
                minLength={8}
                maxLength={100}
                placeholder='Confirm your new password'
              />
            </div>

            <FormStatus state={passwordState} />

            <Button type='submit' disabled={isPasswordPending}>
              {isPasswordPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Updating…
                </>
              ) : (
                <>
                  <Lock className='mr-2 h-4 w-4' />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete account */}
      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-4 text-sm'>
            Account deletion is non‑reversible. Please proceed with caution.
          </p>
          <form onSubmit={handleDeleteSubmit} className='space-y-4'>
            <div>
              <Label htmlFor='delete-password'>Confirm Password</Label>
              <Input
                id='delete-password'
                name='password'
                type='password'
                required
                minLength={8}
                maxLength={100}
                placeholder='Enter password to confirm'
              />
            </div>

            <FormStatus state={deleteState} />

            <Button type='submit' variant='destructive' disabled={isDeletePending}>
              {isDeletePending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

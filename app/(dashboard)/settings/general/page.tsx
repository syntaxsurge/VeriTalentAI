'use client'

import { useRouter } from 'next/navigation'
import {
  startTransition,
  useActionState,
  useEffect,
  useState,
} from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { updateAccount } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/auth'

type ActionState = { error?: string; success?: string }

export default function GeneralPage() {
  const { userPromise } = useUser()
  const [user, setUser] = useState<any | null | undefined>(undefined)

  useEffect(() => {
    let mounted = true
    userPromise.then((u) => mounted && setUser(u))
    return () => {
      mounted = false
    }
  }, [userPromise])

  const router = useRouter()
  useEffect(() => {
    if (user === undefined) return
    if (!user) {
      router.replace('/sign-in')
    }
  }, [user, router])

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    { error: '', success: '' },
  )

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) toast.success(state.success)
  }, [state.error, state.success])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(() => formAction(new FormData(event.currentTarget)))
  }

  if (user === undefined) return null

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>General Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                name='name'
                placeholder='Enter your name'
                defaultValue={user?.name || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='Enter your email'
                defaultValue={user?.email || ''}
                required
              />
            </div>

            <Button type='submit' disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
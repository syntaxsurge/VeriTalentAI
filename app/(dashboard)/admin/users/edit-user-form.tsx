'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState, startTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { updateUserAction } from './actions'

const ROLES = ['candidate', 'recruiter', 'issuer', 'admin'] as const

export interface EditUserFormProps {
  /** unique user id */
  id: number
  defaultName: string | null
  defaultEmail: string
  defaultRole: string
  /** called when the form successfully saves */
  onDone: () => void
}

/**
 * Form used inside the admin “Edit User” dialog.
 * Shows a muted spinner while saving and fires success/error toasts.
 */
export default function EditUserForm({
  id,
  defaultName,
  defaultEmail,
  defaultRole,
  onDone,
}: EditUserFormProps) {
  type ActionState = { error?: string; success?: string }
  const [state, action, pending] = useActionState<ActionState, FormData>(updateUserAction, {
    error: '',
    success: '',
  })
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('userId', id.toString())
    startTransition(() => action(fd))
  }

  /* toast + side‑effects */
  React.useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) {
      toast.success(state.success)
      onDone()
      router.refresh()
    }
  }, [state.error, state.success, onDone, router])

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <Label htmlFor='name'>Name (optional)</Label>
        <Input id='name' name='name' defaultValue={defaultName ?? ''} />
      </div>

      <div>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' name='email' type='email' defaultValue={defaultEmail} required />
      </div>

      <div>
        <Label htmlFor='role'>Role</Label>
        <select
          id='role'
          name='role'
          defaultValue={defaultRole}
          className='h-10 w-full rounded-md border px-2 capitalize'
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <Button type='submit' className='w-full' disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving…
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}
'use client'

import * as React from 'react'
import { useActionState, startTransition } from 'react'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { updateCandidateProfile } from './actions'

type Props = {
  defaultName: string
  defaultBio: string
}

type ActionState = {
  error?: string
  success?: string
}

export default function ProfileForm({ defaultName, defaultBio }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateCandidateProfile,
    { error: '', success: '' },
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => {
      formAction(fd)
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <Label htmlFor='name'>Name</Label>
        <Input id='name' name='name' defaultValue={defaultName} required />
      </div>
      <div>
        <Label htmlFor='bio'>Bio</Label>
        <textarea
          id='bio'
          name='bio'
          rows={5}
          defaultValue={defaultBio}
          className='border-border w-full rounded-md border p-2'
          placeholder='Tell recruiters about yourself…'
        />
      </div>
      {state.error && <p className='text-sm text-red-500'>{state.error}</p>}
      {state.success && <p className='text-sm text-green-500'>{state.success}</p>}
      <Button type='submit' disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving…
          </>
        ) : (
          'Save Profile'
        )}
      </Button>
    </form>
  )
}

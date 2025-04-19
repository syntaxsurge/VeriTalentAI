'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState, startTransition } from 'react'
import { Loader2 } from 'lucide-react'

import { updateIssuerDidAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormStatus } from '@/components/ui/form-status'

type ActionState = { error?: string; success?: string }

export function LinkDidForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateIssuerDidAction,
    { error: '', success: '' },
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => formAction(fd))
  }

  /* Refresh the page once a DID is successfully linked so the new DID shows up */
  React.useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div>
        <Label htmlFor='did'>Link a cheqd DID</Label>
        <Input id='did' name='did' required placeholder='did:cheqd:testnet:xyz…' />
      </div>

      <FormStatus state={state} />

      <Button type='submit' disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving…
          </>
        ) : (
          'Save DID'
        )}
      </Button>
    </form>
  )
}
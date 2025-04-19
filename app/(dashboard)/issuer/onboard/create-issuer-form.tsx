'use client'

import * as React from 'react'
import { useActionState, startTransition } from 'react'
import { Loader2 } from 'lucide-react'

import { createIssuerAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormStatus } from '@/components/ui/form-status'

type ActionState = { error?: string; success?: string }

export function CreateIssuerForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createIssuerAction, {
    error: '',
    success: '',
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => formAction(fd))
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div>
        <Label htmlFor='name'>Organisation Name</Label>
        <Input id='name' name='name' required placeholder='Acme University' />
      </div>

      <div>
        <Label htmlFor='domain'>Email Domain</Label>
        <Input id='domain' name='domain' required placeholder='acme.edu' />
      </div>

      <div>
        <Label htmlFor='logoUrl'>Logo URL</Label>
        <Input id='logoUrl' name='logoUrl' type='url' placeholder='https://…' />
      </div>

      <div>
        <Label htmlFor='did'>cheqd DID (optional)</Label>
        <Input id='did' name='did' placeholder='did:cheqd:testnet:xyz…' />
      </div>

      <FormStatus state={state} />

      <Button type='submit' disabled={pending} className='w-full'>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Creating…
          </>
        ) : (
          'Create Issuer'
        )}
      </Button>
    </form>
  )
}
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState, startTransition, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

import { createIssuerAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormStatus } from '@/components/ui/form-status'
import { IssuerCategory, IssuerIndustry } from '@/lib/db/schema/issuer'

type ActionState = { error?: string; success?: string }

const CATEGORIES = Object.values(IssuerCategory)
const INDUSTRIES = Object.values(IssuerIndustry)

export function CreateIssuerForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createIssuerAction,
    { error: '', success: '' },
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    startTransition(() => formAction(new FormData(e.currentTarget)))
  }

  /* Automatically refresh to show the newly created issuer record */
  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div>
        <Label htmlFor='name'>Organisation Name</Label>
        <Input id='name' name='name' required placeholder='Acme University' />
      </div>

      <div>
        <Label htmlFor='domain'>Email Domain</Label>
        <Input id='domain' name='domain' required placeholder='acme.edu' />
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <Label htmlFor='category'>Category</Label>
          <select id='category' name='category' className='h-10 w-full rounded-md border px-2'>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className='capitalize'>
                {c.replaceAll('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor='industry'>Industry</Label>
          <select id='industry' name='industry' className='h-10 w-full rounded-md border px-2'>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i} className='capitalize'>
                {i.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor='logoUrl'>Logo URL</Label>
        <Input id='logoUrl' name='logoUrl' type='url' placeholder='https://…' />
      </div>

      <div>
        <Label htmlFor='did'>cheqd DID (optional)</Label>
        <Input id='did' name='did' placeholder='did:cheqd:testnet:xyz…' />
      </div>

      <FormStatus state={state} />

      <Button type='submit' disabled={pending} className='w-full'>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Creating…
          </>
        ) : (
          'Create Issuer'
        )}
      </Button>
    </form>
  )
}
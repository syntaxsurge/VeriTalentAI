'use client'

import * as React from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { createDidAction } from './actions'

/**
 * Triggers server-side cheqd DID creation for the current team.
 */
export function CreateDidButton() {
  const [pending, startTransition] = React.useTransition()

  async function handleClick() {
    if (pending) return

    const toastId = toast.loading('Creating DID…')
    startTransition(async () => {
      try {
        const res = await createDidAction({}, new FormData())
        if (res && 'error' in res && res.error) {
          toast.error(res.error, { id: toastId })
        } else {
          toast.success(res?.success ?? 'Team DID created successfully.', { id: toastId })
        }
      } catch (err: any) {
        toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
      }
    })
  }

  return (
    <Button onClick={handleClick} disabled={pending} className='w-full md:w-max'>
      {pending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Creating DID…
        </>
      ) : (
        'Create DID for My Team'
      )}
    </Button>
  )
}

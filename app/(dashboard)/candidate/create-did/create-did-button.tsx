'use client'

import { useActionState, startTransition } from 'react'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { createDidAction } from './actions'

export function CreateDidButton() {
  const [state, action, pending] = useActionState(createDidAction, {
    did: '',
    error: undefined,
  })

  function handleClick() {
    startTransition(() => action())
  }

  return (
    <div className='flex flex-col gap-2'>
      <Button onClick={handleClick} disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Creating DID…
          </>
        ) : (
          'Create DID for My Company'
        )}
      </Button>

      {state.did && !state.error && (
        <p className='mt-2 text-sm break-all text-green-600'>
          DID created: <strong>{state.did}</strong>
        </p>
      )}
      {state.error && <p className='mt-2 text-sm text-red-500'>{state.error}</p>}
    </div>
  )
}

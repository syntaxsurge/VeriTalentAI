'use client'

import { useActionState, startTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { generatePlatformDidAction } from './actions'

type ActionState = { error?: string; success?: string; did?: string }

export function GenerateDidButton() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    generatePlatformDidAction,
    { error: '', success: '', did: '' },
  )

  function handleClick() {
    startTransition(() => action(new FormData()))
  }

  if (state.error) toast.error(state.error)
  if (state.success) toast.success(state.success)

  return (
    <div className='flex flex-col gap-2'>
      <Button onClick={handleClick} disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Generating…
          </>
        ) : (
          'Generate Platform DID'
        )}
      </Button>

      {state.did && !state.error && (
        <p className='mt-2 text-sm break-all text-green-600'>
          DID created:&nbsp;<strong>{state.did}</strong>
        </p>
      )}
    </div>
  )
}
'use client'

import { useActionState, startTransition } from 'react'
import { Loader2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { createDidAction } from './actions'

/**
 * Action button that triggers cheqd DID creation and provides
 * immediate visual feedback with modern styling.
 */
export function CreateDidButton() {
  const [state, action, pending] = useActionState(createDidAction, {
    did: '',
    error: undefined,
  })

  const handleClick = () => startTransition(() => action())

  return (
    <div className='flex flex-col gap-2'>
      <Button
        onClick={handleClick}
        disabled={pending}
        className='group relative overflow-hidden px-6 py-3 font-semibold'
      >
        {/* Gradient aura */}
        <span className='absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-0 transition-opacity duration-300 group-hover:opacity-20' />
        {pending ? (
          <>
            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
            Creating DID…
          </>
        ) : (
          <>
            <KeyRound className='mr-2 h-5 w-5 flex-shrink-0' />
            Create DID&nbsp;for&nbsp;My&nbsp;Company
          </>
        )}
      </Button>

      {/* Success / error messaging */}
      {state.did && !state.error && (
        <p className='rounded-md bg-emerald-50 p-2 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
          DID created:&nbsp;
          <span className='break-all font-medium'>{state.did}</span>
        </p>
      )}
      {state.error && (
        <p className='rounded-md bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'>
          {state.error}
        </p>
      )}
    </div>
  )
}
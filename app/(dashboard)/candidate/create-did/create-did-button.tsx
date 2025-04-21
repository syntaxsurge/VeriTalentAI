'use client'

import * as React from 'react'
import { useActionState, startTransition } from 'react'
import { Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { createDidAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                               T Y P E S                                    */
/* -------------------------------------------------------------------------- */

type ActionState = {
  did?: string
  error?: string
}

/* -------------------------------------------------------------------------- */
/*                                   VIEW                                     */
/* -------------------------------------------------------------------------- */

export function CreateDidButton() {
  /* invoke the server action and track pending state */
  const [state, action, pending] = useActionState<ActionState, void>(createDidAction, {
    did: '',
    error: undefined,
  })

  /* keep the toast id so we can update it later */
  const toastId = React.useRef<string | number>()

  /* click → show loading toast then trigger server action */
  function handleClick() {
    toastId.current = toast.loading('Creating DID…')
    startTransition(() => action())
  }

  /* when state changes (success or error) → update the toast */
  React.useEffect(() => {
    if (!pending && toastId.current !== undefined) {
      if (state.error) {
        toast.error(state.error, { id: toastId.current })
      } else if (state.did) {
        toast.success(`DID created: ${state.did}`, { id: toastId.current })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending])

  return (
    <div className='flex flex-col gap-2'>
      <Button
        onClick={handleClick}
        disabled={pending}
        className='group relative overflow-hidden px-6 py-3 font-semibold'
      >
        {/* Gradient hover aura */}
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
    </div>
  )
}
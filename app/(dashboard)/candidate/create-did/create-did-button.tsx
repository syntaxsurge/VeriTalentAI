'use client'

import * as React from 'react'
import { useActionState, startTransition } from 'react'

import { Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { createDidAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                               T Y P E S                                    */
/* -------------------------------------------------------------------------- */

type ActionState = {
  success?: string
  error?: string
}

/* -------------------------------------------------------------------------- */
/*                                   VIEW                                     */
/* -------------------------------------------------------------------------- */

export function CreateDidButton() {
  /* Track server action */
  const [state, action, pending] = useActionState<ActionState, void>(createDidAction, {
    success: '',
    error: undefined,
  })

  /* Toast handling */
  const toastId = React.useRef<string | number | undefined>()

  function handleClick() {
    toastId.current = toast.loading('Creating DID…')
    startTransition(() => action())
  }

  React.useEffect(() => {
    if (!pending && toastId.current !== undefined) {
      if (state.error) toast.error(state.error, { id: toastId.current })
      else if (state.success) toast.success(state.success, { id: toastId.current })
    }
  }, [state, pending])

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      className='w-full gap-2 md:w-max'
    >
      {pending ? (
        <>
          <Loader2 className='h-4 w-4 animate-spin' />
          Creating DID…
        </>
      ) : (
        <>
          <KeyRound className='h-4 w-4' />
          Create DID for My Company
        </>
      )}
    </Button>
  )
}
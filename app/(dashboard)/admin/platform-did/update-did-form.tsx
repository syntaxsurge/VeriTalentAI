'use client'

import * as React from 'react'
import { useActionState, startTransition } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

import { upsertPlatformDidAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type State = { error?: string; success?: string; did?: string }

interface Props {
  /** Existing DID pulled from env (may be null). */
  defaultDid: string | null
}

/* -------------------------------------------------------------------------- */
/*                                   VIEW                                     */
/* -------------------------------------------------------------------------- */

export default function UpdateDidForm({ defaultDid }: Props) {
  const initial: State = { error: '', success: '', did: '' }

  /* Separate hooks so each button maintains its own pending state */
  const [saveState, saveAction, saving] = useActionState<State, FormData>(
    upsertPlatformDidAction,
    initial,
  )
  const [genState, genAction, generating] = useActionState<State, FormData>(
    upsertPlatformDidAction,
    initial,
  )

  /* ------------------------ toast effects ------------------------ */
  React.useEffect(() => {
    if (saveState.error) toast.error(saveState.error)
    if (saveState.success) toast.success(saveState.success)
  }, [saveState])

  React.useEffect(() => {
    if (genState.error) toast.error(genState.error)
    if (genState.success) toast.success(genState.success)
  }, [genState])

  /* ------------------------ handlers ----------------------------- */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => saveAction(fd))
  }

  function handleGenerate() {
    startTransition(() => genAction(new FormData()))
  }

  /* Prefer newest DID from either action */
  const currentDid = genState.did || saveState.did

  /* ------------------------- JSX ------------------------------ */
  return (
    <div className='space-y-6'>
      {/* Manual form */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='did'>Platform DID</Label>
          <Input
            id='did'
            name='did'
            placeholder='did:cheqd:testnet:xxxx'
            defaultValue={defaultDid ?? ''}
            required
          />
        </div>

        <Button type='submit' disabled={saving} className='w-full sm:w-auto'>
          {saving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className='relative'>
        <span className='absolute inset-x-0 top-1/2 -translate-y-1/2 border-t' />
        <span className='relative mx-auto bg-background px-3 text-xs uppercase text-muted-foreground'>
          or
        </span>
      </div>

      {/* Generate button */}
      <Button
        variant='outline'
        onClick={handleGenerate}
        disabled={generating}
        className='w-full sm:w-auto'
      >
        {generating ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Generating…
          </>
        ) : (
          <>
            <RefreshCcw className='mr-2 h-4 w-4' />
            Generate New DID
          </>
        )}
      </Button>

      {/* Current DID display (post‑update) */}
      {currentDid && !(saveState.error || genState.error) && (
        <p className='break-all rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'>
          Current DID:&nbsp;<strong>{currentDid}</strong>
        </p>
      )}
    </div>
  )
}
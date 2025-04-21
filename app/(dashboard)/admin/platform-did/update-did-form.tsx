'use client'

import { useActionState, startTransition } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

import { upsertPlatformDidAction } from './actions'

type State = { error?: string; success?: string; did?: string }

interface Props {
  defaultDid: string | null
}

export default function UpdateDidForm({ defaultDid }: Props) {
  const [state, action, pending] = useActionState<State, FormData>(
    upsertPlatformDidAction,
    { error: '', success: '', did: '' },
  )

  /* Toast feedback */
  if (state.error) toast.error(state.error)
  if (state.success) toast.success(state.success)

  /* Manual submit */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  /* Auto‑generate */
  function handleGenerate() {
    startTransition(() => action(new FormData()))
  }

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

        <Button type='submit' disabled={pending} className='w-full sm:w-auto'>
          {pending ? (
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
        disabled={pending}
        className='w-full sm:w-auto'
      >
        {pending ? (
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
      {state.did && !state.error && (
        <p className='break-all rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'>
          Current DID:&nbsp;<strong>{state.did}</strong>
        </p>
      )}
    </div>
  )
}
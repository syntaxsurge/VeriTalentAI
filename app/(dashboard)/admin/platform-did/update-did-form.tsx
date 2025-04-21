'use client'

import * as React from 'react'
import { useActionState, startTransition } from 'react'
import { Loader2, RefreshCcw, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { upsertPlatformDidAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ActionState = { error?: string; success?: string; did?: string }

interface Props {
  /** Current DID pulled from the environment (may be null). */
  defaultDid: string | null
}

/* -------------------------------------------------------------------------- */
/*                                   VIEW                                     */
/* -------------------------------------------------------------------------- */

export default function UpdateDidForm({ defaultDid }: Props) {
  /* --------------------------- local state --------------------------- */
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [editing, setEditing] = React.useState(false)

  /* separate hooks so each button owns its own pending flag */
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    upsertPlatformDidAction,
    { error: '', success: '', did: '' },
  )
  const [genState, genAction, generating] = useActionState<ActionState, FormData>(
    upsertPlatformDidAction,
    { error: '', success: '', did: '' },
  )

  /* --------------------------- effect helpers --------------------------- */
  React.useEffect(() => {
    if (saveState.error) toast.error(saveState.error)
    if (saveState.success) {
      toast.success(saveState.success)
      setEditing(false)
    }
    if (saveState.did && inputRef.current) inputRef.current.value = saveState.did
  }, [saveState])

  React.useEffect(() => {
    if (genState.error) toast.error(genState.error)
    if (genState.success) {
      toast.success(genState.success)
      setEditing(false)
    }
    if (genState.did && inputRef.current) inputRef.current.value = genState.did
  }, [genState])

  /* --------------------------- handlers --------------------------- */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    if (
      !window.confirm(
        'Saving will overwrite the existing Platform DID in your .env file and cannot be undone. Continue?',
      )
    )
      return
    const fd = new FormData(e.currentTarget)
    startTransition(() => saveAction(fd))
  }

  function handleGenerate() {
    if (
      !window.confirm(
        'Generating a new DID will permanently replace the current Platform DID in your .env file. This action is irreversible. Continue?',
      )
    )
      return
    startTransition(() => genAction(new FormData()))
  }

  function cancelEdit() {
    if (inputRef.current) {
      inputRef.current.value =
        saveState.did ?? genState.did ?? defaultDid ?? ''
    }
    setEditing(false)
  }

  /* --------------------------- JSX --------------------------- */
  return (
    <div className='space-y-6'>
      {/* DID display / edit field */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='did'>Platform DID</Label>
          <Input
            id='did'
            name='did'
            ref={inputRef}
            defaultValue={defaultDid ?? ''}
            placeholder='did:cheqd:testnet:xxxx'
            disabled={!editing}
            readOnly={!editing}
            required
          />
        </div>

        {editing ? (
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='submit'
              disabled={saving}
              className='sm:w-auto w-full'
            >
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={cancelEdit}
              disabled={saving}
              className='sm:w-auto w-full'
            >
              <X className='mr-2 h-4 w-4' />
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type='button'
            variant='outline'
            onClick={() => setEditing(true)}
            className='sm:w-auto w-full'
          >
            <Pencil className='mr-2 h-4 w-4' />
            Edit
          </Button>
        )}

        {/* irreversible warning */}
        <p className='text-xs text-destructive'>
          Warning: saving or generating a new DID will permanently overwrite the
          existing value in&nbsp;<code>.env</code>&nbsp;and cannot be undone.
        </p>
      </form>

      {/* Divider */}
      <div className='relative'>
        <span className='absolute inset-x-0 top-1/2 -translate-y-1/2 border-t' />
        <span className='relative mx-auto bg-background px-3 text-xs uppercase text-muted-foreground'>
          or
        </span>
      </div>

      {/* Generate new DID */}
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
    </div>
  )
}
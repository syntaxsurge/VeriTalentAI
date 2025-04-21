'use client'

import * as React from 'react'
import { startTransition } from 'react'
import { Pencil, Loader2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

import { upsertPlatformDidAction } from './actions'

type ActionState = { error?: string; success?: string; did?: string }

interface Props {
  /** Current DID pulled from the environment (may be null). */
  defaultDid: string | null
}

/**
 * Modernized form for editing or generating the platform DID.
 */
export default function UpdateDidForm({ defaultDid }: Props) {
  /* -------------------------------------------------------------------------- */
  /*                                S T A T E                                   */
  /* -------------------------------------------------------------------------- */
  const [currentDid, setCurrentDid] = React.useState<string>(defaultDid ?? '')
  const [didInput, setDidInput] = React.useState<string>(currentDid)
  const [editing, setEditing] = React.useState<boolean>(false)

  const [saveState, saveAction, saving] = React.useActionState<ActionState, FormData>(
    upsertPlatformDidAction,
    {},
  )
  const [genState, genAction, generating] = React.useActionState<ActionState, FormData>(
    upsertPlatformDidAction,
    {},
  )

  /* -------------------------------------------------------------------------- */
  /*                               E F F E C T S                                */
  /* -------------------------------------------------------------------------- */
  React.useEffect(() => {
    if (saveState?.error) toast.error(saveState.error)
    if (saveState?.success) {
      toast.success(saveState.success)
      if (saveState.did) {
        setCurrentDid(saveState.did)
        setDidInput(saveState.did)
      }
      setEditing(false)
    }
  }, [saveState])

  React.useEffect(() => {
    if (genState?.error) toast.error(genState.error)
    if (genState?.success) {
      toast.success(genState.success)
      if (genState.did) {
        setCurrentDid(genState.did)
        setDidInput(genState.did)
      }
      setEditing(false)
    }
  }, [genState])

  /* -------------------------------------------------------------------------- */
  /*                                 Helpers                                    */
  /* -------------------------------------------------------------------------- */
  function confirmSave() {
    const fd = new FormData()
    fd.append('did', didInput.trim())
    startTransition(() => saveAction(fd))
  }

  function confirmGenerate() {
    startTransition(() => genAction(new FormData()))
  }

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* DID field */}
      <Input
        value={didInput}
        onChange={(e) => setDidInput(e.target.value)}
        readOnly={!editing}
        disabled={!editing}
        placeholder="did:cheqd:testnet:xxxx"
        className="font-mono"
      />

      {/* Edit / Save controls */}
      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          {/* Save with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={saving} className="sm:w-auto w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Overwrite Platform DID?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently replace the stored value and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Cancel edit */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDidInput(currentDid)
              setEditing(false)
            }}
            disabled={saving}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
        </div>
      ) : (
        /* Edit button with confirmation */
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="sm:w-auto w-full">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Platform DID</AlertDialogTitle>
              <AlertDialogDescription>
                Editing lets you update the DID; changes are only saved after confirmation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => setEditing(true)}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Divider */}
      <div className="relative">
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t" />
        <span className="relative mx-auto bg-background px-3 text-xs uppercase text-muted-foreground">
          or
        </span>
      </div>

      {/* Generate new DID */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto" disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Generate New DID
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate a fresh DID?</AlertDialogTitle>
            <AlertDialogDescription>
              A brand‑new DID will be created via cheqd and will permanently replace the existing
              one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Generate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
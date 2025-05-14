'use client'

import React, { useState, useTransition } from 'react'

import { Fingerprint, Clipboard, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import PageCard from '@/components/ui/page-card'
import StatusBadge from '@/components/ui/status-badge'
import { verifyCredential, resolveDid } from '@/lib/cheqd'
import { copyToClipboard } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   P A G E                                  */
/* -------------------------------------------------------------------------- */

export default function VerifyCredentialPage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'verified' | 'failed' | 'found' | 'notfound' | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  /* ----------------------------- Handlers -------------------------------- */

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = input.trim()
    if (!value) return

    startTransition(async () => {
      /* DID ---------------------------------------------------------------- */
      if (value.startsWith('did:')) {
        const { found } = await resolveDid(value)
        if (found) {
          setResult('found')
          setMessage('DID Document resolved successfully.')
        } else {
          setResult('notfound')
          setMessage('DID not found on the cheqd network.')
        }
        return
      }

      /* VC ----------------------------------------------------------------- */
      const { verified } = await verifyCredential(value)
      setResult(verified ? 'verified' : 'failed')
      setMessage(verified ? 'Credential signature is valid.' : 'Credential signature is NOT valid.')
    })
  }

  function pasteFromClipboard() {
    navigator.clipboard
      .readText()
      .then((text) => setInput(text))
      .catch(() => toast.error('Clipboard read failed.'))
  }

  /* ------------------------------- UI ----------------------------------- */

  const success = result === 'verified' || result === 'found'
  const status = success ? 'verified' : 'failed'

  return (
    <PageCard
      icon={Fingerprint}
      title='Check Credential or DID'
      description='Check whether a Verifiable Credential signature is valid or resolve a did:cheqd identifier.'
    >
      <div className='space-y-6'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            required
            spellCheck={false}
            placeholder='Paste VC JWT / JSON — or — did:cheqd:…'
            className='border-border focus-visible:ring-primary w-full resize-y rounded-md border p-3 font-mono text-xs leading-tight focus-visible:ring-2'
          />

          <div className='flex flex-wrap gap-2'>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Checking…' : 'Check Status'}
            </Button>

            <Button
              type='button'
              variant='outline'
              onClick={pasteFromClipboard}
              title='Paste from clipboard'
            >
              <Clipboard className='mr-2 h-4 w-4' />
              Paste
            </Button>
          </div>
        </form>

        {result && (
          <div className='flex items-center gap-2'>
            {success ? (
              <CheckCircle2 className='h-5 w-5 text-emerald-600' />
            ) : (
              <XCircle className='h-5 w-5 text-rose-600' />
            )}

            <StatusBadge status={status} />
            <span className='text-sm'>{message}</span>

            {input && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => copyToClipboard(input)}
                title='Copy input'
              >
                <Clipboard className='h-4 w-4' />
                <span className='sr-only'>Copy</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </PageCard>
  )
}

'use client'

import React, { useState, useTransition } from 'react'

import { BadgeCheck, CheckCircle2, XCircle, Clipboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import StatusBadge from '@/components/ui/status-badge'
import { verifyCredential, resolveDid } from '@/lib/cheqd'
import { copyToClipboard } from '@/lib/utils'

/**
 * Public tool to verify a Verifiable Credential or resolve a DID using cheqd Studio.
 * If the input starts with "did:" it performs DID resolution, otherwise it treats
 * the input as a VC (JWT or JSON) and verifies it.
 */
export default function VerifyCredentialPage() {
  const [input, setInput] = useState('')
  const [result, setResult] =
    useState<'verified' | 'failed' | 'found' | 'notfound' | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  /* ------------------------------------------------------------------ */
  /*                              Handlers                              */
  /* ------------------------------------------------------------------ */
  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = input.trim()
    if (!value) return

    startTransition(async () => {
      /* DID resolution --------------------------------------------------- */
      if (value.startsWith('did:')) {
        const { found } = await resolveDid(value)
        if (found) {
          setResult('found')
          setMessage('DID Document found and resolved successfully.')
        } else {
          setResult('notfound')
          setMessage('DID not found on cheqd network.')
        }
        return
      }

      /* VC verification --------------------------------------------------- */
      const { verified } = await verifyCredential(value)
      setResult(verified ? 'verified' : 'failed')
      setMessage(
        verified
          ? 'Credential signature verified successfully.'
          : 'Credential verification failed.',
      )
    })
  }

  /* ------------------------------------------------------------------ */
  /*                              Helpers                               */
  /* ------------------------------------------------------------------ */
  const status =
    result === 'verified' || result === 'found'
      ? 'success'
      : result === 'failed' || result === 'notfound'
        ? 'error'
        : null

  /* ------------------------------------------------------------------ */
  /*                                View                                */
  /* ------------------------------------------------------------------ */
  return (
    <PageCard
      icon={BadgeCheck}
      title='Verify Credential or DID'
      description='Validate a Verifiable Credential JWT/JSON or resolve a did:cheqd identifier.'
    >
      <div className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Verification Tool</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <form onSubmit={handleVerify} className='space-y-4'>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
                required
                placeholder='Paste VC JWT / JSON or did:cheqd:…'
                className='border-border focus-visible:ring-primary w-full rounded-md border p-3 text-sm focus-visible:ring-2'
              />
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Verifying…' : 'Verify'}
              </Button>
            </form>

            {result && (
              <div className='flex items-center gap-3'>
                {status === 'success' ? (
                  <CheckCircle2 className='text-primary h-6 w-6 shrink-0' />
                ) : (
                  <XCircle className='text-destructive h-6 w-6 shrink-0' />
                )}
                <p className='flex-1 text-sm'>{message}</p>
                {input && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => copyToClipboard(input)}
                  >
                    <Clipboard className='h-4 w-4' />
                    <span className='sr-only'>Copy</span>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className='flex justify-center'>
            <StatusBadge status={status === 'success' ? 'verified' : 'failed'} showIcon />
          </div>
        )}
      </div>
    </PageCard>
  )
}
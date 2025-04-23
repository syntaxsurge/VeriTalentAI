'use client'

import React, { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { verifyCredential } from '@/lib/cheqd'

import { saveVerifiedVc } from './actions'

export default function VerifyCredentialPage() {
  const [vc, setVc] = useState('')
  const [result, setResult] = useState<'verified' | 'failed' | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const vcStr = vc.trim()
    if (!vcStr) return

    startTransition(async () => {
      try {
        const parsed = JSON.parse(vcStr)
        const { verified } = await verifyCredential(parsed)
        setResult(verified ? 'verified' : 'failed')
        setMessage(verified ? 'Credential verified successfully.' : 'Verification failed.')

        // Persist to DB (fire-and-forget)
        saveVerifiedVc(vcStr, verified).catch(() => {})

        toast.success(verified ? 'Verified ✔' : 'Saved for troubleshooting')
      } catch (err: any) {
        setResult('failed')
        setMessage('Error verifying: ' + String(err))
      }
    })
  }

  function pasteFromClipboard() {
    navigator.clipboard
      .readText()
      .then((text) => setVc(text))
      .catch(() => toast.error('Clipboard read failed'))
  }

  return (
    <section className='space-y-6'>
      <header className='max-w-2xl space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight'>Verify Credential</h1>
        <p className='text-muted-foreground text-sm'>
          Paste the <strong>VC JSON or JWT</strong> you received below. On success, the credential is
          archived so you can easily copy it later.
        </p>
      </header>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>Verification Tool</CardTitle>
        </CardHeader>

        <CardContent className='space-y-4'>
          <form onSubmit={handleVerify} className='space-y-4'>
            <textarea
              value={vc}
              onChange={(e) => setVc(e.target.value)}
              rows={10}
              required
              spellCheck={false}
              className='font-mono border-border w-full resize-y rounded-md border p-3 text-xs leading-tight'
              placeholder='Paste full VC JSON or JWT here…'
            />

            <div className='flex flex-wrap gap-2'>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Verifying…' : 'Verify'}
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
              {result === 'verified' ? (
                <CheckCircle2 className='text-emerald-600 h-5 w-5' />
              ) : (
                <XCircle className='text-rose-600 h-5 w-5' />
              )}
              <StatusBadge status={result} />
              <span>{message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
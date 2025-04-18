'use client'

import React, { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { verifyCredential } from '@/lib/cheqd'

export default function VerifyCredentialPage() {
  const [vc, setVc] = useState('')
  const [result, setResult] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const vcStr = fd.get('vc') as string

    startTransition(async () => {
      try {
        const obj = JSON.parse(vcStr)
        const { verified } = await verifyCredential(obj)
        setResult(verified ? 'Credential verified ✔' : 'Verification failed.')
      } catch (err) {
        setResult('Error verifying: ' + String(err))
      }
    })
  }

  return (
    <section className='max-w-xl'>
      <h2 className='mb-4 text-xl font-semibold'>Verify a Credential</h2>

      <form onSubmit={handleVerify} className='space-y-4'>
        <textarea
          name='vc'
          rows={8}
          value={vc}
          onChange={(e) => setVc(e.target.value)}
          className='border-border w-full rounded border p-2'
          placeholder='Paste the VC JSON here…'
          required
        />
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Verifying…' : 'Verify Credential'}
        </Button>
      </form>

      {result && <p className='mt-4'>{result}</p>}
    </section>
  )
}

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState, startTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  approveCredentialAction,
  rejectCredentialAction,
} from '@/app/(dashboard)/issuer/credentials/actions'

type ActionState = { error?: string; success?: string }

export function CredentialActions({ credentialId }: { credentialId: number }) {
  const router = useRouter()

  /* ---------------- Approve ---------------- */
  const [approveState, approve, approving] = useActionState<ActionState, FormData>(
    approveCredentialAction,
    { error: '', success: '' },
  )

  /* ---------------- Reject ----------------- */
  const [rejectState, reject, rejecting] = useActionState<ActionState, FormData>(
    rejectCredentialAction,
    { error: '', success: '' },
  )

  /* ---------------- Toast effects ---------- */
  React.useEffect(() => {
    if (approveState.error) toast.error(approveState.error)
    if (approveState.success) {
      toast.success(approveState.success)
      router.push('/issuer/requests')
    }
  }, [approveState.error, approveState.success, router])

  React.useEffect(() => {
    if (rejectState.error) toast.error(rejectState.error)
    if (rejectState.success) {
      toast.success(rejectState.success)
      router.push('/issuer/requests')
    }
  }, [rejectState.error, rejectState.success, router])

  /* ---------------- Handlers ---------------- */
  const runApprove = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('credentialId', credentialId.toString())
    startTransition(() => approve(fd))
  }

  const runReject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('credentialId', credentialId.toString())
    startTransition(() => reject(fd))
  }

  /* ---------------- UI ---------------------- */
  return (
    <div className='flex flex-wrap gap-4'>
      {/* Approve & sign */}
      <form onSubmit={runApprove}>
        <Button type='submit' disabled={approving}>
          {approving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Processing…
            </>
          ) : (
            'Approve & Sign VC'
          )}
        </Button>
      </form>

      {/* Reject */}
      <form onSubmit={runReject}>
        <Button type='submit' variant='destructive' disabled={rejecting}>
          {rejecting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Processing…
            </>
          ) : (
            'Reject'
          )}
        </Button>
      </form>
    </div>
  )
}
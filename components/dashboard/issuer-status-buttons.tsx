'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IssuerStatus } from '@/lib/db/schema/issuer'
import { updateIssuerStatusAction } from '@/app/(dashboard)/admin/issuers/actions'

interface Props {
  issuerId: number
  status: string
}

const PRESETS = ['Spam / fraudulent', 'Incorrect details', 'Other'] as const

export default function IssuerStatusButtons({ issuerId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /* -------- Reject popup state -------- */
  const [showReject, setShowReject] = useState(false)
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>('Spam / fraudulent')
  const [custom, setCustom] = useState('')

  function mutate(nextStatus: keyof typeof IssuerStatus, reason?: string) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('issuerId', issuerId.toString())
      fd.append('status', nextStatus)
      if (reason) fd.append('rejectionReason', reason)
      await updateIssuerStatusAction({}, fd)
      setShowReject(false)
      router.refresh()
    })
  }

  /* ----------------------------- Render ----------------------------- */
  if (showReject) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const reason = preset === 'Other' ? custom : preset
          mutate(IssuerStatus.REJECTED, reason)
        }}
        className='flex flex-col gap-2'
      >
        <div>
          <Label htmlFor='reason' className='mb-1 block text-xs font-medium'>
            Rejection Reason
          </Label>
          <select
            id='reason'
            value={preset}
            onChange={(e) => setPreset(e.target.value as (typeof PRESETS)[number])}
            className='h-8 w-full rounded-md border px-2 text-xs'
          >
            {PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {preset === 'Other' && (
          <Input
            placeholder='Add custom reason…'
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            required
            className='h-8'
          />
        )}

        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isPending}
            onClick={() => setShowReject(false)}
          >
            Cancel
          </Button>
          <Button type='submit' size='sm' variant='destructive' disabled={isPending}>
            Confirm
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className='flex gap-2 whitespace-nowrap'>
      {status !== IssuerStatus.ACTIVE && (
        <Button
          size='sm'
          disabled={isPending}
          onClick={() => mutate(IssuerStatus.ACTIVE)}
        >
          Verify
        </Button>
      )}

      {status === IssuerStatus.ACTIVE && (
        <Button
          size='sm'
          variant='outline'
          disabled={isPending}
          onClick={() => mutate(IssuerStatus.PENDING)}
        >
          Unverify
        </Button>
      )}

      {status !== IssuerStatus.REJECTED && (
        <Button
          size='sm'
          variant='destructive'
          disabled={isPending}
          onClick={() => setShowReject(true)}
        >
          Reject
        </Button>
      )}
    </div>
  )
}
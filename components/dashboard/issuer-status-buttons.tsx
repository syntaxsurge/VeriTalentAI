'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { IssuerStatus } from '@/lib/db/schema/issuer'
import { updateIssuerStatusAction } from '@/app/(dashboard)/admin/issuers/actions'

interface Props {
  issuerId: number
  status: string
}

/**
 * Renders Verify / Unverify / Reject buttons for a single issuer row
 * and applies changes without a manual refresh.
 */
export default function IssuerStatusButtons({ issuerId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function mutate(next: keyof typeof IssuerStatus) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('issuerId', issuerId.toString())
      fd.append('status', next)
      await updateIssuerStatusAction({}, fd)
      router.refresh()
    })
  }

  return (
    <div className='flex gap-2 whitespace-nowrap'>
      {status !== IssuerStatus.ACTIVE && (
        <Button size='sm' disabled={isPending} onClick={() => mutate(IssuerStatus.ACTIVE)}>
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
          onClick={() => mutate(IssuerStatus.REJECTED)}
        >
          Reject
        </Button>
      )}
    </div>
  )
}
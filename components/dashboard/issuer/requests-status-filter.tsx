'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { CredentialStatus } from '@/lib/db/schema/viskify'

/** Canonical selectable statuses (lower‑case values that match the DB). */
const STATUSES = [
  CredentialStatus.PENDING,
  CredentialStatus.VERIFIED,
  CredentialStatus.REJECTED,
] as const

export function RequestsStatusFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const param = searchParams.get('status') ?? CredentialStatus.PENDING
  const selected = new Set(
    param
      .split(',')
      .filter(Boolean)
      .map((s) => s.toLowerCase()),
  )

  function toggle(status: string) {
    const next = new Set(selected)
    if (next.has(status)) {
      next.delete(status)
    } else {
      next.add(status)
    }
    /* Ensure at least one status (fallback → pending) */
    if (next.size === 0) next.add(CredentialStatus.PENDING)

    const params = new URLSearchParams(searchParams)
    params.set('status', Array.from(next).join(','))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='gap-1'>
          Status&nbsp;Filter <ChevronDown className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {STATUSES.map((s) => {
          const active = selected.has(s)
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => toggle(s)}
              className='flex cursor-pointer items-center gap-2 capitalize'
            >
              <Checkbox checked={active} className='h-4 w-4' />
              {s}
              {active && <Check className='ml-auto h-4 w-4 text-primary' />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
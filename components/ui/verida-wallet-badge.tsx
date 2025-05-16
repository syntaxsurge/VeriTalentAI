'use client'

import * as React from 'react'

import { Loader2 } from 'lucide-react'

import { useVeridaStatus } from '@/lib/hooks/use-verida-status'
import { cn } from '@/lib/utils'

import { Badge } from './badge'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card'
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

/* -------------------------------------------------------------------------- */
/*                         V E R I D A   W A L L E T   B A D G E              */
/* -------------------------------------------------------------------------- */

export interface VeridaWalletBadgeProps {
  /** True when the platform knows a Verida auth_token exists. */
  connected: boolean
  /** Optional list of authorised data providers. */
  providers?: string[]
  /** Optional user ID for provider-list fetch when none supplied. */
  userId?: number
  /** Loading state – when true a spinner is shown. */
  loading?: boolean
  /** Use a hover-card instead of a tooltip (better on touch). */
  useHoverCard?: boolean
  className?: string
}

export function VeridaWalletBadge({
  connected,
  providers,
  userId,
  loading,
  useHoverCard = false,
  className,
}: VeridaWalletBadgeProps) {
  /* ----------------------- Conditional provider fetch -------------------- */
  const shouldFetchProviders = connected && !providers && typeof userId === 'number'
  const status = useVeridaStatus(userId, shouldFetchProviders)

  /* Choose explicit loading prop first, else hook status */
  const isLoading = loading !== undefined ? loading : shouldFetchProviders ? status.loading : false

  const effectiveProviders = providers ?? status.providers

  /* ------------------------- Visual style tokens ------------------------- */
  const styleNoConnection =
    'border-red-600 bg-red-600/10 text-red-700 dark:border-red-500 dark:text-red-400'
  const styleConnected =
    'border-green-600 bg-green-600/10 text-green-700 dark:border-green-500 dark:text-green-400'
  const styleLoading = 'border-muted bg-muted text-muted-foreground'

  const badgeStyle = isLoading ? styleLoading : connected ? styleConnected : styleNoConnection

  /* --------------------------- Tooltip text ------------------------------ */
  let tooltipText: string
  if (isLoading) {
    tooltipText = 'Checking Verida status…'
  } else if (!connected) {
    tooltipText = 'No Verida wallet connected'
  } else if (!effectiveProviders) {
    tooltipText = 'Verida connected – loading provider list…'
  } else if (effectiveProviders.length === 0) {
    tooltipText = 'Verida connected'
  } else {
    tooltipText = `Providers: ${effectiveProviders.join(', ')}`
  }

  /* ----------------------------- Badge JSX ------------------------------- */
  const badgeEl = (
    <Badge
      size='sm'
      variant='outline'
      className={cn('cursor-default gap-1 rounded-full select-none', badgeStyle, className)}
    >
      {isLoading ? (
        <Loader2 className='size-3 animate-spin' />
      ) : connected ? (
        <>
          Verida
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 16 16'
            fill='currentColor'
            className='size-3'
          >
            <path
              fillRule='evenodd'
              d='M13.854 3.646a.5.5 0 0 1 0 .708l-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708 0z'
            />
          </svg>
        </>
      ) : (
        'No Verida'
      )}
    </Badge>
  )

  /* --------------------- Tooltip / Hover-card wrapper -------------------- */
  if (useHoverCard) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>{badgeEl}</HoverCardTrigger>
        <HoverCardContent>{tooltipText}</HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
      <TooltipContent sideOffset={4}>{tooltipText}</TooltipContent>
    </Tooltip>
  )
}

export default VeridaWalletBadge

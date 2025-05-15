'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { Badge } from './badge'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card'
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'
import { useVeridaStatus } from '@/lib/hooks/use-verida-status'

/* -------------------------------------------------------------------------- */
/*                         V E R I D A   W A L L E T   B A D G E              */
/* -------------------------------------------------------------------------- */

export interface VeridaWalletBadgeProps {
  /** Is a Verida Vault token present for the user. */
  connected: boolean
  /** Optional list of authorised data providers (gmail, telegram …). */
  providers?: string[]
  /** Optional user ID – needed when <code>providers</code> is omitted so the
   *  badge can fetch the list itself. */
  userId?: number
  /** Use a hover-card instead of a tooltip (helpful on touch devices). */
  useHoverCard?: boolean
  className?: string
}

export function VeridaWalletBadge({
  connected,
  providers,
  userId,
  useHoverCard = false,
  className,
}: VeridaWalletBadgeProps) {
  /* -------------------------- Lazy status fetch --------------------------- */
  const shouldFetch = connected && !providers && typeof userId === 'number'
  const status = useVeridaStatus(userId, shouldFetch)
  const effectiveProviders = providers ?? status.providers

  /* -------------------------- Visual styles ------------------------------ */
  const badgeStyles = connected
    ? 'border-green-600 bg-green-600/10 text-green-700 dark:border-green-500 dark:text-green-400'
    : 'border-red-600 bg-red-600/10 text-red-700 dark:border-red-500 dark:text-red-400'

  /* -------------------------- Tooltip content ---------------------------- */
  let tooltipText: string
  if (!connected) {
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
      className={cn('cursor-default rounded-full select-none', badgeStyles, className)}
    >
      {connected ? (
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
              d='M13.854 3.646a.5.5 0 010 .708l-7.5 7.5a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6 10.293l7.146-7.147a.5.5 0 01.708 0z'
              clipRule='evenodd'
            />
          </svg>
        </>
      ) : (
        'No Verida'
      )}
    </Badge>
  )

  /* -------------------- Tooltip / Hover-card wrapper --------------------- */
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
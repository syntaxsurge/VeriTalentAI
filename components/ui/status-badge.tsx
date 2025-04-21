'use client'

import { cn } from '@/lib/utils'

/**
 * High‑contrast badge for credential / issuer statuses that adapts to light & dark themes.
 *
 * Supported keys (case‑insensitive):
 *   verified · active · pending · unverified · inactive · rejected
 * Any unknown value falls back to the "unverified” style but still shows the raw text.
 */
const STYLE_MAP: Record<string, string> = {
  verified:
    'bg-emerald-600/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200',
  active:
    'bg-emerald-600/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200',
  pending:
    'bg-amber-500/20 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200',
  unverified:
    'bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-200',
  inactive:
    'bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-200',
  rejected:
    'bg-rose-600/15 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200',
}

/* -------------------------------------------------------------------------- */
/*                                   Badge                                    */
/* -------------------------------------------------------------------------- */

export interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase()
  const style = STYLE_MAP[key] ?? STYLE_MAP.unverified
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap',
        style,
        className,
      )}
    >
      {key}
    </span>
  )
}

export default StatusBadge
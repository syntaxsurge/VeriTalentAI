'use client'

import { STAGES } from '@/lib/constants/recruiter'
import { cn } from '@/lib/utils'

/**
 * Global status badge — supports credential, invitation, issuer and
 * recruiter‑pipeline stages so every status indicator is centralised.
 *
 * Add/adjust colours here only; all callers simply import `<StatusBadge />`.
 */
const STYLE_MAP: Record<string, string> = {
  /* Credential / generic states */
  verified:
    'bg-emerald-600/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200',
  active:
    'bg-emerald-600/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200',
  accepted:
    'bg-emerald-600/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200',
  pending:
    'bg-amber-500/20 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200',
  unverified:
    'bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-200',
  inactive:
    'bg-zinc-500/15 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-200',
  declined:
    'bg-rose-600/15 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200',
  rejected:
    'bg-rose-600/15 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200',
}

/* -------------------------------------------------------------------------- */
/*                       Dynamic recruiter‑pipeline stages                    */
/* -------------------------------------------------------------------------- */

/** Neutral primary‑tinted chip for every pipeline stage. */
const PIPELINE_STYLE =
  'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-200'

STAGES.forEach((stage) => {
  STYLE_MAP[stage.toLowerCase()] = PIPELINE_STYLE
})

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
      {status}
    </span>
  )
}

export default StatusBadge
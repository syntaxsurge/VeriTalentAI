'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

/**
 * Displays a single error or success message from an ActionState‑shaped object
 * and emits a coloured Sonner toast the first time each message appears.
 *
 * @example
 *   <FormStatus state={formState} />
 */
interface FormStatusProps {
  /** The action‑state object returned by useActionState */
  state?: { error?: string; success?: string }
  /** Extra utility‑first classes (optional) */
  className?: string
}

export function FormStatus({ state, className }: FormStatusProps) {
  // Track the previous message so we only toast on changes
  const prevRef = React.useRef<{ error?: string; success?: string }>()

  React.useEffect(() => {
    if (!state) return

    const changed =
      state.error !== prevRef.current?.error || state.success !== prevRef.current?.success

    if (changed) {
      prevRef.current = state
      if (state.error) toast.error(state.error)
      else if (state.success) toast.success(state.success)
    }
  }, [state])

  if (!state) return null
  if (state.error) return <p className={cn('text-sm text-red-500', className)}>{state.error}</p>
  if (state.success)
    return <p className={cn('text-sm text-green-500', className)}>{state.success}</p>
  return null
}
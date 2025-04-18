'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Displays a single error or success message taken from an ActionState‑shaped object.
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
  if (!state) return null
  if (state.error) return <p className={cn('text-sm text-red-500', className)}>{state.error}</p>
  if (state.success)
    return <p className={cn('text-sm text-green-500', className)}>{state.success}</p>
  return null
}

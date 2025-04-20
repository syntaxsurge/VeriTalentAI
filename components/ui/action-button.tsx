'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button, type ButtonProps } from '@/components/ui/button'

type ActionResult =
  | void
  | { success?: string; error?: string }

/**
 * A drop‑in replacement for &lt;Button&gt; that:
 *  • runs an async callback (onAction) inside React transition
 *  • shows a spinner while pending
 *  • displays a coloured toast for { success, error } responses
 */
export interface ActionButtonProps extends ButtonProps {
  onAction: () => Promise<ActionResult>
  /** Shown while pending; falls back to children. */
  pendingLabel?: React.ReactNode
}

export function ActionButton({
  onAction,
  pendingLabel,
  children,
  disabled,
  ...rest
}: ActionButtonProps) {
  const [isPending, startTransition] = useTransition()

  async function handleClick() {
    startTransition(async () => {
      const result = await onAction()
      if (result && typeof result === 'object') {
        if ('error' in result && result.error) {
          toast.error(result.error)
        } else if ('success' in result && result.success) {
          toast.success(result.success)
        }
      }
    })
  }

  return (
    <Button
      disabled={disabled || isPending}
      onClick={handleClick}
      {...rest}
    >
      {isPending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
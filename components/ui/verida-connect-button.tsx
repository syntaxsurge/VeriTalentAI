'use client'

import { useState } from 'react'
import { mutate } from 'swr'

import { toast } from 'sonner'

import { buildAuthUrl } from '@/lib/verida/public'

type VeridaConnectButtonProps = {
  /** True when the user has an existing Verida auth_token */
  connected?: boolean
}

/**
 * Connect / disconnect Verida button.
 *
 * When not connected, shows the official "Connect Verida" image that links to
 * the Vault authentication flow. When connected, renders a red "Disconnect
 * Verida" badge that removes the stored token (server-side and localStorage)
 * then reloads the page so the UI reflects the disconnected state.
 */
export default function VeridaConnectButton({ connected = false }: VeridaConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  /* ------------------------------ disconnect ----------------------------- */
  async function disconnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/verida/disconnect', { method: 'POST' })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Failed to disconnect Verida')
      }

      /* Clear client-side token (used by browser-only helpers) */
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('verida_auth_token')
      }

      /* Invalidate cached Verida status so UI updates immediately */
      try {
        mutate(
          (key: string) => typeof key === 'string' && key.startsWith('verida-status-'),
          undefined,
          { revalidate: false },
        )
      } catch {
        /* no-op: SWR may not be initialised */
      }

      toast.success('Verida account disconnected')
      /* Hard reload so server components re-evaluate connected state */
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.message ?? 'Error disconnecting Verida')
      setLoading(false)
    }
  }

  /* ------------------------------ render --------------------------------- */
  if (connected) {
    return (
      <button
        onClick={disconnect}
        disabled={loading}
        className='inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60'
      >
        {loading ? 'Disconnecting…' : 'Disconnect Verida'}
      </button>
    )
  }

  return (
    <a
      href={buildAuthUrl()}
      className='verida-connect inline-block transition-opacity hover:opacity-80'
    >
      <img
        src='https://assets.verida.io/auth/Connect-Verida.png'
        alt='Connect Verida'
        className='h-8 w-auto'
      />
    </a>
  )
}
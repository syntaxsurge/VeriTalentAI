'use client'

import { buildAuthUrl } from '@/lib/verida/public'

type VeridaConnectButtonProps = {
  /** True when the user has an existing Verida auth_token */
  connected?: boolean
}

/**
 * Displays the official "Connect Verida" image when disconnected and a green
 * "Verida Connected" badge once an auth_token is stored for the current user.
 */
export default function VeridaConnectButton({ connected = false }: VeridaConnectButtonProps) {
  if (connected) {
    return (
      <span className='inline-flex items-center rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white'>
        Verida&nbsp;Connected
      </span>
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

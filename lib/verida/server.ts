import 'server-only'

import { VERIDA_API_URL, VERIDA_API_VERSION } from '@/lib/config'
import { getVeridaToken } from '@/lib/db/queries/queries'

async function veridaFetch<T>(
  userId: number,
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const tokenRow = await getVeridaToken(userId)
  if (!tokenRow) throw new Error('User has not connected a Verida account.')

  const res = await fetch(`${VERIDA_API_URL}/${VERIDA_API_VERSION}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${tokenRow.authToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
    ...init,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Verida request failed (${res.status}): ${text}`)
  }

  return (await res.json()) as T
}

/**
 * Server-side Universal Search that automatically injects the current user’s
 * Bearer token fetched from <code>verida_tokens</code>.
 */
export async function searchUniversal(
  keywords: string,
  userId: number,
): Promise<Record<string, any>> {
  const qs = new URLSearchParams({ keywords }).toString()
  return veridaFetch(userId, `/search/universal?${qs}`)
}

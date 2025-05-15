import 'server-only'

import { getVeridaToken } from '@/lib/db/queries/queries'

import { buildVeridaUrl } from './common'

/* -------------------------------------------------------------------------- */
/*                       V E R I D A   S E R V E R   H E L P E R              */
/* -------------------------------------------------------------------------- */

export interface VeridaFetchOptions {
  /**
   * When <code>true</code>, the supplied <code>path</code> will be treated as a
   * fully-qualified URL and will <strong>not</strong> be prefixed with the
   * default Verida base URL.
   */
  raw?: boolean
}

/**
 * Perform a server-side request to the Verida REST API on behalf of the given
 * user.
 *
 * @param userId   Authenticated platform user ID.
 * @param path     REST endpoint path beginning with <code>/</code>.
 * @param init     Standard {@link RequestInit} options (method, body, headers …).
 * @param options  Set <code>{ raw:true }</code> to bypass automatic URL prefixing.
 */
export async function veridaFetch<T = any>(
  userId: number,
  path: string,
  init: RequestInit = {},
  { raw = false }: VeridaFetchOptions = {},
): Promise<T> {
  /* Retrieve the stored auth token for the user */
  const tokenRow = await getVeridaToken(userId)
  if (!tokenRow) throw new Error('User has not connected a Verida account.')

  /* Resolve the final request URL */
  const url = buildVeridaUrl(path, raw)

  /* Issue the request with Bearer authentication */
  const res = await fetch(url, {
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

/* -------------------------------------------------------------------------- */
/*                             P U B L I C   A P I                            */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the Verida connection status and authorised providers for a user.
 * Returns { connected:false, providers:[] } when the request is unauthorised.
 *
 * @param userId Platform user ID.
 */
export async function fetchConnectionStatus(
  userId: number,
): Promise<{ connected: boolean; providers: string[] }> {
  try {
    const res = await veridaFetch<{
      connected?: boolean
      providers?: string[]
    }>(userId, '/connections/status')

    return {
      connected: !!res.connected,
      providers: Array.isArray(res.providers) ? res.providers : [],
    }
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : ''
    if (msg.includes('(401') || msg.includes('(403')) {
      return { connected: false, providers: [] }
    }
    throw err
  }
}

/**
 * Server-side Universal Search wrapper that injects the user’s Bearer token.
 *
 * @param keywords Search query string.
 * @param userId   Authenticated user performing the search.
 */
export async function searchUniversal(
  keywords: string,
  userId: number,
): Promise<Record<string, any>> {
  const qs = new URLSearchParams({ keywords }).toString()
  return veridaFetch<Record<string, any>>(userId, `/search/universal?${qs}`)
}

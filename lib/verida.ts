import {
  VERIDA_API_URL,
  VERIDA_API_VERSION,
  VERIDA_DEFAULT_SCOPES,
  VERIDA_APP_REDIRECT_URL,
  VERIDA_AUTH_ENDPOINT,
} from '@/lib/config'

/**
 * Build an authentication URL for initiating the Verida OAuth-style flow.
 * Mirrors the documentation example, adding payer=app and redirectUrl.
 */
export function buildAuthUrl(scopes: string[] = VERIDA_DEFAULT_SCOPES): string {
  const url = new URL(VERIDA_AUTH_ENDPOINT)
  scopes.forEach((scope) => url.searchParams.append('scopes', scope))
  url.searchParams.append('redirectUrl', VERIDA_APP_REDIRECT_URL)
  url.searchParams.append('payer', 'app')
  return url.toString()
}

/**
 * Retrieve a stored auth token.
 * • On the client, read from localStorage.
 * • On the server, load from the database (lazy dynamic import to avoid bundle size).
 */
export async function getStoredToken(userId?: number): Promise<string | undefined> {
  /* Browser – read from localStorage first */
  if (typeof window !== 'undefined') {
    const token = window.localStorage?.getItem('veridaAuthToken') ?? undefined
    if (token) return token
  }

  /* Server – optionally query database */
  if (userId !== undefined) {
    try {
      const { getVeridaToken } = await import('@/lib/db/queries/queries')
      const row = await getVeridaToken(userId)
      return row?.authToken
    } catch {
      /* Database module not yet implemented or query failed */
    }
  }

  return undefined
}

/**
 * Wrapper around fetch that automatically prepends the base URL
 * and injects the Bearer token when available.
 */
export async function veridaFetch<T = any>(
  endpoint: string,
  init: RequestInit = {},
  userId?: number,
): Promise<T> {
  const token = await getStoredToken(userId)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  }

  const url = `${VERIDA_API_URL}/${VERIDA_API_VERSION}/${endpoint.replace(/^\/+/, '')}`

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Verida request failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<T>
}

/**
 * Helper – Universal search across all user data.
 * Requires api:search-universal scope.
 */
export function searchUniversal(keywords: string, userId?: number) {
  return veridaFetch(
    `search/universal?keywords=${encodeURIComponent(keywords)}`,
    {},
    userId,
  )
}

/**
 * Helper – Query a specific datastore via shortcut.
 * Requires api:ds-query and an appropriate ds:* scope.
 */
export function queryDatastore(
  dsShortcut: string,
  filters: Record<string, unknown>,
  userId?: number,
) {
  return veridaFetch(
    `ds/query/${encodeURIComponent(dsShortcut)}`,
    {
      method: 'POST',
      body: JSON.stringify({ filters }),
      headers: { 'Content-Type': 'application/json' },
    },
    userId,
  )
}
'use client'

import {
  VERIDA_API_URL,
  VERIDA_API_VERSION,
  VERIDA_DEFAULT_SCOPES,
  VERIDA_APP_REDIRECT_URL,
  VERIDA_AUTH_ENDPOINT,
} from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                          A U T H   U R L   B U I L D E R                   */
/* -------------------------------------------------------------------------- */

/**
 * Construct the Verida authentication URL to initiate the OAuth-style flow.
 * Mirrors the documentation example while setting payer=app.
 */
export function buildAuthUrl(scopes: string[] = VERIDA_DEFAULT_SCOPES): string {
  const url = new URL(VERIDA_AUTH_ENDPOINT)
  scopes.forEach((s) => url.searchParams.append('scopes', s))
  url.searchParams.append('redirectUrl', VERIDA_APP_REDIRECT_URL)
  url.searchParams.append('payer', 'app')
  return url.toString()
}

/* -------------------------------------------------------------------------- */
/*                        L O C A L   T O K E N   H E L P E R                 */
/* -------------------------------------------------------------------------- */

function getLocalToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage?.getItem('veridaAuthToken') ?? undefined
  } catch {
    return undefined
  }
}

/* -------------------------------------------------------------------------- */
/*                         R E S T   F E T C H   W R A P P E R                */
/* -------------------------------------------------------------------------- */

/**
 * Thin wrapper over <fetch> that prefixes the Verida base URL, injects
 * <Authorization: Bearer …> when a token is present, and returns JSON.
 */
export async function veridaFetch<T = any>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getLocalToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  }

  // Ensure no double slashes when concatenating
  const sanitized = endpoint.replace(/^\/+/, '')
  const url = `${VERIDA_API_URL}/${VERIDA_API_VERSION}/${sanitized}`

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Verida request failed (${res.status}): ${body}`)
  }

  // Some endpoints (eg 204 No Content) legitimately return empty bodies
  if (res.status === 204) {
    return undefined as unknown as T
  }

  return (await res.json()) as T
}

/* -------------------------------------------------------------------------- */
/*                     H I G H - L E V E L   H E L P E R S                    */
/* -------------------------------------------------------------------------- */

/**
 * Universal keyword search across all user data.
 * Requires the api:search-universal scope.
 */
export function searchUniversal<T = any>(keywords: string): Promise<T> {
  return veridaFetch<T>(`search/universal?keywords=${encodeURIComponent(keywords)}`)
}

/**
 * Query a specific datastore by shortcut or base64 schema URL.
 * Requires api:ds-query and a matching ds:* scope.
 */
export function queryDatastore<T = any>(
  dsShortcut: string,
  filters: Record<string, unknown>,
): Promise<T> {
  return veridaFetch<T>(`ds/query/${encodeURIComponent(dsShortcut)}`, {
    method: 'POST',
    body: JSON.stringify({ filters }),
    headers: { 'Content-Type': 'application/json' },
  })
}
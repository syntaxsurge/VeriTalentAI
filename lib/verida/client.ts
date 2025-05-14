'use client'

import {
  VERIDA_API_URL,
  VERIDA_API_VERSION,
  VERIDA_DEFAULT_SCOPES,
  VERIDA_APP_REDIRECT_URL,
  VERIDA_AUTH_ENDPOINT,
} from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                      P U B L I C   A U T H   U R L                         */
/* -------------------------------------------------------------------------- */

export function buildAuthUrl(scopes: string[] = VERIDA_DEFAULT_SCOPES): string {
  const url = new URL(VERIDA_AUTH_ENDPOINT)
  scopes.forEach((scope) => url.searchParams.append('scopes', scope))
  url.searchParams.append('redirectUrl', VERIDA_APP_REDIRECT_URL)
  url.searchParams.append('payer', 'app')
  return url.toString()
}

/* -------------------------------------------------------------------------- */
/*                       B E A R E R   T O K E N   U T I L                    */
/* -------------------------------------------------------------------------- */

function getLocalToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.localStorage?.getItem('veridaAuthToken') ?? undefined
}

/* -------------------------------------------------------------------------- */
/*                         F E T C H   W R A P P E R                          */
/* -------------------------------------------------------------------------- */

export async function veridaFetch<T = any>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getLocalToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  }

  // Remove any leading slashes so we don't end up with double //
  const url = `${VERIDA_API_URL}/${VERIDA_API_VERSION}/${endpoint.replace(/^\/+/, '')}`

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Verida request failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<T>
}

/* -------------------------------------------------------------------------- */
/*                       H I G H - L E V E L   H E L P E R S                  */
/* -------------------------------------------------------------------------- */

export function searchUniversal(keywords: string) {
  return veridaFetch(`search/universal?keywords=${encodeURIComponent(keywords)}`)
}

export function queryDatastore(dsShortcut: string, filters: Record<string, unknown>) {
  return veridaFetch(
    `ds/query/${encodeURIComponent(dsShortcut)}`,
    {
      method: 'POST',
      body: JSON.stringify({ filters }),
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
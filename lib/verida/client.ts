import { VERIDA_API_URL, VERIDA_API_VERSION } from '@/lib/config'

const isBrowser = typeof window !== 'undefined'

/**
 * Read the auth token saved by the Verida callback (stored by frontend
 * code after a successful connect flow). Returns <code>null</code> when
 * the user has not connected Verida in this browser session.
 */
function getStoredToken(): string | null {
  if (!isBrowser) return null
  try {
    return window.localStorage.getItem('verida_auth_token')
  } catch {
    return null
  }
}

/**
 * Lightweight wrapper that mirrors the Verida docs. Prepends the base API
 * URL/version and injects the Bearer token retrieved from <code>localStorage</code>.
 */
async function veridaFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  if (!token) throw new Error('Verida is not connected in this browser session.')

  const res = await fetch(`${VERIDA_API_URL}/${VERIDA_API_VERSION}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
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
 * Universal Search helper exactly as shown in the Verida REST examples.
 *
 * @param keywords Search query string.
 */
export async function searchUniversal(
  keywords: string,
  _userId?: number,
): Promise<Record<string, any>> {
  const qs = new URLSearchParams({ keywords }).toString()
  return veridaFetch(`/search/universal?${qs}`)
}

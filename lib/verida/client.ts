// noinspection JSUnusedGlobalSymbols
import { VERIDA_API_URL } from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                        V E R I D A   C L I E N T   (B R O W S E R)         */
/* -------------------------------------------------------------------------- */

const isBrowser = typeof window !== 'undefined'

/** Ensure no trailing slash so we can safely concatenate paths. */
const BASE_URL = VERIDA_API_URL.endsWith('/') ? VERIDA_API_URL.slice(0, -1) : VERIDA_API_URL

/**
 * Cross-runtime <code>btoa</code> with graceful fallback for Node environments.
 */
function base64(str: string): string {
  if (isBrowser) return window.btoa(str)
  return Buffer.from(str).toString('base64')
}

/**
 * Retrieve the auth token persisted to <code>localStorage</code> after a
 * successful Vault connect flow. Returns <code>null</code> when absent.
 */
function getStoredToken(): string | null {
  if (!isBrowser) return null
  try {
    return window.localStorage.getItem('verida_auth_token')
  } catch {
    return null
  }
}

export interface VeridaFetchOptions {
  /**
   * When <code>true</code> the <code>endpoint</code> argument is treated as a
   * fully-qualified URL and will <strong>not</strong> be prefixed with
   * {@link VERIDA_API_URL}. Useful for the Vault-generated redirect URL or
   * other absolute targets.
   */
  raw?: boolean
}

/**
 * Lightweight helper that prefixes requests with the Verida REST base URL and
 * injects the Bearer token stored on the client. The returned Promise resolves
 * with the parsed JSON body of the response.
 *
 * @param endpoint Path beginning with <code>/</code> such as
 *                 <code>/search/universal?keywords=foo</code>.
 * @param init     Standard <code>fetch()</code> request options.
 * @param options  Set <code>{ raw:true }</code> to skip URL prefixing.
 */
async function veridaFetch<T>(
  endpoint: string,
  init: RequestInit = {},
  { raw = false }: VeridaFetchOptions = {},
): Promise<T> {
  const token = getStoredToken()
  if (!token) throw new Error('Verida is not connected in this browser session.')

  const url = raw ? endpoint : `${BASE_URL}${endpoint}`

  const res = await fetch(url, {
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
 * Universal Search helper mirroring the Verida REST examples.
 *
 * @param keywords Search query string.
 */
export async function searchUniversal(keywords: string): Promise<Record<string, any>> {
  const qs = new URLSearchParams({ keywords }).toString()
  return veridaFetch(`/search/universal?${qs}`)
}

/**
 * Convenience helper to issue a datastore query for the supplied JSON schema.
 *
 * @param schemaUrl Full schema URL (eg:   https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json).
 * @param body      Query / options object to POST to <code>/ds/query</code>.
 *                  See Verida REST docs for full details.
 * @returns The <code>items</code> array, defaulting to <code>[]</code>.
 */
export async function queryDatastore<T = any>(
  schemaUrl: string,
  body: { query: Record<string, any>; options?: Record<string, any> },
): Promise<T[]> {
  const encoded = base64(schemaUrl)
  const res = await veridaFetch<{ items?: T[] }>(`/ds/query/${encoded}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return Array.isArray(res.items) ? res.items : []
}

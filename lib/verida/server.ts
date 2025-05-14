import 'server-only'

import { VERIDA_API_URL } from '@/lib/config'
import { getVeridaToken } from '@/lib/db/queries/queries'

/* -------------------------------------------------------------------------- */
/*                       V E R I D A   S E R V E R   H E L P E R              */
/* -------------------------------------------------------------------------- */

/** Ensure no trailing slash to avoid double separators. */
const BASE_URL = VERIDA_API_URL.endsWith('/') ? VERIDA_API_URL.slice(0, -1) : VERIDA_API_URL

export interface VeridaFetchOptions {
  /**
   * Skip automatic prefixing with {@link VERIDA_API_URL}. The supplied
   * <code>path</code> must be a fully-qualified URL when <code>raw</code> is
   * <code>true</code>.
   */
  raw?: boolean
}

/**
 * Perform a server-side request to the Verida REST API on behalf of the given
 * user. The caller <strong>must</strong> supply an absolute path beginning
 * with <code>/</code>; e.g. <code>/ds/query/<base64Schema></code>.
 *
 * @param userId   Internal platform user ID.
 * @param path     API path starting with <code>/</code>.
 * @param init     Standard <code>fetch()</code> options.
 * @param options  Set <code>{ raw:true }</code> to bypass URL prefixing.
 */
export async function veridaFetch<
  userId: number,
  path: string,
  init: RequestInit = {},
  { raw = false }: VeridaFetchOptions = {},
): Promise<T> {
  const tokenRow = await getVeridaToken(userId)
  if (!tokenRow) throw new Error('User has not connected a Verida account.')

  const url = raw ? path : `${BASE_URL}${path}`

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
 * Server-side Universal Search that injects the user’s Bearer token retrieved
 * from the database.
 *
 * @param keywords Search query string.
 * @param userId   Authenticated user performing the search.
 */
export async function searchUniversal(
  keywords: string,
  userId: number,
): Promise<Record<string, any>> {
  const qs = new URLSearchParams({ keywords }).toString()
  return veridaFetch(userId, `/search/universal?${qs}`)
}
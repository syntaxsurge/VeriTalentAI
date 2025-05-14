import { VERIDA_API_URL } from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                    S H A R E D   V E R I D A   C O N S T A N T S           */
/* -------------------------------------------------------------------------- */

/** Trim any trailing slash so endpoints can be safely concatenated. */
export const VERIDA_BASE_URL: string = VERIDA_API_URL.endsWith('/')
  ? VERIDA_API_URL.slice(0, -1)
  : VERIDA_API_URL

/**
 * Construct the final Verida REST URL for a given endpoint.
 *
 * @param endpoint Path beginning with <code>/</code> or a full URL when <code>raw</code> is <code>true</code>.
 * @param raw      Skip base-URL prefixing when <code>true</code>.
 */
export function buildVeridaUrl(endpoint: string, raw = false): string {
  return raw ? endpoint : `${VERIDA_BASE_URL}${endpoint}`
}
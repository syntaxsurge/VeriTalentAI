import {
  VERIDA_API_URL,
  VERIDA_API_VERSION,
  VERIDA_DEFAULT_SCOPES,
  VERIDA_APP_REDIRECT_URL,
} from '@/lib/config'

/**
 * Construct the Verida Vault authentication URL exactly as documented.
 *
 * @param scopes  Array of scope strings to request (defaults to VERIDA_DEFAULT_SCOPES).
 * @returns Fully-qualified auth URL for the "Connect Verida" button.
 */
export function buildAuthUrl(scopes: string[] = VERIDA_DEFAULT_SCOPES): string {
  const base = `${VERIDA_API_URL}/${VERIDA_API_VERSION}/auth/auth`
  const qs = new URLSearchParams({
    scopes: scopes.join(','),
    redirectUrl: VERIDA_APP_REDIRECT_URL,
    payer: 'app',
  }).toString()
  return `${base}?${qs}`
}

import {
  VERIDA_AUTH_URL,
  VERIDA_DEFAULT_SCOPES,
  VERIDA_APP_REDIRECT_URL,
  VERIDA_APP_DID,
} from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*               V E R I D A   P U B L I C   U T I L I T I E S                */
/* -------------------------------------------------------------------------- */

/**
 * Return the default list of scopes defined via <code>NEXT_PUBLIC_VERIDA_DEFAULT_SCOPES</code>.
 */
export function getDefaultScopes(): string[] {
  return VERIDA_DEFAULT_SCOPES
}

/**
 * Construct a Verida Vault authentication URL using the officially documented
 * pattern: <code>/auth?scopes=x&scopes=y&redirectUrl=…&appDID=…</code>.
 *
 * Repeated <code>scopes</code> parameters are required; the API no longer
 * accepts a comma-separated list nor the legacy <code>/auth/auth</code> path.
 *
 * @param scopes  Optional list of scope strings (defaults to {@link getDefaultScopes}).
 * @returns Fully-qualified URL that can be opened in a new tab or used as an <code>href</code>.
 */
export function buildAuthUrl(scopes: string[] = getDefaultScopes()): string {
  const url = new URL('/auth', VERIDA_AUTH_URL)

  /* Append each scope individually as ?scopes=… */
  scopes.forEach((scope) => url.searchParams.append('scopes', scope))

  url.searchParams.append('redirectUrl', VERIDA_APP_REDIRECT_URL)
  url.searchParams.append('appDID', VERIDA_APP_DID)

  return url.toString()
}

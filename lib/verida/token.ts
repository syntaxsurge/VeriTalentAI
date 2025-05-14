import { VERIDA_API_URL, VERIDA_API_VERSION } from '@/lib/config'
import { upsertVeridaToken } from '@/lib/db/queries/queries'

/**
 * Fetch the list of scopes granted to a Verida auth token.
 */
export async function fetchGrantedScopes(authToken: string): Promise<string[]> {
  try {
    const res = await fetch(`${VERIDA_API_URL}/${VERIDA_API_VERSION}/scopes`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.scopes)) return data.scopes
    }
  } catch (err) {
    console.error('Failed to fetch Verida scopes', err)
  }
  return []
}

/**
 * Persist the supplied Verida auth token for the user, storing
 * its granted scopes for later permission checks.
 */
export async function storeVeridaToken(userId: number, authToken: string): Promise<void> {
  const scopes = await fetchGrantedScopes(authToken)
  await upsertVeridaToken(userId, authToken, scopes)
}

/**
 * Normalise state parameter, defaulting to <code>/dashboard</code>.
 */
export function resolveState(stateParam: string | null): string {
  return stateParam && stateParam.trim().length > 0 ? stateParam : '/dashboard'
}

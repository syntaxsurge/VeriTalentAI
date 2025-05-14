import { NextRequest, NextResponse } from 'next/server'

import { VERIDA_API_URL } from '@/lib/config'
import { getUser, upsertVeridaToken } from '@/lib/db/queries/queries'

/**
 * Resolve the desired post-connect redirect location.
 * Falls back to <code>/dashboard</code> when <code>state</code> is null, undefined, or an empty string.
 */
function resolveState(stateParam: string | null): string {
  return stateParam && stateParam.trim().length > 0 ? stateParam : '/dashboard'
}

/**
 * Final Verida Vault redirect target.
 *
 * Reads the temporary <code>verida_tmp_token</code> cookie set by middleware, retrieves
 * the granted scopes from the Verida REST <code>/scopes</code> endpoint, persists the
 * token for the authenticated user and then redirects to the original <code>state</code>
 * location (or <code>/dashboard</code> when absent or blank).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const state = resolveState(url.searchParams.get('state'))

  /* Extract the auth token stashed by middleware */
  const tmpCookie = request.cookies.get('verida_tmp_token')
  const authToken = tmpCookie?.value

  /* Missing token – noop redirect */
  if (!authToken) {
    return NextResponse.redirect(new URL(state, request.url))
  }

  /* Require an authenticated platform user */
  const user = await getUser()
  if (!user) {
    const res = NextResponse.redirect(new URL('/sign-in', request.url))
    res.cookies.delete('verida_tmp_token')
    return res
  }

  /* ------------------------------------------------------------------ */
  /*                 Retrieve granted scopes for the token              */
  /* ------------------------------------------------------------------ */
  let scopes: string[] = []
  try {
    const res = await fetch(`${VERIDA_API_URL}/scopes`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.scopes)) scopes = data.scopes
    }
  } catch (err) {
    console.error('Failed to fetch Verida scopes', err)
  }

  /* ------------------------------------------------------------------ */
  /*                           Persist token                            */
  /* ------------------------------------------------------------------ */
  await upsertVeridaToken(user.id, authToken, scopes)

  /* Clear the temporary cookie and redirect */
  const response = NextResponse.redirect(new URL(state, request.url))
  response.cookies.delete('verida_tmp_token')
  return response
}
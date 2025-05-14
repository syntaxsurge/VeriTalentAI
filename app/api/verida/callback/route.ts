import { NextRequest, NextResponse } from 'next/server'

import { getUser } from '@/lib/db/queries/queries'
import { storeVeridaToken, resolveState } from '@/lib/verida/token'

/**
 * Final Verida Vault redirect target.
 *
 * Reads the temporary <code>verida_tmp_token</code> cookie set by middleware, persists
 * the token for the authenticated user, and then redirects to the original
 * <code>state</code> location (or <code>/dashboard</code> when absent or blank).
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

  /* Persist token and granted scopes */
  await storeVeridaToken(user.id, authToken)

  /* Clear the temporary cookie and redirect */
  const response = NextResponse.redirect(new URL(state, request.url))
  response.cookies.delete('verida_tmp_token')
  return response
}

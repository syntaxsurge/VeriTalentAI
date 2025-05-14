import { NextRequest, NextResponse } from 'next/server'

import { getUser } from '@/lib/db/queries/queries'
import { storeVeridaToken, resolveState } from '@/lib/verida/token'

/**
 * Final Verida Vault redirect target.
 *
 * Accepts the `auth_token` via either the temporary `verida_tmp_token` cookie
 * (set by middleware) **or** directly from the query string when the cookie is
 * missing – ensuring the token is always persisted for the authenticated user.
 * After storing the token and its granted scopes, the user is redirected to the
 * original `state` location (defaulting to `/dashboard`).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const state = resolveState(url.searchParams.get('state'))

  /* Retrieve token from middleware cookie (preferred) or fallback to query */
  const tmpCookie = request.cookies.get('verida_tmp_token')
  const cookieToken = tmpCookie?.value ?? null
  const queryToken = url.searchParams.get('auth_token')
  const authToken = cookieToken ?? (queryToken && queryToken.trim().length > 0 ? queryToken : null)

  /* If no token was supplied, just redirect back to the state path */
  if (!authToken) {
    return NextResponse.redirect(new URL(state, request.url))
  }

  /* Require an authenticated platform user */
  const user = await getUser()
  if (!user) {
    const res = NextResponse.redirect(new URL('/sign-in', request.url))
    if (tmpCookie) res.cookies.delete('verida_tmp_token')
    return res
  }

  /* Persist token (and its granted scopes) for the user */
  await storeVeridaToken(user.id, authToken)

  /* Clear temporary cookie (if present) and redirect */
  const response = NextResponse.redirect(new URL(state, request.url))
  if (tmpCookie) response.cookies.delete('verida_tmp_token')
  return response
}
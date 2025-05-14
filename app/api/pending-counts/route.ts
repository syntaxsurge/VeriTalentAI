import { NextRequest, NextResponse } from 'next/server'

import { getUser } from '@/lib/db/queries/queries'
import { storeVeridaToken, resolveState } from '@/lib/verida/token'

/**
 * Handles the redirect from Verida Vault, storing the received <code>auth_token</code>
 * and its granted scopes against the authenticated user.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const authToken = url.searchParams.get('auth_token')
  const state = resolveState(url.searchParams.get('state'))

  /* Require an existing session */
  const user = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  /* Missing token – noop redirect */
  if (!authToken) {
    return NextResponse.redirect(new URL(state, request.url))
  }

  /* Persist token and scopes */
  await storeVeridaToken(user.id, authToken)

  /* Redirect back to original state or dashboard */
  return NextResponse.redirect(new URL(state, request.url))
}

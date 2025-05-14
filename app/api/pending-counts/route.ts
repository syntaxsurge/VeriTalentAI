import { NextRequest, NextResponse } from 'next/server'

import { VERIDA_API_URL, VERIDA_API_VERSION } from '@/lib/config'
import { getUser, upsertVeridaToken } from '@/lib/db/queries/queries'

/**
 * Handles the redirect from Verida Vault, storing the received `auth_token`
 * and its granted scopes against the authenticated user.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const authToken = url.searchParams.get('auth_token')
  const state = url.searchParams.get('state') ?? '/dashboard'

  /* Require an existing session */
  const user = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  /* Missing token – noop redirect */
  if (!authToken) {
    return NextResponse.redirect(new URL(state, request.url))
  }

  /* ------------------------------------------------------------------ */
  /*                 Retrieve granted scopes for the token              */
  /* ------------------------------------------------------------------ */
  let scopes: string[] = []
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
      if (Array.isArray(data.scopes)) scopes = data.scopes
    }
  } catch (err) {
    console.error('Failed to fetch Verida scopes', err)
  }

  /* ------------------------------------------------------------------ */
  /*                           Persist token                            */
  /* ------------------------------------------------------------------ */
  await upsertVeridaToken(user.id, authToken, scopes)

  /* Redirect back to original state or dashboard */
  return NextResponse.redirect(new URL(state, request.url))
}

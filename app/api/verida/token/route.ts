import { NextResponse } from 'next/server'

import { getUser, getVeridaToken } from '@/lib/db/queries/queries'

/**
 * GET /api/verida/token
 * Returns { success:true, token:string } for the authenticated user, enabling
 * client-side scripts to persist the auth_token to localStorage when missing.
 */
export async function GET(): Promise<NextResponse> {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }

  const tokenRow = await getVeridaToken(user.id)
  if (!tokenRow) {
    return NextResponse.json({ success: false, error: 'Verida not connected' }, { status: 404 })
  }

  return NextResponse.json({ success: true, token: tokenRow.authToken })
}

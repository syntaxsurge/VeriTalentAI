import { NextRequest, NextResponse } from 'next/server'

import { getVeridaToken, getVeridaConnectionProviders } from '@/lib/db/queries/queries'
import { parseUserId, jsonError } from '@/lib/utils/api'

/* -------------------------------------------------------------------------- */
/*                    V E R I D A   S T A T U S   (P U B L I C)               */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/verida/status?userId=123
 *
 * Returns `{ success, connected, providers }` for the supplied user ID based
 * solely on database state. This avoids any dependency on the caller’s Verida
 * credentials so the endpoint functions correctly from public pages.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = parseUserId(request)
  if (!userId) {
    return jsonError('Missing or invalid userId', 400)
  }

  try {
    /* -------------------------------------------------------------------- */
    /*                 Check for a stored Verida auth_token                 */
    /* -------------------------------------------------------------------- */
    const tokenRow = await getVeridaToken(userId)
    if (!tokenRow) {
      /* No token ⇒ not connected */
      return NextResponse.json({
        success: true,
        connected: false,
        providers: [],
      })
    }

    /* -------------------------------------------------------------------- */
    /*         Fetch cached provider list from verida_connections           */
    /* -------------------------------------------------------------------- */
    const providers = await getVeridaConnectionProviders(userId)

    return NextResponse.json({
      success: true,
      connected: true,
      providers,
    })
  } catch (err) {
    console.error('Verida status endpoint error:', err)
    return jsonError('Failed to fetch Verida status', 500)
  }
}

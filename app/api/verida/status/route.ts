import { NextRequest, NextResponse } from 'next/server'

import { parseUserId, jsonError } from '@/lib/utils/api'
import { fetchConnectionStatus } from '@/lib/verida/server'

/**
 * GET /api/verida/status
 * Returns { success, connected, providers } for a given userId.
 * Example: /api/verida/status?userId=123
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = parseUserId(request)
  if (!userId) {
    return jsonError('Missing or invalid userId', 400)
  }

  try {
    const { connected, providers } = await fetchConnectionStatus(userId)
    return NextResponse.json({ success: true, connected, providers })
  } catch (err) {
    console.error('Verida status endpoint error:', err)
    return jsonError('Failed to fetch Verida status', 500)
  }
}
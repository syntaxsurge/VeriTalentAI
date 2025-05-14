import { NextRequest, NextResponse } from 'next/server'

import { fetchTelegramGroups } from '@/lib/verida/datastore'
import { parseUserId, jsonError } from '@/lib/utils/api'

/**
 * GET /api/telegram/groups?userId=123
 * Returns all Telegram chat groups stored in the user’s Verida datastore.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = parseUserId(request)
  if (!userId) return jsonError('Missing or invalid userId')

  try {
    const groups = await fetchTelegramGroups<any>(userId)
    return NextResponse.json({ success: true, count: groups.length, groups })
  } catch (err: any) {
    console.error('Error fetching Telegram groups:', err)
    return jsonError(err.message ?? 'Internal error', 500)
  }
}
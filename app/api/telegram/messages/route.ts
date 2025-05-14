import { NextRequest, NextResponse } from 'next/server'

import { fetchTelegramMessages } from '@/lib/verida/datastore'
import { parseUserId, jsonError } from '@/lib/utils/api'

/**
 * GET /api/telegram/messages?userId=123
 * Returns Telegram chat messages stored in the user’s Verida datastore.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = parseUserId(request)
  if (!userId) return jsonError('Missing or invalid userId')

  try {
    const messages = await fetchTelegramMessages<any>(userId)
    return NextResponse.json({ success: true, count: messages.length, messages })
  } catch (err: any) {
    console.error('Error fetching Telegram messages:', err)
    return jsonError(err.message ?? 'Internal error', 500)
  }
}
import { NextRequest, NextResponse } from 'next/server'

import { parseUserId, jsonError } from '@/lib/utils/api'
import { veridaFetch } from '@/lib/verida/server'

/**
 * GET /api/telegram/search?userId=123&keyword=foo
 * Performs keyword search across Telegram chat threads.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = parseUserId(request)
  const keyword = (new URL(request.url).searchParams.get('keyword') || '').trim()

  if (!userId || !keyword) {
    return jsonError('Missing or invalid userId/keyword')
  }

  try {
    const data = await veridaFetch<Record<string, any>>(
      userId,
      `/search/chat-threads?keyword=${encodeURIComponent(keyword)}`,
    )

    const messages = data.items ?? data.results ?? []
    return NextResponse.json({ success: true, count: messages.length, messages })
  } catch (err: any) {
    console.error('Error searching Telegram messages:', err)
    return jsonError(err.message ?? 'Internal error', 500)
  }
}

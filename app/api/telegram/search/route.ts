import { NextRequest, NextResponse } from 'next/server'

import { veridaFetch } from '@/lib/verida/server'

/**
 * GET /api/telegram/search?userId=123&keyword=foo
 * Performs keyword search across Telegram chat threads.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const userId = Number(searchParams.get('userId'))
  const keyword = (searchParams.get('keyword') || '').trim()

  if (!userId || !keyword) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid userId/keyword' },
      { status: 400 },
    )
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

import { fetchTelegramMessages } from '@/lib/verida/datastore'

/**
 * GET /api/telegram/messages?userId=123
 * Returns Telegram chat messages stored in the user’s Verida datastore.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const userId = Number(searchParams.get('userId'))

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid userId' },
      { status: 400 },
    )
  }

  try {
    const messages = await fetchTelegramMessages<any>(userId)
    return NextResponse.json({ success: true, count: messages.length, messages })
  } catch (err: any) {
    console.error('Error fetching Telegram messages:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

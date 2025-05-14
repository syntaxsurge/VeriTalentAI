import { NextRequest, NextResponse } from 'next/server'

import { fetchTelegramGroups } from '@/lib/verida/datastore'

/**
 * GET /api/telegram/groups?userId=123
 * Returns all Telegram chat groups stored in the user’s Verida datastore.
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
    const groups = await fetchTelegramGroups<any>(userId)
    return NextResponse.json({ success: true, count: groups.length, groups })
  } catch (err: any) {
    console.error('Error fetching Telegram groups:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

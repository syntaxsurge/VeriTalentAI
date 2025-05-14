import { NextRequest, NextResponse } from 'next/server'

import { veridaFetch } from '@/lib/verida/server'

/**
 * GET /api/telegram/messages?userId=123
 * Returns Telegram chat messages stored in the user’s Verida datastore.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const userId = Number(searchParams.get('userId'))

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing or invalid userId' }, { status: 400 })
  }

  const schemaUrl =
    'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json'
  const encodedSchema = Buffer.from(schemaUrl).toString('base64')

  try {
    const data = await veridaFetch<Record<string, any>>(userId, `/ds/query/${encodedSchema}`, {
      method: 'POST',
      body: JSON.stringify({
        query: { sourceApplication: 'https://telegram.com' },
        options: { sort: [{ _id: 'desc' }], limit: 100_000 },
      }),
    })

    const messages = Array.isArray(data.items) ? data.items : []
    return NextResponse.json({ success: true, count: messages.length, messages })
  } catch (err: any) {
    console.error('Error fetching Telegram messages:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
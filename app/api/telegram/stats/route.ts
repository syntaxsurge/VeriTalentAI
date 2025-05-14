import { NextRequest, NextResponse } from 'next/server'

import { veridaFetch } from '@/lib/verida/server'

const GROUP_SCHEMA = 'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json'
const MESSAGE_SCHEMA = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json'

function b64(url: string) {
  return Buffer.from(url).toString('base64')
}

async function getDatastoreCount(userId: number, schemaUrl: string) {
  const data = await veridaFetch<Record<string, any>>(userId, `/ds/count/${b64(schemaUrl)}`, {
    method: 'POST',
    body: JSON.stringify({ query: { sourceApplication: 'https://telegram.com' } }),
  })
  return typeof data.count === 'number' ? data.count : 0
}

/**
 * GET /api/telegram/stats?userId=123
 * Returns group/message counts and keyword frequencies.
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
    const [groupCount, messageSample] = await Promise.all([
      getDatastoreCount(userId, GROUP_SCHEMA),
      veridaFetch<Record<string, any>>(userId, `/ds/query/${b64(MESSAGE_SCHEMA)}`, {
        method: 'POST',
        body: JSON.stringify({
          query: { sourceApplication: 'https://telegram.com' },
          options: { sort: [{ _id: 'desc' }], limit: 200 },
        }),
      }),
    ])

    const messages = Array.isArray(messageSample.items) ? messageSample.items : []

    const keywords = ['cluster', 'protocol', 'ai', 'defi', 'crypto', 'web3'] as const
    const keywordCounts: Record<string, number> = {}
    keywords.forEach((kw) => {
      keywordCounts[kw] = messages.filter((m) =>
        String(m.messageText || m.message || '')
          .toLowerCase()
          .includes(kw),
      ).length
    })

    const messageCount = await getDatastoreCount(userId, MESSAGE_SCHEMA)

    return NextResponse.json({
      success: true,
      stats: {
        groups: { count: groupCount },
        messages: { count: messageCount, keywordCounts },
      },
    })
  } catch (err: any) {
    console.error('Error fetching Telegram stats:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

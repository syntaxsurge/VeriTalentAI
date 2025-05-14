import { NextRequest, NextResponse } from 'next/server'

import {
  TELEGRAM_GROUP_SCHEMA,
  TELEGRAM_MESSAGE_SCHEMA,
  countDatastore,
  queryDatastore,
} from '@/lib/verida/datastore'
import { parseUserId, jsonError } from '@/lib/utils/api'

const KEYWORDS = ['cluster', 'protocol', 'ai', 'defi', 'crypto', 'web3'] as const

/**
 * GET /api/telegram/stats?userId=123
 * Returns group/message counts and keyword frequencies.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = parseUserId(request)
  if (!userId) return jsonError('Missing or invalid userId')

  try {
    const [groupCount, sampleMessages] = await Promise.all([
      countDatastore(userId, TELEGRAM_GROUP_SCHEMA, {
        sourceApplication: 'https://telegram.com',
      }),
      queryDatastore<any>(
        userId,
        TELEGRAM_MESSAGE_SCHEMA,
        { sourceApplication: 'https://telegram.com' },
        { sort: [{ _id: 'desc' }], limit: 200 },
      ),
    ])

    const keywordCounts: Record<string, number> = {}
    KEYWORDS.forEach((kw) => {
      keywordCounts[kw] = sampleMessages.filter((m) =>
        String(
          (m.messageText ?? m.message ?? m.text ?? m.body ?? m.content ?? '').toLowerCase(),
        ).includes(kw),
      ).length
    })

    const messageCount = await countDatastore(userId, TELEGRAM_MESSAGE_SCHEMA, {
      sourceApplication: 'https://telegram.com',
    })

    return NextResponse.json({
      success: true,
      stats: {
        groups: { count: groupCount },
        messages: { count: messageCount, keywordCounts },
      },
    })
  } catch (err: any) {
    console.error('Error fetching Telegram stats:', err)
    return jsonError(err.message ?? 'Internal error', 500)
  }
}
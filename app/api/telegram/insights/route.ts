import { NextRequest, NextResponse } from 'next/server'

import { generateTelegramInsights } from '@/lib/ai/openai'
import { parseUserId, jsonError } from '@/lib/utils/api'

/**
 * GET /api/telegram/insights?userId=123
 * Runs Verida LLM agent over the user’s Telegram messages and returns JSON insights.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = parseUserId(request)
  if (!userId) return jsonError('Missing or invalid userId')

  try {
    const insights = await generateTelegramInsights(userId)
    return NextResponse.json({ success: true, insights })
  } catch (err: any) {
    console.error('Error generating Telegram insights:', err)
    return jsonError(err?.message ?? 'Internal error', 500)
  }
}

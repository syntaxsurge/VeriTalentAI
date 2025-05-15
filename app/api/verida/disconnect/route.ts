import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { veridaTokens } from '@/lib/db/schema/verida'

/**
 * POST /api/verida/disconnect
 * Deletes the stored Verida auth_token for the authenticated user.
 * Responds with `{ success:true }` on completion.
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }

  await db.delete(veridaTokens).where(eq(veridaTokens.userId, user.id))

  return NextResponse.json({ success: true })
}

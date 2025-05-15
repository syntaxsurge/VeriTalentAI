import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth/guards'
import { getTeamForUser, countTeamMembersWithoutVerida } from '@/lib/db/queries/queries'

/**
 * GET /api/verida/missing-count[?teamId=123]
 * Returns { success:true, veridaMissing:number } where the number equals how
 * many members of the given (or current) team have not connected Verida.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await requireAuth()
  const url = new URL(request.url)
  const teamIdParam = url.searchParams.get('teamId')
  let teamId: number | undefined = teamIdParam ? Number(teamIdParam) : undefined

  if (!teamId || Number.isNaN(teamId)) {
    const team = await getTeamForUser(user.id)
    teamId = team?.id
  }

  if (!teamId) {
    return NextResponse.json({ success: true, veridaMissing: 0 })
  }

  const veridaMissing = await countTeamMembersWithoutVerida(teamId)
  return NextResponse.json({ success: true, veridaMissing })
}

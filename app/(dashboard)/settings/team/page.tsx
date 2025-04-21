import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { getUser, getTeamForUser } from '@/lib/db/queries/queries'
import { db } from '@/lib/db/drizzle'
import { teams } from '@/lib/db/schema/core'

import { Settings } from './settings'

export const revalidate = 0

/**
 * Team Settings page — automatically falls back to the user’s personal
 * team (creatorUserId === user.id) if they are not currently a member of
 * any other team.
 */
export default async function TeamSettingsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  let teamData = await getTeamForUser(user.id)

  /* Fallback: personal team created at sign-up */
  if (!teamData) {
    const [personalTeam] = await db.select().from(teams).where(eq(teams.creatorUserId, user.id)).limit(1)
    if (personalTeam) {
      teamData = {
        ...personalTeam,
        teamMembers: [],
      } as any
    }
  }

  if (!teamData) {
    throw new Error('Team not found')
  }

  return <Settings teamData={teamData} />
}
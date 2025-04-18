'use server'

import { and, eq } from 'drizzle-orm'

import { createCheqdDID } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { getUser, getUserWithTeam } from '@/lib/db/queries'
import { teams, teamMembers } from '@/lib/db/schema'

export async function createDidAction() {
  const user = await getUser()
  if (!user) return { error: 'User not logged in.' }

  const userWithTeam = await getUserWithTeam(user.id)
  if (!userWithTeam?.teamId) {
    return { error: "You don't belong to a team." }
  }

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, userWithTeam.teamId)))
    .limit(1)

  if (membership?.role !== 'owner') {
    return { error: 'Only team owners can create a DID.' }
  }

  const [team] = await db.select().from(teams).where(eq(teams.id, userWithTeam.teamId))

  if (team?.did) {
    return { error: 'Team already has a DID.' }
  }

  try {
    const { did } = await createCheqdDID()
    await db.update(teams).set({ did }).where(eq(teams.id, team.id))
    return { did }
  } catch (err: any) {
    return { error: `Error creating DID: ${String(err)}` }
  }
}

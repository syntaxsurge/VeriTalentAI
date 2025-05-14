'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { createCheqdDID } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { getUserWithTeam } from '@/lib/db/queries/queries'
import { teams, teamMembers } from '@/lib/db/schema'

/**
 * Generate a new did:cheqd for the caller’s team using cheqd Studio.
 * Only team owners can perform this action and only when no DID exists yet.
 */
export const createDidAction = validatedActionWithUser(
  z.object({}), // no client input required
  async (_validated, _formData, user) => {
    /* --------------------------- Resolve team --------------------------- */
    const userWithTeam = await getUserWithTeam(user.id)
    if (!userWithTeam?.teamId) {
      return { error: "You don't belong to a team." }
    }

    /* Confirm the caller is an owner on that team */
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, userWithTeam.teamId)))
      .limit(1)

    if (membership?.role !== 'owner') {
      return { error: 'Only team owners can create a DID.' }
    }

    /* Existing DID? ------------------------------------------------------ */
    const [team] = await db
      .select({ id: teams.id, did: teams.did })
      .from(teams)
      .where(eq(teams.id, userWithTeam.teamId))
      .limit(1)

    if (!team) return { error: 'Team not found.' }
    if (team.did) return { error: 'Your team already has a DID.' }

    /* ------------------- Call cheqd Studio DID API ---------------------- */
    try {
      const { did } = await createCheqdDID('testnet')

      await db.update(teams).set({ did }).where(eq(teams.id, team.id))
      return { success: 'Team DID created successfully.', did }
    } catch (err: any) {
      return { error: err?.message || 'Failed to create DID.' }
    }
  },
)

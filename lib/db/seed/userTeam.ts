import { and, eq } from 'drizzle-orm'

import { hashPassword } from '@/lib/auth/session'
import { db } from '../drizzle'
import { users, teams, teamMembers } from '../schema'

/**
 * Seed four demo users — admin, candidate, issuer and recruiter —
 * then for each user:
 *   • create a personal team they own,
 *   • ensure they are added to the shared “Test Team” where the admin is owner.
 *
 * All seeded accounts share the plaintext password: `myPassword`.
 */
export async function seedUserTeam() {
  console.log('Seeding users and teams…')

  /* ------------------------------------------------------------------ */
  /* Common password hash                                               */
  /* ------------------------------------------------------------------ */
  const passwordHash = await hashPassword('myPassword')

  /* ------------------------------------------------------------------ */
  /* Create or fetch users                                              */
  /* ------------------------------------------------------------------ */
  const SEED_USERS = [
    { email: 'admin@test.com', role: 'admin' as const },
    { email: 'candidate@test.com', role: 'candidate' as const },
    { email: 'issuer@test.com', role: 'issuer' as const },
    { email: 'recruiter@test.com', role: 'recruiter' as const },
  ]

  const userMap = new Map<string, number>() // email → id

  for (const entry of SEED_USERS) {
    let [user] = await db.select().from(users).where(eq(users.email, entry.email)).limit(1)

    if (!user) {
      ;[user] = await db
        .insert(users)
        .values({ email: entry.email, passwordHash, role: entry.role })
        .returning()
      console.log(`✅ Created user: ${entry.email} (${entry.role})`)
    } else {
      console.log(`ℹ️ User ${entry.email} already exists.`)
    }

    userMap.set(entry.email, user.id)

    /* -------------------------------------------------------------- */
    /* Personal team (owner)                                          */
    /* -------------------------------------------------------------- */
    const personalTeamName = `${entry.email}'s Team`
    let [personalTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, personalTeamName))
      .limit(1)

    if (!personalTeam) {
      ;[personalTeam] = await db
        .insert(teams)
        .values({ name: personalTeamName, creatorUserId: user.id })
        .returning()
      console.log(`✅ Created personal team for ${entry.email}`)
    }

    const personalMembership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, personalTeam.id), eq(teamMembers.userId, user.id)))
      .limit(1)

    if (personalMembership.length === 0) {
      await db
        .insert(teamMembers)
        .values({ teamId: personalTeam.id, userId: user.id, role: 'owner' })
      console.log(`✅ Added ${entry.email} as owner of personal team`)
    }
  }

  /* ------------------------------------------------------------------ */
  /* Shared “Test Team” with admin owner                                */
  /* ------------------------------------------------------------------ */
  const adminId = userMap.get('admin@test.com')!
  const sharedName = 'Test Team'

  let [shared] = await db.select().from(teams).where(eq(teams.name, sharedName)).limit(1)

  if (!shared) {
    ;[shared] = await db
      .insert(teams)
      .values({ name: sharedName, creatorUserId: adminId })
      .returning()
    console.log(`✅ Created shared team: ${sharedName}`)
  } else if (shared.creatorUserId === null) {
    await db.update(teams).set({ creatorUserId: adminId }).where(eq(teams.id, shared.id))
    console.log(`✅ Patched shared team with creator_user_id ${adminId}`)
  }

  /* ------------------------------------------------------------------ */
  /* Add all users to shared team (admin owner, others members)         */
  /* ------------------------------------------------------------------ */
  for (const entry of SEED_USERS) {
    const userId = userMap.get(entry.email)!
    const isAdmin = entry.email === 'admin@test.com'
    const role = isAdmin ? 'owner' : 'member'

    const membership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, shared.id), eq(teamMembers.userId, userId)))
      .limit(1)

    if (membership.length === 0) {
      await db.insert(teamMembers).values({ teamId: shared.id, userId, role })
      console.log(`✅ Added ${entry.email} to "${sharedName}" as ${role}.`)
    }
  }

  console.log('🎉 Seed completed.')
}
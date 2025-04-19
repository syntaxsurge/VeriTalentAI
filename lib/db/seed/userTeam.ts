import { eq, and } from 'drizzle-orm'

import { hashPassword } from '@/lib/auth/session'

import { db } from '../drizzle'
import { users, teams, teamMembers } from '../schema'

/**
 * Seed initial users (admin, candidate, issuer, recruiter) and a shared demo team.
 *
 * All accounts use the same plaintext password for convenience: `myPassword`.
 */
export async function seedUserTeam() {
  console.log('Seeding users and team…')

  /* ------------------------------------------------------------------ */
  /* Shared demo password ‑ hashed once                                  */
  /* ------------------------------------------------------------------ */
  const password = 'myPassword'
  const passwordHash = await hashPassword(password)

  /* ------------------------------------------------------------------ */
  /* Ensure demo team exists                                            */
  /* ------------------------------------------------------------------ */
  const teamName = 'Test Team'
  let [team] = await db.select().from(teams).where(eq(teams.name, teamName)).limit(1)

  if (!team) {
    ;[team] = await db.insert(teams).values({ name: teamName }).returning()
    console.log(`✅ Created team: ${teamName}`)
  } else {
    console.log(`ℹ️ Team "${teamName}" already exists.`)
  }

  /* ------------------------------------------------------------------ */
  /* Users to seed                                                      */
  /* ------------------------------------------------------------------ */
  const defaultUsers = [
    { email: 'admin@test.com', role: 'admin' as const, teamRole: 'owner' },
    { email: 'candidate@test.com', role: 'candidate' as const, teamRole: 'member' },
    { email: 'issuer@test.com', role: 'issuer' as const, teamRole: 'member' },
    { email: 'recruiter@test.com', role: 'recruiter' as const, teamRole: 'member' },
  ]

  /* ------------------------------------------------------------------ */
  /* Create / fetch users + add to team                                 */
  /* ------------------------------------------------------------------ */
  for (const entry of defaultUsers) {
    /* Upsert user */
    let [user] = await db.select().from(users).where(eq(users.email, entry.email)).limit(1)

    if (!user) {
      ;[user] = await db
        .insert(users)
        .values({
          email: entry.email,
          passwordHash,
          role: entry.role,
        })
        .returning()
      console.log(`✅ Created user: ${entry.email} (${entry.role})`)
    } else {
      console.log(`ℹ️ User ${entry.email} already exists.`)
    }

    /* Ensure membership */
    const membership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)))
      .limit(1)

    if (membership.length === 0) {
      await db
        .insert(teamMembers)
        .values({ teamId: team.id, userId: user.id, role: entry.teamRole })
      console.log(`✅ Added ${entry.email} to "${teamName}" as ${entry.teamRole}.`)
    } else {
      console.log(`ℹ️ ${entry.email} is already a member of "${teamName}".`)
    }
  }

  console.log('🎉 Seed completed.')
}
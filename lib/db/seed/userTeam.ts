import { and, eq } from 'drizzle-orm'

import { hashPassword } from '@/lib/auth/session'

import { db } from '../drizzle'
import { users, teams, teamMembers } from '../schema'

/**
 * Seed initial users (admin, candidate, issuer, recruiter) and a shared demo team.
 *
 * • The first admin user is created up‑front so we always have a valid
 *   creator_user_id when inserting the demo team.
 * • If an existing team is missing creator_user_id (from a previous run),
 *   we patch it to point at the admin user.
 *
 * All seeded accounts share the plaintext password: `myPassword`.
 */
export async function seedUserTeam() {
  console.log('Seeding users and team…')

  /* ------------------------------------------------------------------ */
  /* Shared demo password – hashed once                                 */
  /* ------------------------------------------------------------------ */
  const password = 'myPassword'
  const passwordHash = await hashPassword(password)

  /* ------------------------------------------------------------------ */
  /* Ensure the admin account exists                                    */
  /* ------------------------------------------------------------------ */
  let [adminUser] = await db.select().from(users).where(eq(users.email, 'admin@test.com')).limit(1)

  if (!adminUser) {
    ;[adminUser] = await db
      .insert(users)
      .values({ email: 'admin@test.com', passwordHash, role: 'admin' })
      .returning()
    console.log(`✅ Created user: ${adminUser.email} (admin)`)
  } else {
    console.log('ℹ️ Admin user already exists.')
  }

  /* ------------------------------------------------------------------ */
  /* Ensure the demo team exists with a creator                         */
  /* ------------------------------------------------------------------ */
  const teamName = 'Test Team'
  let [team] = await db.select().from(teams).where(eq(teams.name, teamName)).limit(1)

  if (!team) {
    ;[team] = await db
      .insert(teams)
      .values({ name: teamName, creatorUserId: adminUser.id })
      .returning()
    console.log(`✅ Created team: ${teamName}`)
  } else {
    if (team.creatorUserId === null) {
      await db.update(teams).set({ creatorUserId: adminUser.id }).where(eq(teams.id, team.id))
      console.log(`✅ Patched team "${teamName}" with creator_user_id ${adminUser.id}`)
    } else {
      console.log(`ℹ️ Team "${teamName}" already exists.`)
    }
  }

  /* ------------------------------------------------------------------ */
  /* Seed the remaining default users                                   */
  /* ------------------------------------------------------------------ */
  const defaultUsers = [
    { email: 'admin@test.com', role: 'admin' as const, teamRole: 'owner' },
    { email: 'candidate@test.com', role: 'candidate' as const, teamRole: 'member' },
    { email: 'issuer@test.com', role: 'issuer' as const, teamRole: 'member' },
    { email: 'recruiter@test.com', role: 'recruiter' as const, teamRole: 'member' },
  ]

  for (const entry of defaultUsers) {
    /* Upsert user */
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
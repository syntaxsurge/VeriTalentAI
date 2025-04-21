import { and, eq } from 'drizzle-orm'

import { hashPassword } from '@/lib/auth/session'
import { db } from '../drizzle'
import { users, teams, teamMembers } from '../schema'

/**
 * Seed four demo users then:
 *   • create a personal placeholder team for each (no memberships),
 *   • add every user to the shared "Test Team”, with admin as owner.
 *
 * All accounts use the plaintext password: `myPassword`.
 */
export async function seedUserTeam() {
  console.log('Seeding users and teams…')

  /* ---------- common demo password ---------- */
  const passwordHash = await hashPassword('myPassword')

  /* ---------- users to seed ---------- */
  const SEED = [
    { email: 'admin@test.com', role: 'admin' as const },
    { email: 'candidate@test.com', role: 'candidate' as const },
    { email: 'issuer@test.com', role: 'issuer' as const },
    { email: 'recruiter@test.com', role: 'recruiter' as const },
  ]

  const ids = new Map<string, number>() // email → id

  /* ---------- ensure users + placeholder teams (no membership) ---------- */
  for (const { email, role } of SEED) {
    const name = email.split('@')[0] // derive simple display name (e.g. "admin")
    let [u] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!u) {
      ;[u] = await db
        .insert(users)
        .values({ name, email, passwordHash, role })
        .returning()
      console.log(`✅ Created user ${email} (${name})`)
    } else {
      if (!u.name) {
        await db.update(users).set({ name }).where(eq(users.id, u.id))
        console.log(`🔄 Added missing name for ${email} → ${name}`)
      } else {
        console.log(`ℹ️ User ${email} exists`)
      }
    }
    ids.set(email, u.id)

    const personalName = `${email}'s Team`
    const [existingTeam] = await db.select().from(teams).where(eq(teams.name, personalName)).limit(1)

    if (!existingTeam) {
      await db.insert(teams).values({ name: personalName, creatorUserId: u.id })
      console.log(`✅ Created placeholder team "${personalName}"`)
    } else {
      console.log(`ℹ️ Placeholder team for ${email} exists`)
    }
  }

  /* ---------- shared Test Team ---------- */
  const adminId = ids.get('admin@test.com')!
  const sharedName = 'Test Team'

  let [shared] = await db.select().from(teams).where(eq(teams.name, sharedName)).limit(1)
  if (!shared) {
    ;[shared] = await db
      .insert(teams)
      .values({ name: sharedName, creatorUserId: adminId })
      .returning()
    console.log(`✅ Created shared team "${sharedName}"`)
  } else {
    console.log(`ℹ️ Shared team "${sharedName}" exists`)
  }

  /* ---------- add memberships (single team per user) ---------- */
  for (const { email } of SEED) {
    const userId = ids.get(email)!
    const role = email === 'admin@test.com' ? 'owner' : 'member'

    const existing = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, shared.id), eq(teamMembers.userId, userId)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(teamMembers).values({ teamId: shared.id, userId, role })
      console.log(`✅ Added ${email} to "${sharedName}" as ${role}`)
    }
  }

  console.log('🎉 Seed completed.')
}
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

  /* ---------- users to seed (explicit names + emails) ---------- */
  const SEED = [
    { name: 'Alice Admin', email: 'alice.admin@example.com', role: 'admin' as const },
    { name: 'Carlos Candidate', email: 'carlos.candidate@example.com', role: 'candidate' as const },
    { name: 'Ivy Issuer', email: 'ivy.issuer@example.com', role: 'issuer' as const },
    { name: 'Rafael Recruiter', email: 'rafael.recruiter@example.com', role: 'recruiter' as const },
  ]

  const ids = new Map<string, number>() // email → id

  /* ---------- ensure users + placeholder teams (no membership) ---------- */
  for (const { name, email, role } of SEED) {
    let [u] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!u) {
      ;[u] = await db
        .insert(users)
        .values({ name, email, passwordHash, role })
        .returning()
      console.log(`✅ Created user ${email} (${name})`)
    } else {
      const updates: Partial<typeof users.$inferInsert> = {}
      if (u.name !== name) updates.name = name
      if (u.role !== role) updates.role = role
      if (Object.keys(updates).length) {
        await db.update(users).set(updates).where(eq(users.id, u.id))
        console.log(`🔄 Updated user ${email} →`, updates)
      } else {
        console.log(`ℹ️ User ${email} exists`)
      }
    }
    ids.set(email, u.id)

    const personalName = `${name}'s Team`
    const [existingTeam] = await db.select().from(teams).where(eq(teams.name, personalName)).limit(1)

    if (!existingTeam) {
      await db.insert(teams).values({ name: personalName, creatorUserId: u.id })
      console.log(`✅ Created placeholder team "${personalName}"`)
    } else {
      console.log(`ℹ️ Placeholder team for ${email} exists`)
    }
  }

  /* ---------- shared Test Team ---------- */
  const adminId = ids.get('alice.admin@example.com')!
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
    const role = email === 'alice.admin@example.com' ? 'owner' : 'member'

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
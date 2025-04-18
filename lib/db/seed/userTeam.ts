import { eq, and } from 'drizzle-orm'

import { hashPassword } from '@/lib/auth/session'

import { db } from '../drizzle'
import { users, teams, teamMembers } from '../schema'

export async function seedUserTeam() {
  console.log('Seeding initial user and team...')

  const email = 'test@test.com'
  const password = 'admin123'
  const passwordHash = await hashPassword(password)

  // Create or fetch user
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
  let user
  if (existingUser.length > 0) {
    user = existingUser[0]
    console.log(`User with email ${email} already exists. Skipping user creation.`)
  } else {
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: 'admin',
      })
      .returning()
    user = newUser
    console.log('Initial user created:', newUser.email)
  }

  // Create or fetch team
  const teamName = 'Test Team'
  const existingTeam = await db.select().from(teams).where(eq(teams.name, teamName)).limit(1)
  let team
  if (existingTeam.length > 0) {
    team = existingTeam[0]
    console.log(`Team "${teamName}" already exists. Skipping team creation.`)
  } else {
    const [newTeam] = await db.insert(teams).values({ name: teamName }).returning()
    team = newTeam
    console.log('Initial team created:', newTeam.name)
  }

  // Create membership if it doesn't exist
  const member = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)))
    .limit(1)

  if (member.length === 0) {
    await db
      .insert(teamMembers)
      .values({
        teamId: team.id,
        userId: user.id,
        role: 'owner',
      })
      .returning()
    console.log('User added to the team with owner role.')
  } else {
    console.log('User is already a member of the team. Skipping membership creation.')
  }
}

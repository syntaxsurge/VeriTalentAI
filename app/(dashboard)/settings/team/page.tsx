import { redirect } from 'next/navigation'

import { getUser, getTeamForUser } from '@/lib/db/queries'

import { Settings } from './settings'

export const revalidate = 0

/**
 * Team Settings page (moved from the old /dashboard route).
 */
export default async function TeamSettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const teamData = await getTeamForUser(user.id)

  if (!teamData) {
    throw new Error('Team not found')
  }

  return <Settings teamData={teamData} />
}

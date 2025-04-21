'use client'

import { useEffect, useState } from 'react'
import { TeamDataWithMembers, User } from '@/lib/db/schema'
import { useUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MembersTable, { RowType } from '@/components/dashboard/team/members-table'
import { InviteTeamMember } from './invite-team'
import { Button } from '@/components/ui/button'
import { customerPortalAction } from '@/lib/payments/actions'

/**
 * Returns the user's name (or "—” when absent) without ever
 * falling back to their email address.
 */
function displayName(u: Pick<User, 'name' | 'email'>) {
  const name = u.name?.trim()
  return name && name.length > 0 ? name : '—'
}

export function Settings({ teamData }: { teamData: TeamDataWithMembers }) {
  const { userPromise } = useUser()
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    let mounted = true
    userPromise.then((u) => mounted && setUser(u as User | null))
    return () => {
      mounted = false
    }
  }, [userPromise])

  if (user === undefined) return null

  const isOwner = !!teamData.teamMembers.find(
    (m) => m.role === 'owner' && m.user.id === user?.id,
  )

  const rows: RowType[] = teamData.teamMembers.map((m) => ({
    id: m.id,
    name: displayName(m.user),
    email: m.user.email,
    role: m.role,
    joinedAt: m.joinedAt,
  }))

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>Team Settings</h1>

      {/* Subscription */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Team Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col justify-between gap-6 sm:flex-row'>
            <div>
              <p className='font-medium'>Current Plan: {teamData.planName || 'Free'}</p>
              <p className='text-muted-foreground text-sm'>
                {teamData.subscriptionStatus === 'active'
                  ? 'Billed monthly'
                  : teamData.subscriptionStatus === 'trialing'
                  ? 'Trial period'
                  : 'No active subscription'}
              </p>
            </div>
            <form action={customerPortalAction}>
              <Button type='submit' variant='outline'>
                Manage Subscription
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* DID */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Team DID</CardTitle>
        </CardHeader>
        <CardContent>
          {teamData.did ? (
            <>
              <p className='text-sm'>cheqd DID:</p>
              <p className='break-all font-semibold'>{teamData.did}</p>
            </>
          ) : (
            <p className='text-muted-foreground text-sm'>
              No DID yet. Create one in the Viskify AI dashboard.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <MembersTable rows={rows} isOwner={isOwner} />
        </CardContent>
      </Card>

      {/* Invite */}
      <InviteTeamMember isOwner={isOwner} />
    </section>
  )
}
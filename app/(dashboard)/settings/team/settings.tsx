'use client'

import { useEffect, useState, useActionState } from 'react'

import { removeTeamMember } from '@/app/(auth)/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/lib/auth'
import { TeamDataWithMembers, User } from '@/lib/db/schema'
import { customerPortalAction } from '@/lib/payments/actions'

import { InviteTeamMember } from './invite-team'

type ActionState = { error?: string; success?: string }

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

  const isOwner =
    !!teamData.teamMembers.find((m) => m.role === 'owner' && m.user.id === user?.id)

  const [removeState, removeAction, removing] = useActionState<ActionState, FormData>(
    removeTeamMember,
    { error: '', success: '' },
  )

  const displayName = (u: Pick<User, 'name' | 'email'>) => u.name || u.email || 'Unknown'

  if (user === undefined) return null

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
        <CardContent>
          <ul className='space-y-4'>
            {teamData.teamMembers.map((m, i) => (
              <li key={m.id} className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <Avatar>
                    <AvatarFallback>
                      {displayName(m.user)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{displayName(m.user)}</p>
                    <p className='text-muted-foreground text-sm capitalize'>{m.role}</p>
                  </div>
                </div>

                {i > 1 && isOwner && (
                  <form action={removeAction}>
                    <input type='hidden' name='memberId' value={m.id} />
                    <Button type='submit' size='sm' variant='outline' disabled={removing}>
                      {removing ? 'Removing…' : 'Remove'}
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          {removeState.error && (
            <p className='text-destructive-foreground mt-4 text-sm'>{removeState.error}</p>
          )}
          {removeState.success && (
            <p className='text-emerald-600 mt-4 text-sm'>{removeState.success}</p>
          )}
        </CardContent>
      </Card>

      <InviteTeamMember isOwner={isOwner} />
    </section>
  )
}
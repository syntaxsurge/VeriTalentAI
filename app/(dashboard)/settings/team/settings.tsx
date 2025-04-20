'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { removeTeamMember } from '@/app/(auth)/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/lib/auth'
import { TeamDataWithMembers, User } from '@/lib/db/schema'
import { customerPortalAction } from '@/lib/payments/actions'

import { InviteTeamMember } from './invite-team'

/* -------------------------------------------------------------------------- */
/*                               H E L P E R S                                */
/* -------------------------------------------------------------------------- */

function displayName(u: Pick<User, 'name' | 'email'>) {
  return u.name || u.email || 'Unknown'
}

/* -------------------------------------------------------------------------- */
/*                           M E M B E R   R O W                              */
/* -------------------------------------------------------------------------- */

type MemberRowProps = {
  member: TeamDataWithMembers['teamMembers'][number]
  canRemove: boolean
}

function MemberRow({ member, canRemove }: MemberRowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('memberId', member.id.toString())
      const res = await removeTeamMember({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Member removed.')
        router.refresh()
      }
    })
  }

  return (
    <li className='flex items-center justify-between'>
      <div className='flex items-center space-x-4'>
        <Avatar>
          {member.user.imageUrl ? (
            <AvatarImage src={member.user.imageUrl} alt={displayName(member.user)} />
          ) : (
            <AvatarFallback>
              {displayName(member.user)
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className='font-medium'>{displayName(member.user)}</p>
          <p className='text-muted-foreground text-sm capitalize'>{member.role}</p>
        </div>
      </div>

      {canRemove && (
        <Button
          size='sm'
          variant='outline'
          disabled={isPending}
          onClick={handleRemove}
          className='whitespace-nowrap'
        >
          {isPending ? 'Removing…' : 'Remove'}
        </Button>
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*                                S E T T I N G S                             */
/* -------------------------------------------------------------------------- */

export function Settings({ teamData }: { teamData: TeamDataWithMembers }) {
  const { userPromise } = useUser()
  const [user, setUser] = useState<User | null | undefined>(undefined)

  /* Resolve current user client‑side */
  useEffect(() => {
    let mounted = true
    userPromise.then((u) => mounted && setUser(u as User | null))
    return () => {
      mounted = false
    }
  }, [userPromise])

  const isOwner =
    !!teamData.teamMembers.find((m) => m.role === 'owner' && m.user.id === user?.id)

  /** Determine if the current viewer can remove the given member */
  const canRemoveMember = useCallback(
    (member: TeamDataWithMembers['teamMembers'][number]) => {
      if (!isOwner) return false
      /* Owners cannot remove other owners, nor themselves */
      return member.role !== 'owner' && member.user.id !== user?.id
    },
    [isOwner, user],
  )

  if (user === undefined) return null

  /* ---------------------------------------------------------------------- */
  /*                                 UI                                     */
  /* ---------------------------------------------------------------------- */
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
            {teamData.teamMembers.map((m) => (
              <MemberRow key={m.id} member={m} canRemove={canRemoveMember(m)} />
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Invite Form */}
      <InviteTeamMember isOwner={isOwner} />
    </section>
  )
}
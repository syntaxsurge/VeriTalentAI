import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { formatDistanceToNow } from 'date-fns'

import { BadgeCheck, Clock, XCircle, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { invitations, teams, users as usersTable } from '@/lib/db/schema'

import { acceptInvitationAction, declineInvitationAction } from './actions'

export const revalidate = 0

const STATUS_ICON = {
  pending: Clock,
  accepted: BadgeCheck,
  declined: XCircle,
} as const

const STATUS_VARIANT = {
  pending: 'secondary',
  accepted: 'success',
  declined: 'destructive',
} as const

export default async function InvitationsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const rows = await db
    .select({ inv: invitations, team: teams, inviter: usersTable })
    .from(invitations)
    .leftJoin(teams, eq(invitations.teamId, teams.id))
    .leftJoin(usersTable, eq(invitations.invitedBy, usersTable.id))
    .where(eq(invitations.email, user.email))

  if (rows.length === 0) {
    return (
      <section className='flex items-center justify-center py-12'>
        <Card className='max-w-md text-center'>
          <CardHeader>
            <CardTitle>No Invitations</CardTitle>
            <CardDescription className='text-muted-foreground'>
              You don’t have any team invites right now.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    )
  }

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>Team Invitations</h2>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {rows.map(({ inv, team, inviter }) => {
          const status = inv.status as 'pending' | 'accepted' | 'declined'
          const Icon = STATUS_ICON[status]
          const variant = STATUS_VARIANT[status]

          /* Wrap server actions for form usage */
          const acceptAction = async (fd: FormData) => {
            'use server'
            await acceptInvitationAction({}, fd)
          }
          const declineAction = async (fd: FormData) => {
            'use server'
            await declineInvitationAction({}, fd)
          }

          return (
            <Card
              key={inv.id}
              className='group relative overflow-hidden border-border/60 transition-shadow hover:shadow-lg'
            >
              {/* subtle gradient accent */}
              <span className='pointer-events-none absolute inset-0 -z-10 h-full w-full scale-110 bg-gradient-to-br from-primary/10 via-primary/0 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100' />

              <CardHeader className='flex-row items-start gap-3'>
                <div className='rounded-md border p-2'>
                  <Icon className='h-5 w-5 text-primary' />
                </div>
                <div className='space-y-1'>
                  <CardTitle className='text-base'>{team?.name || 'Unnamed Team'}</CardTitle>
                  <CardDescription>
                    Invited{' '}
                    {formatDistanceToNow(new Date(inv.invitedAt), {
                      addSuffix: true,
                    })}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Users className='h-4 w-4' />
                  <span>{inviter?.name || inviter?.email || 'Someone'}</span>
                </div>

                <div className='flex items-center gap-2'>
                  <Badge variant={variant}>{status}</Badge>
                  <span className='capitalize text-sm'>• {inv.role}</span>
                </div>

                {status === 'pending' && (
                  <div className='flex gap-3 pt-2'>
                    {/* Accept */}
                    <form action={acceptAction}>
                      <input type='hidden' name='invitationId' value={inv.id} />
                      <Button size='sm'>Accept</Button>
                    </form>

                    {/* Decline */}
                    <form action={declineAction}>
                      <input type='hidden' name='invitationId' value={inv.id} />
                      <Button size='sm' variant='outline'>
                        Decline
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
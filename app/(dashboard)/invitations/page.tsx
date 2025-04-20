import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { formatDistanceToNow } from 'date-fns'

import { Clock, CheckCircle2, XCircle } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { invitations, teams, users as usersTable } from '@/lib/db/schema'

import { acceptInvitationAction, declineInvitationAction } from './actions'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   CONSTS                                   */
/* -------------------------------------------------------------------------- */

const STATUS_META = {
  pending: {
    icon: Clock,
    badge: 'secondary' as const,
    ring: 'ring-primary/40',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  accepted: {
    icon: CheckCircle2,
    badge: 'success' as const,
    ring: 'ring-emerald-400/40',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-500/10',
  },
  declined: {
    icon: XCircle,
    badge: 'destructive' as const,
    ring: 'ring-rose-400/40',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-500/10',
  },
} as const

function displayName(name?: string | null, email?: string | null) {
  return name || email || 'Unknown'
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

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
        <Card className='max-w-md text-center shadow-sm'>
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
          const status = inv.status as keyof typeof STATUS_META
          const meta = STATUS_META[status]
          const Icon = meta.icon

          /* Server action wrappers */
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
              className={`
                group relative overflow-hidden rounded-xl border-none shadow-sm ring-1 ring-border/20 hover:shadow-lg
                ${meta.ring}
              `}
            >
              {/* Decorative corner gradient */}
              <span className='pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-primary/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

              {/* Header */}
              <CardHeader className='flex items-start gap-4 p-5'>
                <div className={`rounded-full p-2 ${meta.iconBg}`}>
                  <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                </div>

                <div className='flex-1'>
                  <CardTitle className='truncate text-base font-semibold'>
                    {team?.name || 'Unnamed Team'}
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Invited{' '}
                    {formatDistanceToNow(new Date(inv.invitedAt), { addSuffix: true })}
                  </CardDescription>
                </div>

                <Badge variant={meta.badge}>{status}</Badge>
              </CardHeader>

              {/* Content */}
              <CardContent className='space-y-4 px-5 pb-5'>
                {/* Inviter */}
                <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                  <Avatar className='size-6'>
                    {inviter?.imageUrl ? (
                      <AvatarImage src={inviter.imageUrl} alt={displayName(inviter.name, inviter.email)} />
                    ) : (
                      <AvatarFallback>
                        {displayName(inviter?.name, inviter?.email)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className='truncate'>
                    {displayName(inviter?.name, inviter?.email)}
                  </span>
                </div>

                {/* Role */}
                <p className='text-sm capitalize'>
                  You will join as <span className='font-medium'>{inv.role}</span>
                </p>

                {/* Actions */}
                {status === 'pending' && (
                  <div className='flex gap-3 pt-2'>
                    {/* Accept */}
                    <form action={acceptAction}>
                      <input type='hidden' name='invitationId' value={inv.id} />
                      <Button size='sm' className='w-24'>
                        Accept
                      </Button>
                    </form>

                    {/* Decline */}
                    <form action={declineAction}>
                      <input type='hidden' name='invitationId' value={inv.id} />
                      <Button size='sm' variant='outline' className='w-24'>
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
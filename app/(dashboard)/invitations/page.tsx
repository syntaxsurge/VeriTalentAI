import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { invitations, teams } from '@/lib/db/schema'

import {
  acceptInvitationAction,
  declineInvitationAction,
} from './actions'

export const revalidate = 0

export default async function InvitationsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const rows = await db
    .select({ inv: invitations, team: teams })
    .from(invitations)
    .leftJoin(teams, eq(invitations.teamId, teams.id))
    .where(eq(invitations.email, user.email))

  return (
    <section className='space-y-6'>
      <h2 className='text-xl font-semibold'>Team Invitations</h2>

      {rows.length === 0 ? (
        <p className='text-muted-foreground'>You have no invitations.</p>
      ) : (
        <div className='grid gap-4'>
          {rows.map(({ inv, team }) => {
            /* Wrapper server actions so each form has zero‑arg signature */
            const acceptAction = async (fd: FormData) => {
              'use server'
              await acceptInvitationAction({}, fd)
            }
            const declineAction = async (fd: FormData) => {
              'use server'
              await declineInvitationAction({}, fd)
            }

            return (
              <Card key={inv.id} className='group transition-shadow hover:shadow-md'>
                <CardHeader>
                  <CardTitle>{team?.name || 'Unnamed Team'}</CardTitle>
                </CardHeader>

                <CardContent className='space-y-3 text-sm'>
                  <p className='capitalize'>
                    Role:&nbsp;<span className='font-medium'>{inv.role}</span>
                  </p>

                  {inv.status === 'pending' ? (
                    <div className='flex gap-3'>
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
                  ) : (
                    <p className='capitalize'>
                      Status:&nbsp;
                      <span
                        className={
                          inv.status === 'accepted'
                            ? 'text-emerald-600'
                            : inv.status === 'declined'
                              ? 'text-rose-600'
                              : 'text-muted-foreground'
                        }
                      >
                        {inv.status}
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'

import { AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InvitationsTable, { RowType } from '@/components/dashboard/invitations-table'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { invitations, teams, users as usersTable } from '@/lib/db/schema'

export const revalidate = 0

export default async function InvitationsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ------------------------------------------------------------------ */
  /* Load invitations addressed to the current user                     */
  /* ------------------------------------------------------------------ */
  const rows = await db
    .select({
      id: invitations.id,
      teamName: teams.name,
      role: invitations.role,
      inviterName: usersTable.name,
      inviterEmail: usersTable.email,
      status: invitations.status,
      invitedAt: invitations.invitedAt,
    })
    .from(invitations)
    .leftJoin(teams, eq(invitations.teamId, teams.id))
    .leftJoin(usersTable, eq(invitations.invitedBy, usersTable.id))
    .where(eq(invitations.email, user.email))
    .orderBy(desc(invitations.invitedAt))

  const tableRows: RowType[] = rows.map((r) => ({
    id: r.id,
    team: r.teamName || 'Unnamed Team',
    role: r.role,
    inviter: r.inviterName || r.inviterEmail || 'Unknown',
    status: r.status,
    invitedAt: r.invitedAt,
  }))

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <section className='flex-1'>
      <h2 className='mb-4 text-xl font-semibold'>Team Invitations</h2>

      {tableRows.length === 0 ? (
        <div className='text-muted-foreground flex flex-col items-center gap-2 text-center'>
          <AlertCircle className='h-8 w-8' />
          <p>No invitations.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invitations Overview</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <InvitationsTable rows={tableRows} />
          </CardContent>
        </Card>
      )}
    </section>
  )
}
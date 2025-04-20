import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InvitationsTable, {
  RowType,
} from '@/components/dashboard/invitations-table'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { invitations, teams, users as usersTable } from '@/lib/db/schema'

export const revalidate = 0

export default async function InvitationsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

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

  if (rows.length === 0) {
    return (
      <section className='flex items-center justify-center py-12'>
        <Card className='max-w-md text-center shadow-sm'>
          <CardHeader>
            <CardTitle>No Invitations</CardTitle>
          </CardHeader>
        </Card>
      </section>
    )
  }

  const tableRows: RowType[] = rows.map((r) => ({
    id: r.id,
    team: r.teamName || 'Unnamed Team',
    role: r.role,
    inviter: r.inviterName || r.inviterEmail || 'Unknown',
    status: r.status,
    invitedAt: r.invitedAt,
  }))

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>Team Invitations</h2>

      <Card>
        <CardHeader>
          <CardTitle>Invitations Overview</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <InvitationsTable rows={tableRows} />
        </CardContent>
      </Card>
    </section>
  )
}
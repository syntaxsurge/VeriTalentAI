import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminUsersTable, { RowType } from '@/components/dashboard/admin-users-table'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'

export const revalidate = 0

export default async function AdminUsersPage() {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* fetch only the required columns to match RowType */
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)

  const tableRows: RowType[] = rows.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }))

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">All Users</h2>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <AdminUsersTable rows={tableRows} />
        </CardContent>
      </Card>
    </section>
  )
}
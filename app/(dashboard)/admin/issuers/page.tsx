import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminIssuersTable, { RowType } from '@/components/dashboard/admin/issuers-table'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { users as usersTable } from '@/lib/db/schema/core'
import { issuers as issuersTable } from '@/lib/db/schema/issuer'

export const revalidate = 0

export default async function AdminIssuersPage() {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  const rows = await db
    .select({ issuer: issuersTable, owner: usersTable })
    .from(issuersTable)
    .leftJoin(usersTable, eq(issuersTable.ownerUserId, usersTable.id))

  const tableRows: RowType[] = rows.map(({ issuer, owner }) => ({
    id: issuer.id,
    name: issuer.name,
    domain: issuer.domain,
    owner: owner?.name || owner?.email || '—',
    category: issuer.category,
    industry: issuer.industry,
    status: issuer.status,
  }))

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Issuer Management</h2>

      <Card>
        <CardHeader>
          <CardTitle>All Issuers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <AdminIssuersTable rows={tableRows} />
        </CardContent>
      </Card>
    </section>
  )
}
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminCredentialsTable, {
  RowType,
} from '@/components/dashboard/admin-credentials-table'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'
import { issuers as issuersTable } from '@/lib/db/schema/issuer'
import {
  candidateCredentials as credsT,
  candidates as candT,
  CredentialStatus,
} from '@/lib/db/schema/viskify'

export const revalidate = 0

export default async function AdminCredentialsPage() {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  const rows = await db
    .select({ cred: credsT, candUser: usersTable, issuer: issuersTable })
    .from(credsT)
    .leftJoin(candT, eq(credsT.candidateId, candT.id))
    .leftJoin(usersTable, eq(candT.userId, usersTable.id))
    .leftJoin(issuersTable, eq(credsT.issuerId, issuersTable.id))

  const tableRows: RowType[] = rows.map((r) => ({
    id: r.cred.id,
    title: r.cred.title,
    candidate: r.candUser?.name || r.candUser?.email || 'Unknown',
    issuer: r.issuer?.name || null,
    status: r.cred.status as CredentialStatus,
  }))

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">All Credentials</h2>

      <Card>
        <CardHeader>
          <CardTitle>Credentials Overview</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <AdminCredentialsTable rows={tableRows} />
        </CardContent>
      </Card>
    </section>
  )
}
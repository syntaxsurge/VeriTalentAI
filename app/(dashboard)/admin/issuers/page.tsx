import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import IssuerStatusButtons from '@/components/dashboard/issuer-status-buttons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'
import { issuers as issuersTable, IssuerStatus } from '@/lib/db/schema/issuer'

export const revalidate = 0

export default async function AdminIssuersPage() {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  const rows = await db
    .select({
      issuer: issuersTable,
      owner: usersTable,
    })
    .from(issuersTable)
    .leftJoin(usersTable, eq(issuersTable.ownerUserId, usersTable.id))

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>Issuer Management</h2>

      <Card>
        <CardHeader>
          <CardTitle>All Issuers</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_th]:text-muted-foreground border-b'>
              <tr>
                <th className='py-2 text-left'>ID</th>
                <th className='py-2 text-left'>Name / Domain</th>
                <th className='py-2 text-left'>Owner</th>
                <th className='py-2 text-left'>DID</th>
                <th className='py-2 text-left'>Category</th>
                <th className='py-2 text-left'>Industry</th>
                <th className='py-2 text-left'>Status</th>
                <th className='py-2 text-left'></th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {rows.map(({ issuer, owner }) => (
                <tr key={issuer.id} className='hover:bg-muted/30'>
                  <td className='py-2 pr-4'>{issuer.id}</td>
                  <td className='py-2 pr-4'>
                    {issuer.name}
                    <div className='text-muted-foreground text-xs'>{issuer.domain}</div>
                  </td>
                  <td className='py-2 pr-4'>
                    {owner?.name || owner?.email || '—'}
                    <div className='text-muted-foreground text-xs'>{owner?.email}</div>
                  </td>
                  <td className='break-all max-w-[12rem] py-2 pr-4'>{issuer.did || '—'}</td>
                  <td className='capitalize py-2 pr-4'>
                    {issuer.category.replaceAll('_', ' ').toLowerCase()}
                  </td>
                  <td className='capitalize py-2 pr-4'>{issuer.industry.toLowerCase()}</td>
                  <td
                    className={`capitalize py-2 ${
                      issuer.status === IssuerStatus.ACTIVE
                        ? 'text-emerald-600'
                        : issuer.status === IssuerStatus.PENDING
                          ? 'text-amber-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {issuer.status}
                  </td>
                  <td className='py-2 pr-4'>
                    <IssuerStatusButtons issuerId={issuer.id} status={issuer.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  )
}
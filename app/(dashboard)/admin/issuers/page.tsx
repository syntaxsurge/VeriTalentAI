import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'
import {
  issuers as issuersTable,
  IssuerStatus,
} from '@/lib/db/schema/issuer'

import { updateIssuerStatusAction } from './actions'

export const revalidate = 0

export default async function AdminIssuersPage() {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* ------------------------------------------------------------ */
  /* Load issuer rows + owner user                                */
  /* ------------------------------------------------------------ */
  const rows = await db
    .select({
      issuer: issuersTable,
      owner: usersTable,
    })
    .from(issuersTable)
    .leftJoin(usersTable, eq(issuersTable.ownerUserId, usersTable.id))

  /* Wrapper because updateIssuerStatusAction expects single FormData */
  const updateStatus = async (fd: FormData): Promise<void> => {
    'use server'
    await updateIssuerStatusAction({}, fd)
  }

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
                  <td className='break-all py-2 pr-4 max-w-[12rem]'>{issuer.did || '—'}</td>
                  <td className='capitalize py-2 pr-4'>
                    {issuer.category.replaceAll('_', ' ').toLowerCase()}
                  </td>
                  <td className='capitalize py-2 pr-4'>
                    {issuer.industry.toLowerCase()}
                  </td>
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
                  <td className='py-2 space-x-2 whitespace-nowrap'>
                    {/* Verify button */}
                    {issuer.status !== IssuerStatus.ACTIVE && (
                      <form action={updateStatus} className='inline'>
                        <input type='hidden' name='issuerId' value={issuer.id} />
                        <input type='hidden' name='status' value={IssuerStatus.ACTIVE} />
                        <Button size='sm' variant='default'>
                          Verify
                        </Button>
                      </form>
                    )}
                    {/* Unverify button (reset to pending) */}
                    {issuer.status === IssuerStatus.ACTIVE && (
                      <form action={updateStatus} className='inline'>
                        <input type='hidden' name='issuerId' value={issuer.id} />
                        <input type='hidden' name='status' value={IssuerStatus.PENDING} />
                        <Button size='sm' variant='outline'>
                          Unverify
                        </Button>
                      </form>
                    )}
                    {/* Reject button */}
                    {issuer.status !== IssuerStatus.REJECTED && (
                      <form action={updateStatus} className='inline'>
                        <input type='hidden' name='issuerId' value={issuer.id} />
                        <input type='hidden' name='status' value={IssuerStatus.REJECTED} />
                        <Button size='sm' variant='destructive'>
                          Reject
                        </Button>
                      </form>
                    )}
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
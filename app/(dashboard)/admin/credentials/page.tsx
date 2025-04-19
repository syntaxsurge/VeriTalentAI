import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'
import { issuers as issuersTable } from '@/lib/db/schema/issuer'
import {
  candidateCredentials,
  CredentialStatus,
  candidates,
} from '@/lib/db/schema/veritalent'

export const revalidate = 0

export default async function AdminCredentialsPage() {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  const rows = await db
    .select({
      cred: candidateCredentials,
      cand: candidates,
      candUser: usersTable,
      issuer: issuersTable,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(usersTable, eq(candidates.userId, usersTable.id))
    .leftJoin(issuersTable, eq(candidateCredentials.issuerId, issuersTable.id))

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>All Credentials</h2>

      <Card>
        <CardHeader>
          <CardTitle>Credentials Overview</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_th]:text-muted-foreground border-b'>
              <tr>
                <th className='py-2 text-left'>ID</th>
                <th className='py-2 text-left'>Title</th>
                <th className='py-2 text-left'>Candidate</th>
                <th className='py-2 text-left'>Issuer</th>
                <th className='py-2 text-left'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {rows.map((r) => (
                <tr key={r.cred.id} className='hover:bg-muted/30'>
                  <td className='py-2 pr-4'>{r.cred.id}</td>
                  <td className='py-2 pr-4'>{r.cred.title}</td>
                  <td className='py-2 pr-4'>
                    {r.candUser?.name || r.candUser?.email || 'Unknown'}
                  </td>
                  <td className='py-2 pr-4'>{r.issuer?.name || '—'}</td>
                  <td
                    className={`capitalize py-2 ${
                      r.cred.status === CredentialStatus.VERIFIED
                        ? 'text-emerald-600'
                        : r.cred.status === CredentialStatus.PENDING
                          ? 'text-amber-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {r.cred.status}
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
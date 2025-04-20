import { redirect } from 'next/navigation'
import { eq, and, inArray } from 'drizzle-orm'

import { AlertCircle } from 'lucide-react'

import IssuerRequestsTable, {
  type RowType,
} from '@/components/dashboard/issuer/requests-table'
import { RequestsStatusFilter } from '@/components/dashboard/issuer/requests-status-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import {
  candidateCredentials,
  CredentialStatus,
  candidates,
} from '@/lib/db/schema/viskify'

export const revalidate = 0

export default async function RequestsPage({
  searchParams,
}: {
  searchParams?: { status?: string }
}) {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db
    .select()
    .from(issuers)
    .where(eq(issuers.ownerUserId, user.id))
    .limit(1)

  if (!issuer) redirect('/issuer/onboard')

  /* ------------------- status filter ------------------- */
  const statusParam = (searchParams?.status ?? CredentialStatus.PENDING).toLowerCase()
  const statuses = statusParam
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is CredentialStatus =>
      Object.values(CredentialStatus).includes(s as CredentialStatus),
    )

  /* Ensure at least pending when invalid */
  if (statuses.length === 0) {
    statuses.push(CredentialStatus.PENDING)
  }

  /* ------------------- query --------------------------- */
  const requests = await db
    .select({
      credential: candidateCredentials,
      candidateRow: candidates,
      candidateUser: users,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(candidateCredentials.issuerId, issuer.id),
        inArray(candidateCredentials.status, statuses as any),
      ),
    )

  const tableRows: RowType[] = requests.map((r) => ({
    id: r.credential.id,
    title: r.credential.title,
    type: r.credential.type,
    candidate: r.candidateUser?.name || r.candidateUser?.email || 'Unknown',
    status: r.credential.status,
  }))

  /* ------------------- UI ------------------------------ */
  return (
    <section className='flex-1 space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <h2 className='text-xl font-semibold'>Verification Requests</h2>
        <RequestsStatusFilter />
      </div>

      {tableRows.length === 0 ? (
        <div className='text-muted-foreground flex flex-col items-center gap-2 text-center'>
          <AlertCircle className='h-8 w-8' />
          <p>No requests for the selected status.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Requests Overview</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <IssuerRequestsTable rows={tableRows} />
          </CardContent>
        </Card>
      )}
    </section>
  )
}
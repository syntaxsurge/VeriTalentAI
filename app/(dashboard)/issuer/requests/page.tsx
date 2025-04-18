import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq, and } from 'drizzle-orm'
import { AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/veritalent'

export const revalidate = 0

export default async function RequestsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)

  if (!issuer) redirect('/issuer/onboard')

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
        eq(candidateCredentials.status, CredentialStatus.PENDING),
      ),
    )

  return (
    <section className='flex-1'>
      <h2 className='mb-4 text-xl font-semibold'>Pending Verification Requests</h2>

      {requests.length === 0 ? (
        <div className='text-muted-foreground flex flex-col items-center gap-2 text-center'>
          <AlertCircle className='h-8 w-8' />
          <p>No pending requests.</p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {requests.map((r) => (
            <Card key={r.credential.id}>
              <CardHeader>
                <CardTitle>{r.credential.title}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-1 text-sm'>
                <p className='capitalize'>Type: {r.credential.type}</p>
                <p>Candidate: {r.candidateUser?.name || r.candidateUser?.email || 'Unknown'}</p>
                <Link
                  href={`/issuer/credentials/${r.credential.id}`}
                  className='text-primary underline'
                >
                  Review &amp; Sign
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

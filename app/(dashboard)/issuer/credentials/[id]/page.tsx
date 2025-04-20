import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'

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

import { CredentialActions } from '@/components/dashboard/issuer/credential-actions'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function CredentialDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const credentialId = Number(params.id)
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db
    .select()
    .from(issuers)
    .where(eq(issuers.ownerUserId, user.id))
    .limit(1)
  if (!issuer) redirect('/issuer/onboard')

  const [data] = await db
    .select({
      cred: candidateCredentials,
      cand: candidates,
      candUser: users,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(candidateCredentials.id, credentialId),
        eq(candidateCredentials.issuerId, issuer.id),
      ),
    )
    .limit(1)

  if (!data) redirect('/issuer/requests')

  const { cred, candUser } = data

  /* ----------------------------- UI ----------------------------- */
  return (
    <section className='max-w-xl space-y-8'>
      {/* Heading */}
      <h2 className='text-2xl font-semibold'>Credential Details</h2>

      {/* Details card */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>{cred.title}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <p className='capitalize'>
            <span className='font-medium'>Type:</span> {cred.type}
          </p>
          <p>
            <span className='font-medium'>Candidate:</span>{' '}
            {candUser?.name || candUser?.email || 'Unknown'}
          </p>
          {cred.fileUrl && (
            <p>
              <span className='font-medium'>Attached File:</span>{' '}
              <a
                href={cred.fileUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary underline'
              >
                View
              </a>
            </p>
          )}
          <p className='capitalize'>
            <span className='font-medium'>Status:</span>{' '}
            {cred.status.toLowerCase()}
          </p>
        </CardContent>
      </Card>

      {/* Action buttons (pending only) */}
      {cred.status === CredentialStatus.PENDING && (
        <CredentialActions credentialId={cred.id} />
      )}
    </section>
  )
}
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq, and } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/viskify'

import { approveCredentialAction, rejectCredentialAction } from '../actions'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                          S E R V E R   A C T I O N S                       */
/* -------------------------------------------------------------------------- */

async function approveAction(formData: FormData): Promise<void> {
  'use server'
  await approveCredentialAction({}, formData)
}

async function rejectAction(formData: FormData): Promise<void> {
  'use server'
  await rejectCredentialAction({}, formData)
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function CredentialDetailPage({ params }: { params: { id: string } }) {
  const credentialId = Number(params.id)
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)
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
      and(eq(candidateCredentials.id, credentialId), eq(candidateCredentials.issuerId, issuer.id)),
    )
    .limit(1)

  if (!data) redirect('/issuer/requests')

  const { cred, candUser } = data

  return (
    <section className='max-w-xl space-y-6'>
      {/* Credential details */}
      <Card>
        <CardHeader>
          <CardTitle>{cred.title}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <p className='capitalize'>Type: {cred.type}</p>
          <p>Candidate: {candUser?.name || candUser?.email || 'Unknown'}</p>
          {cred.fileUrl && (
            <a
              href={cred.fileUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary underline'
            >
              View Attached File
            </a>
          )}
          <p>Status: {cred.status}</p>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {cred.status === CredentialStatus.PENDING && (
        <div className='flex gap-4'>
          <form action={approveAction}>
            <input type='hidden' name='credentialId' value={cred.id} />
            <Button type='submit'>Approve &amp; Sign VC</Button>
          </form>

          <form action={rejectAction}>
            <input type='hidden' name='credentialId' value={cred.id} />
            <Button type='submit' variant='destructive'>
              Reject
            </Button>
          </form>
        </div>
      )}

      <Link href='/issuer/requests' className='text-sm underline'>
        ← Back to requests
      </Link>
    </section>
  )
}
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { BadgeCheck, Clock, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/viskify'

export const revalidate = 0

export default async function CredentialsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  const creds = candidate
    ? await db
        .select()
        .from(candidateCredentials)
        .where(eq(candidateCredentials.candidateId, candidate.id))
    : []

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>My Credentials</h2>
        <Link href='/candidate/credentials/add'>
          <Button size='sm'>Add Credential</Button>
        </Link>
      </div>

      {creds.length === 0 ? (
        <p className='text-muted-foreground'>No credentials added yet.</p>
      ) : (
        <div className='grid gap-4'>
          {creds.map((cred) => {
            const StatusIcon =
              cred.status === CredentialStatus.VERIFIED
                ? BadgeCheck
                : cred.status === CredentialStatus.PENDING
                  ? Clock
                  : AlertCircle

            const color =
              cred.status === CredentialStatus.VERIFIED
                ? 'text-emerald-500'
                : cred.status === CredentialStatus.PENDING
                  ? 'text-amber-500'
                  : 'text-rose-500'

            return (
              <Card key={cred.id}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <StatusIcon className={`h-4 w-4 ${color}`} />
                    {cred.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className='text-muted-foreground space-y-1 text-sm'>
                  <p className='capitalize'>Type: {cred.type}</p>
                  <p>Status: {cred.status}</p>
                  {cred.fileUrl && (
                    <a
                      href={cred.fileUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline'
                    >
                      View file
                    </a>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

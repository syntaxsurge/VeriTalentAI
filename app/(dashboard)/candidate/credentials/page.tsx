import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CandidateCredentialsTable, {
  RowType,
} from '@/components/dashboard/candidate/credentials-table'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { candidateCredentials as credsT, candidates as candT } from '@/lib/db/schema/viskify'
import { issuers as issuersT } from '@/lib/db/schema/issuer'

export const revalidate = 0

export default async function CredentialsPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ------------------------------------------------------------------ */
  /* Identify candidate record                                          */
  /* ------------------------------------------------------------------ */
  const [candidate] = await db.select().from(candT).where(eq(candT.userId, user.id)).limit(1)
  if (!candidate) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>My Credentials</h2>
          <Link href='/candidate/credentials/add'>
            <Button size='sm'>Add Credential</Button>
          </Link>
        </div>
        <p className='text-muted-foreground'>No credentials added yet.</p>
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Load credentials with issuer name                                  */
  /* ------------------------------------------------------------------ */
  const rows = await db
    .select({
      id: credsT.id,
      title: credsT.title,
      type: credsT.type,
      status: credsT.status,
      fileUrl: credsT.fileUrl,
      issuerName: issuersT.name,
    })
    .from(credsT)
    .leftJoin(issuersT, eq(credsT.issuerId, issuersT.id))
    .where(eq(credsT.candidateId, candidate.id))

  const tableRows: RowType[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    issuer: r.issuerName || null,
    status: r.status,
    fileUrl: r.fileUrl,
  }))

  /* ------------------------------------------------------------------ */
  /* JSX                                                                */
  /* ------------------------------------------------------------------ */
  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>My Credentials</h2>
        <Link href='/candidate/credentials/add'>
          <Button size='sm'>Add Credential</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credentials Overview</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <CandidateCredentialsTable rows={tableRows} />
        </CardContent>
      </Card>
    </section>
  )
}
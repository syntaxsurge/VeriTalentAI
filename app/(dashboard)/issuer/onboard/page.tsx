import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

import { CreateIssuerForm } from './create-issuer-form'
import { LinkDidForm } from './link-did-form'

export const revalidate = 0

export default async function IssuerOnboardPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)

  return (
    <section className='max-w-xl space-y-8'>
      <h2 className='text-xl font-semibold'>Issuer Onboarding</h2>

      {/* ------------------------------- First time ------------------------------- */}
      {!issuer && <CreateIssuerForm />}

      {/* ----------------------------- Existing issuer ----------------------------- */}
      {issuer && (
        <>
          <div className='space-y-1.5'>
            <p className='font-medium'>Name: {issuer.name}</p>
            <p className='text-muted-foreground text-sm'>Status: {issuer.status}</p>
            {issuer.did && (
              <p className='break-all'>
                <span className='font-medium'>DID:</span> {issuer.did}
              </p>
            )}
          </div>

          {/* Link DID if still missing */}
          {!issuer.did && <LinkDidForm />}

          {issuer.status === IssuerStatus.PENDING && (
            <p className='text-muted-foreground text-sm'>
              Your issuer is awaiting admin approval. You’ll receive an email once it becomes
              active.
            </p>
          )}
        </>
      )}
    </section>
  )
}
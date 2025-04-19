import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

import { CreateIssuerForm } from './create-issuer-form'
import { EditIssuerForm } from './edit-issuer-form'
import { LinkDidForm } from './link-did-form'

export const revalidate = 0

export default async function IssuerOnboardPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db
    .select()
    .from(issuers)
    .where(eq(issuers.ownerUserId, user.id))
    .limit(1)

  /* ------------------------------------------------------------------ */
  /*                    H E L P E R   F O R M A T T I N G                */
  /* ------------------------------------------------------------------ */

  function prettify(text: string | null): string {
    return text ? text.replaceAll('_', ' ').toLowerCase() : '—'
  }

  /* ------------------------------------------------------------------ */
  /*                                JSX                                 */
  /* ------------------------------------------------------------------ */

  return (
    <section className='mx-auto flex max-w-xl flex-col gap-8'>
      <h2 className='text-xl font-semibold'>Issuer Onboarding</h2>

      {/* --------------------------- No issuer yet --------------------------- */}
      {!issuer && <CreateIssuerForm />}

      {/* --------------------------- Rejected state -------------------------- */}
      {issuer && issuer.status === IssuerStatus.REJECTED && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-medium'>Previous Submission</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 text-sm'>
              <p>
                <span className='font-medium'>Name:</span> {issuer.name}
              </p>
              <p>
                <span className='font-medium'>Domain:</span> {issuer.domain}
              </p>
              <p>
                <span className='font-medium'>Category:</span> {prettify(issuer.category)}
              </p>
              <p>
                <span className='font-medium'>Industry:</span> {prettify(issuer.industry)}
              </p>
              {issuer.logoUrl && (
                <div className='mt-2 flex flex-col'>
                  <span className='font-medium'>Logo preview:</span>
                  <Image
                    src={issuer.logoUrl}
                    alt={`${issuer.name} logo`}
                    width={96}
                    height={96}
                    className='mt-1 h-24 w-auto rounded-md border object-contain'
                  />
                </div>
              )}
              {issuer.rejectionReason && (
                <p className='mt-2 rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300'>
                  <span className='font-medium'>Rejection reason:</span> {issuer.rejectionReason}
                </p>
              )}
            </CardContent>
          </Card>

          <EditIssuerForm issuer={issuer} />
        </>
      )}

      {/* ---------------------- Pending / Active states ---------------------- */}
      {issuer && issuer.status !== IssuerStatus.REJECTED && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-medium'>Organisation Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <p>
                <span className='font-medium'>Name:</span> {issuer.name}
              </p>
              <p>
                <span className='font-medium'>Status:</span>{' '}
                <span
                  className={
                    issuer.status === IssuerStatus.ACTIVE
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }
                >
                  {issuer.status.toLowerCase()}
                </span>
              </p>
              <p>
                <span className='font-medium'>Domain:</span> {issuer.domain}
              </p>
              <p>
                <span className='font-medium'>Category:</span> {prettify(issuer.category)}
              </p>
              <p>
                <span className='font-medium'>Industry:</span> {prettify(issuer.industry)}
              </p>
              {issuer.logoUrl && (
                <div className='flex flex-col'>
                  <span className='font-medium'>Logo preview:</span>
                  <Image
                    src={issuer.logoUrl}
                    alt={`${issuer.name} logo`}
                    width={96}
                    height={96}
                    className='mt-1 h-24 w-auto rounded-md border object-contain'
                  />
                </div>
              )}
              {issuer.did && (
                <p className='break-all'>
                  <span className='font-medium'>DID:</span> {issuer.did}
                </p>
              )}
            </CardContent>
          </Card>

          {/* DID link form only when active but no DID */}
          {!issuer.did && issuer.status === IssuerStatus.ACTIVE && <LinkDidForm />}

          {/* Pending info banner */}
          {issuer.status === IssuerStatus.PENDING && (
            <div className='rounded-md bg-muted p-4 text-sm'>
              Your issuer is awaiting admin approval. You’ll receive an email once it becomes
              active.
            </div>
          )}
        </>
      )}

      {/* Quick link back to dashboard */}
      <Link href='/dashboard' className='self-start'>
        <Button variant='outline' size='sm'>
          ← Back to Dashboard
        </Button>
      </Link>
    </section>
  )
}
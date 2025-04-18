import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

import { createIssuerAction, updateIssuerDidAction } from './actions'

export const revalidate = 0

export default async function IssuerOnboardPage() {
  /* ------------------------------------------------------------------ */
  /* Auth & issuer record                                               */
  /* ------------------------------------------------------------------ */
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)

  /* ------------------------------------------------------------------ */
  /* Server‑action wrappers (single‑param)                              */
  /* ------------------------------------------------------------------ */
  const createAction = async (formData: FormData): Promise<void> => {
    await createIssuerAction({}, formData)
  }

  const linkDidAction = async (formData: FormData): Promise<void> => {
    await updateIssuerDidAction({}, formData)
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <section className='max-w-xl'>
      <h2 className='mb-4 text-xl font-semibold'>Issuer Onboarding</h2>

      {/* -------------------------------------------------------------- */}
      {/* First‑time onboarding                                          */}
      {/* -------------------------------------------------------------- */}
      {!issuer && (
        <form action={createAction} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Organisation Name</Label>
            <Input id='name' name='name' required />
          </div>
          <div>
            <Label htmlFor='domain'>Email Domain</Label>
            <Input id='domain' name='domain' required placeholder='example.edu' />
          </div>
          <div>
            <Label htmlFor='logoUrl'>Logo URL</Label>
            <Input id='logoUrl' name='logoUrl' type='url' placeholder='https://…' />
          </div>
          <div>
            <Label htmlFor='did'>cheqd DID (optional)</Label>
            <Input id='did' name='did' placeholder='did:cheqd:testnet:xyz…' />
          </div>
          <Button type='submit'>Create Issuer</Button>
        </form>
      )}

      {/* -------------------------------------------------------------- */}
      {/* Existing issuer profile                                        */}
      {/* -------------------------------------------------------------- */}
      {issuer && (
        <div className='space-y-6'>
          <div>
            <p className='font-medium'>Name: {issuer.name}</p>
            <p className='text-muted-foreground text-sm'>Status: {issuer.status}</p>
            {issuer.did && (
              <p className='mt-2 break-all'>
                <span className='font-medium'>DID:</span> {issuer.did}
              </p>
            )}
          </div>

          {/* Link DID if missing */}
          {!issuer.did && (
            <form action={linkDidAction} className='space-y-4'>
              <div>
                <Label htmlFor='did'>Link a cheqd DID</Label>
                <Input id='did' name='did' required placeholder='did:cheqd:testnet:xyz…' />
              </div>
              <Button type='submit'>Save DID</Button>
            </form>
          )}

          {/* Pending note */}
          {issuer.status === IssuerStatus.PENDING && (
            <p className='text-muted-foreground text-sm'>
              Your issuer is awaiting admin approval. You’ll receive an email once it becomes
              active.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

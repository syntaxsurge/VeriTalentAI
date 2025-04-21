import { redirect } from 'next/navigation'

import { getUser } from '@/lib/db/queries'
import UpdateDidForm from './update-did-form'

export const revalidate = 0

export default async function PlatformDidPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'admin') redirect('/dashboard')

  const existingDid = process.env.PLATFORM_ISSUER_DID ?? null

  return (
    <section className='max-w-xl space-y-6'>
      <h2 className='text-2xl font-semibold'>Platform Decentralized Identifier (DID)</h2>

      <p className='text-muted-foreground text-sm'>
        Viskify uses this DID when the platform itself acts as an issuer. You can paste an
        existing DID or let the system generate a fresh one.
      </p>

      <UpdateDidForm defaultDid={existingDid} />
    </section>
  )
}
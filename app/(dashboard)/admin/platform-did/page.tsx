import { redirect } from 'next/navigation'
import { KeyRound } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import { getUser } from '@/lib/db/queries/queries'

import UpdateDidForm from './update-did-form'

export const revalidate = 0

export default async function PlatformDidPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'admin') redirect('/dashboard')

  const existingDid = process.env.PLATFORM_ISSUER_DID ?? null

  return (
    <section className='mx-auto max-w-2xl py-10'>
      <PageCard
        icon={KeyRound}
        title='Platform DID'
        description='The platform uses this DID whenever Viskify itself issues verifiable credentials.'
      >
        <p className='mb-6 text-sm text-muted-foreground'>
          Paste an existing DID or generate a fresh one below. The value is stored in the
          environment file and used for credential issuance.
        </p>
        <UpdateDidForm defaultDid={existingDid} />
      </PageCard>
    </section>
  )
}
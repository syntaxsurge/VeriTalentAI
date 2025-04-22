import { redirect } from 'next/navigation'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getUser } from '@/lib/db/queries/queries'

import UpdateDidForm from './update-did-form'

export const revalidate = 0

export default async function PlatformDidPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'admin') redirect('/dashboard')

  const existingDid = process.env.PLATFORM_ISSUER_DID ?? null

  return (
    <section className='max-w-2xl space-y-6'>
      <h2 className='text-2xl font-semibold'>Platform Decentralized Identifier&nbsp;(DID)</h2>

      <p className='text-muted-foreground text-sm'>
        The platform uses this DID whenever Viskify itself issues verifiable credentials. Paste an
        existing value or generate a fresh one below.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-medium'>Manage Platform DID</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateDidForm defaultDid={existingDid} />
        </CardContent>
      </Card>
    </section>
  )
}

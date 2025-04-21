import { redirect } from 'next/navigation'

import { getUser } from '@/lib/db/queries'
import { GenerateDidButton } from './generate-did-button'

export const revalidate = 0

export default async function PlatformDidPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'admin') redirect('/dashboard')

  const existing = process.env.PLATFORM_ISSUER_DID

  return (
    <section className='max-w-xl space-y-6'>
      <h2 className='text-2xl font-semibold'>Platform DID</h2>

      {existing ? (
        <p className='break-all rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'>
          Current DID:&nbsp;<strong>{existing}</strong>
        </p>
      ) : (
        <p className='text-muted-foreground text-sm'>
          No platform DID found. Generate one below.
        </p>
      )}

      {!existing && <GenerateDidButton />}
    </section>
  )
}
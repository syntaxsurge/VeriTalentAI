import { getUser } from '@/lib/db/queries'

import { CreateDidButton } from './create-did-button'

export const revalidate = 0

export default async function CreateDIDPage() {
  const user = await getUser()
  if (!user) return <div>Please sign in</div>

  return (
    <section className='max-w-xl space-y-4'>
      <h2 className='text-xl font-semibold'>Create a Team DID</h2>
      <p className='text-muted-foreground text-sm'>
        Generate a decentralised identifier on cheqd so your team can sign credentials.
      </p>
      <CreateDidButton />
    </section>
  )
}

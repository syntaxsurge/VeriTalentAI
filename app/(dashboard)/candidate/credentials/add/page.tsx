import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import IssuerSelect from '@/components/issuer-select'
import { getUser } from '@/lib/db/queries'
import { db } from '@/lib/db/drizzle'
import {
  issuers as issuersTable,
  IssuerStatus,
} from '@/lib/db/schema/issuer'

import { addCredential } from '../actions'

export const revalidate = 0

export default async function AddCredentialPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const issuerRows = await db
    .select({
      id: issuersTable.id,
      name: issuersTable.name,
      category: issuersTable.category,
      industry: issuersTable.industry,
    })
    .from(issuersTable)
    .where(eq(issuersTable.status, IssuerStatus.ACTIVE))

  const addCredentialAction = async (formData: FormData): Promise<void> => {
    'use server'
    await addCredential({}, formData)
  }

  return (
    <section className='max-w-xl'>
      <h2 className='mb-4 text-xl font-semibold'>Add Credential</h2>

      <form action={addCredentialAction} className='space-y-4'>
        <div>
          <Label htmlFor='title'>Title</Label>
          <Input id='title' name='title' required placeholder='B.Sc Computer Science' />
        </div>

        <div>
          <Label htmlFor='type'>Type</Label>
          <Input id='type' name='type' required placeholder='diploma / cert / job_ref' />
        </div>

        <div>
          <Label htmlFor='fileUrl'>File URL</Label>
          <Input
            id='fileUrl'
            name='fileUrl'
            type='url'
            required
            placeholder='https://example.com/credential.pdf'
          />
        </div>

        {/* Optional issuer */}
        <IssuerSelect issuers={issuerRows} />

        <Button type='submit'>Add Credential</Button>
      </form>
    </section>
  )
}
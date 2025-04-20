import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { getUser } from '@/lib/db/queries'
import { db } from '@/lib/db/drizzle'
import {
  issuers as issuersTable,
  IssuerStatus,
} from '@/lib/db/schema/issuer'

import AddCredentialForm from './add-credential-form'
import { addCredential } from '../actions'

export const revalidate = 0

export default async function AddCredentialPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const issuers = await db
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
      <AddCredentialForm issuers={issuers} addCredentialAction={addCredentialAction} />
    </section>
  )
}
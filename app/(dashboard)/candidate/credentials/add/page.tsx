import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getUser } from '@/lib/db/queries'

import { addCredential } from '../actions'

export const revalidate = 0

export default async function AddCredentialPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  // Single‑parameter server‑action wrapper
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
          <Input id='title' name='title' required placeholder='B.Sc Computer Science' />
        </div>

        <div>
          <Label htmlFor='type'>Type</Label>
          <Input id='type' name='type' required placeholder='diploma / cert / job_ref' />
        </div>

        <div>
          <Label htmlFor='fileUrl'>File URL</Label>
          <Input
            id='fileUrl'
            name='fileUrl'
            type='url'
            required
            placeholder='https://example.com/credential.pdf'
          />
        </div>

        <Button type='submit'>Add Credential</Button>
      </form>
    </section>
  )
}

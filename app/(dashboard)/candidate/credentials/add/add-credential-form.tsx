'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import IssuerSelect, { IssuerOption } from '@/components/issuer-select'

interface Props {
  issuers: IssuerOption[]
  addCredentialAction: (formData: FormData) => Promise<void>
}

export default function AddCredentialForm({ issuers, addCredentialAction }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addCredentialAction(fd)
        toast.success('Credential added.')
      } catch (err: any) {
        toast.error(err?.message ?? 'Something went wrong.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
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

      <IssuerSelect issuers={issuers} />

      <Button type='submit' disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Adding…
          </>
        ) : (
          'Add Credential'
        )}
      </Button>
    </form>
  )
}
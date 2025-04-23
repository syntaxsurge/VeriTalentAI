'use client'

import { useTransition } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import IssuerSelect from '@/components/issuer-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  addCredentialAction: (formData: FormData) => Promise<void>
}

/**
 * Modernised credential-addition form with async issuer combobox.
 */
export default function AddCredentialForm({ addCredentialAction }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const toastId = toast.loading('Adding credential…')

    startTransition(async () => {
      try {
        await addCredentialAction(fd)
        toast.success('Credential added.', { id: toastId })
      } catch (err: any) {
        if (err?.digest === 'NEXT_REDIRECT' || err?.message === 'NEXT_REDIRECT') {
          toast.success('Credential added.', { id: toastId })
        } else {
          toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <Label htmlFor='title'>Title</Label>
          <Input id='title' name='title' required placeholder='B.Sc Computer Science' />
        </div>

        <div>
          <Label htmlFor='type'>Type</Label>
          <Input id='type' name='type' required placeholder='diploma / cert / job_ref' />
        </div>
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

      <IssuerSelect />

      <Button type='submit' disabled={isPending} className='w-full sm:w-max'>
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
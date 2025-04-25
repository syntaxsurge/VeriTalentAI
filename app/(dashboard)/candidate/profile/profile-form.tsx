'use client'

import * as React from 'react'
import { useActionState, startTransition } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { updateCandidateProfile } from './actions'

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type Props = {
  defaultName: string
  defaultBio: string
  defaultTwitterUrl: string
  defaultGithubUrl: string
  defaultLinkedinUrl: string
  defaultWebsiteUrl: string
}

type ActionState = {
  error?: string
  success?: string
}

/* -------------------------------------------------------------------------- */
/*                                    FORM                                    */
/* -------------------------------------------------------------------------- */

export default function ProfileForm({
  defaultName,
  defaultBio,
  defaultTwitterUrl,
  defaultGithubUrl,
  defaultLinkedinUrl,
  defaultWebsiteUrl,
}: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateCandidateProfile,
    { error: '', success: '' },
  )

  /* Keep toast ID to update after server response */
  const toastId = React.useRef<string | number | undefined>()

  /* Submit handler – show loading toast then trigger server action */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    toastId.current = toast.loading('Saving profile…')
    startTransition(() => formAction(fd))
  }

  /* Update toast once the server action resolves */
  React.useEffect(() => {
    if (!pending && toastId.current !== undefined) {
      if (state.error) {
        toast.error(state.error, { id: toastId.current })
      } else if (state.success) {
        toast.success(state.success, { id: toastId.current })
      }
    }
  }, [state, pending])

  /* ---------------------------- UI ---------------------------- */
  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Basic details */}
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Name</Label>
          <Input id='name' name='name' defaultValue={defaultName} required />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='websiteUrl'>Website</Label>
          <Input
            id='websiteUrl'
            name='websiteUrl'
            type='url'
            defaultValue={defaultWebsiteUrl}
            placeholder='https://your‑site.com'
          />
        </div>
      </div>

      {/* Bio */}
      <div className='space-y-2'>
        <Label htmlFor='bio'>Bio</Label>
        <textarea
          id='bio'
          name='bio'
          rows={5}
          defaultValue={defaultBio}
          className='border-border focus-visible:ring-primary w-full rounded-md border p-2 text-sm focus-visible:ring-2'
          placeholder='Tell recruiters about yourself…'
        />
      </div>

      {/* Social links */}
      <fieldset className='space-y-4'>
        <legend className='font-medium'>Social Links</legend>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='twitterUrl'>Twitter</Label>
            <Input
              id='twitterUrl'
              name='twitterUrl'
              type='url'
              defaultValue={defaultTwitterUrl}
              placeholder='https://twitter.com/username'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='githubUrl'>GitHub</Label>
            <Input
              id='githubUrl'
              name='githubUrl'
              type='url'
              defaultValue={defaultGithubUrl}
              placeholder='https://github.com/username'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='linkedinUrl'>LinkedIn</Label>
            <Input
              id='linkedinUrl'
              name='linkedinUrl'
              type='url'
              defaultValue={defaultLinkedinUrl}
              placeholder='https://linkedin.com/in/username'
            />
          </div>
        </div>
      </fieldset>

      <Button type='submit' disabled={pending} className='w-full sm:w-max'>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving…
          </>
        ) : (
          'Save Profile'
        )}
      </Button>
    </form>
  )
}
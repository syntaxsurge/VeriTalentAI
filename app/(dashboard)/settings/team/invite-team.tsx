'use client'

import { useActionState } from 'react'

import { Loader2, PlusCircle } from 'lucide-react'

import { inviteTeamMember } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FormStatus } from '@/components/ui/form-status'

type ActionState = { error?: string; success?: string }

export function InviteTeamMember({ isOwner }: { isOwner: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    inviteTeamMember,
    { error: '', success: '' },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg sm:text-xl'>Invite Team Member</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className='space-y-5'>
          {/* Email */}
          <div className='flex flex-col space-y-1.5'>
            <Label htmlFor='email' className='text-sm font-medium'>
              Email
            </Label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder="Enter team member's email"
              required
              disabled={!isOwner}
            />
          </div>

          {/* Role */}
          <div className='flex flex-col space-y-2'>
            <Label htmlFor='role' className='text-sm font-medium'>
              Role
            </Label>
            <RadioGroup
              defaultValue='member'
              name='role'
              disabled={!isOwner}
              className='flex space-x-6'
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='member' id='member' />
                <Label htmlFor='member' className='cursor-pointer select-none'>
                  Member
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='owner' id='owner' />
                <Label htmlFor='owner' className='cursor-pointer select-none'>
                  Owner
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Unified status / toast */}
          <FormStatus state={state} />

          {/* Submit */}
          <Button type='submit' disabled={pending || !isOwner}>
            {pending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Inviting…
              </>
            ) : (
              <>
                <PlusCircle className='mr-2 h-4 w-4' />
                Invite Member
              </>
            )}
          </Button>
        </form>
      </CardContent>

      {!isOwner && (
        <CardFooter>
          <p className='text-muted-foreground text-sm'>
            You must be a team owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
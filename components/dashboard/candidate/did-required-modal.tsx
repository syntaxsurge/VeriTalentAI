'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Blocking modal that cannot be closed; prompts the user to create a team DID.
 */
export function DidRequiredModal() {
  const router = useRouter()

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-rose-600'>
            <KeyRound className='h-5 w-5' />
            DID Required
          </DialogTitle>
          <DialogDescription>
            You need to create a Decentralised Identifier (DID) for your team before you can continue.
          </DialogDescription>
        </DialogHeader>

        <Button className='w-full' onClick={() => router.push('/candidate/create-did')}>
          Create DID
        </Button>
      </DialogContent>
    </Dialog>
  )
}
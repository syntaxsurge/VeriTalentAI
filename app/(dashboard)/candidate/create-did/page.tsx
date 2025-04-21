import { KeyRound, Users, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUser } from '@/lib/db/queries'

import { CreateDidButton } from './create-did-button'

export const revalidate = 0

/**
 * Candidate page: create a cheqd DID for the user’s team.
 * Now rendered as a visually engaging social‑media‑style card.
 */
export default async function CreateDIDPage() {
  const user = await getUser()
  if (!user) return <div>Please sign in</div>

  return (
    <section className='mx-auto max-w-lg'>
      <Card className='relative overflow-hidden shadow-md transition-shadow hover:shadow-xl'>
        {/* Decorative sparkles */}
        <Sparkles
          className='absolute -right-5 -top-5 h-28 w-28 rotate-12 text-primary/10'
          aria-hidden='true'
        />

        <CardHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <KeyRound className='h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 p-2 text-primary' />
            <div>
              <CardTitle className='text-2xl font-extrabold tracking-tight'>
                Create your Team DID
              </CardTitle>
              <p className='text-muted-foreground mt-1 text-sm'>
                Unlock verifiable credentials &amp; sign them as a team.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Social‑proof avatar row — shows team vibe */}
          <div className='flex -space-x-3'>
            {['A', 'B', 'C'].map((l) => (
              <Avatar
                key={l}
                className='ring-background size-10 rounded-full border-2 border-background shadow'
              >
                <AvatarFallback className='bg-muted text-sm font-semibold'>
                  {l}
                </AvatarFallback>
              </Avatar>
            ))}
            <div className='flex items-center justify-center size-10 rounded-full border-2 border-background bg-primary text-primary-foreground text-xs font-medium shadow'>
              +1
            </div>
          </div>

          <p className='text-sm leading-relaxed'>
            A Decentralised Identifier (DID) acts like a verified username for your company.
            Once created, your team can issue <span className='font-semibold'>signed</span> credentials
            that employers, clients, and platforms can trust instantly.
          </p>

          <CreateDidButton />
        </CardContent>
      </Card>
    </section>
  )
}
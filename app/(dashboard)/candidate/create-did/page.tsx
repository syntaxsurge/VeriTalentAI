import { KeyRound, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { teamMembers, users as usersT } from '@/lib/db/schema/core'
import { eq } from 'drizzle-orm'
import { getUser } from '@/lib/db/queries'

import { CreateDidButton } from './create-did-button'

export const revalidate = 0

/**
 * Candidate page: create a cheqd DID for the user’s team.
 * Now shows real team members (including the current user) instead of placeholders.
 */
export default async function CreateDIDPage() {
  const user = await getUser()
  if (!user) return <div>Please sign in</div>

  /* ------------------------------------------------------------------ */
  /*              Fetch team mates (ensure current user included)       */
  /* ------------------------------------------------------------------ */
  // Find the first team this user belongs to
  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  type Member = { id: number; name: string | null; email: string }

  let members: Member[] = []

  if (membership?.teamId) {
    // All users in the same team
    members = await db
      .select({
        id: usersT.id,
        name: usersT.name,
        email: usersT.email,
      })
      .from(teamMembers)
      .leftJoin(usersT, eq(teamMembers.userId, usersT.id))
      .where(eq(teamMembers.teamId, membership.teamId))
  }

  // Ensure the logged‑in user is present
  if (!members.some((m) => m.id === user.id)) {
    members.unshift({ id: user.id, name: user.name, email: user.email })
  }

  // De‑duplicate in case of joins
  const uniqueMembers = Array.from(
    new Map(members.map((m) => [m.id, m])).values(),
  )

  const MAX_DISPLAY = 4
  const display = uniqueMembers.slice(0, MAX_DISPLAY)
  const overflow = uniqueMembers.length - display.length

  /* ------------------------------------------------------------------ */
  /*                                 UI                                */
  /* ------------------------------------------------------------------ */
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
          {/* Social‑proof avatar row — real team members */}
          <div className='flex -space-x-3'>
            {display.map((member) => {
              const label = member.name || member.email
              const initial = label ? label.charAt(0).toUpperCase() : '?'
              return (
                <Avatar
                  key={member.id}
                  className='ring-background size-10 rounded-full border-2 border-background shadow'
                >
                  <AvatarImage alt={label} />
                  <AvatarFallback className='bg-muted text-sm font-semibold'>
                    {initial}
                  </AvatarFallback>
                </Avatar>
              )
            })}

            {overflow > 0 && (
              <div className='flex size-10 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-medium text-primary-foreground shadow'>
                +{overflow}
              </div>
            )}
          </div>

          <p className='text-sm leading-relaxed'>
            A Decentralised Identifier (DID) acts like a verified username for your
            company. Once created, your team can issue
            <span className='font-semibold'> signed</span>&nbsp;credentials that employers,
            clients, and platforms can trust instantly.
          </p>

          <CreateDidButton />
        </CardContent>
      </Card>
    </section>
  )
}
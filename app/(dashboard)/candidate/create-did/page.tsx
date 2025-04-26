import { eq, sql } from 'drizzle-orm'
import { KeyRound, Sparkles } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { teamMembers, users as usersT } from '@/lib/db/schema/core'

import { CreateDidButton } from './create-did-button'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type Member = {
  id: number
  name: string | null
  email: string
}

/* -------------------------------------------------------------------------- */
/*                                   CONSTS                                   */
/* -------------------------------------------------------------------------- */

const MAX_DISPLAY = 3

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

export default async function CreateDIDPage() {
  const user = await getUser()
  if (!user) return <div>Please sign in</div>

  /* -------------------------- Resolve membership -------------------------- */
  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  let displayMembers: Member[] = []
  let teamSize = 1 // at least the current user

  if (membership?.teamId) {
    /* Total members – cheap aggregate for overflow */
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
    teamSize = count

    /* First few members for avatar row */
    const rows = await db
      .select({
        id: usersT.id,
        name: usersT.name,
        email: usersT.email,
      })
      .from(teamMembers)
      .innerJoin(usersT, eq(teamMembers.userId, usersT.id))
      .where(eq(teamMembers.teamId, membership.teamId))
      .limit(MAX_DISPLAY)

    displayMembers = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
    }))
  }

  /* Ensure current user is visible */
  if (!displayMembers.some((m) => m.id === user.id)) {
    displayMembers.unshift({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    displayMembers = displayMembers.slice(0, MAX_DISPLAY)
  }

  const overflow = Math.max(teamSize - displayMembers.length, 0)

  /* ------------------------------- UI ------------------------------------ */
  return (
    <section className='mx-auto max-w-lg'>
      <Card className='relative overflow-hidden shadow-md transition-shadow hover:shadow-xl'>
        {/* Decorative sparkles */}
        <Sparkles
          className='text-primary/10 absolute -top-5 -right-5 h-28 w-28 rotate-12'
          aria-hidden='true'
        />

        <CardHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <KeyRound className='bg-primary/10 text-primary h-10 w-10 flex-shrink-0 rounded-lg p-2' />
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
          {/* Team avatars with HoverCard tooltips */}
          <div className='flex -space-x-3'>
            {displayMembers.map((member) => {
              return (
                <HoverCard key={member.id}>
                  <HoverCardTrigger asChild>
                    <UserAvatar
                      name={member.name}
                      email={member.email}
                      className='ring-background border-background size-10 cursor-pointer rounded-full border-2 shadow'
                    />
                  </HoverCardTrigger>

                  <HoverCardContent className='w-48 text-sm'>
                    {member.name ?? 'Unnamed'}
                    <br />
                    <span className='text-muted-foreground text-xs break-all'>{member.email}</span>
                  </HoverCardContent>
                </HoverCard>
              )
            })}

            {overflow > 0 && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className='border-background bg-primary text-primary-foreground flex size-10 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-medium shadow'>
                    +{overflow}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className='w-48 text-sm'>
                  {overflow} more member{overflow > 1 ? 's' : ''}
                </HoverCardContent>
              </HoverCard>
            )}
          </div>

          <p className='text-sm leading-relaxed'>
            A Decentralised Identifier (DID) acts like a verified username for your company. Once
            created, your team can issue 
            <span className='font-semibold'>signed</span> credentials that employers, clients,
            and platforms can trust instantly.
          </p>

          <CreateDidButton />
        </CardContent>
      </Card>
    </section>
  )
}
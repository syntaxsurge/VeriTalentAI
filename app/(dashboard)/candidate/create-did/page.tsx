import { redirect } from 'next/navigation'
import { eq, sql } from 'drizzle-orm'
import { KeyRound } from 'lucide-react'

import ProfileHeader from '@/components/candidate/profile-header'
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

const MAX_DISPLAY = 5

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

export default async function CreateDIDPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* -------------------------- Resolve membership -------------------------- */
  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  let displayMembers: Member[] = []
  let teamSize = 1 // at least the current user

  if (membership?.teamId) {
    /* Total team size */
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
    teamSize = count

    /* Sample members for avatar row */
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

  /* Ensure current user appears */
  if (!displayMembers.some((m) => m.id === user.id)) {
    displayMembers.unshift({ id: user.id, name: user.name, email: user.email })
    displayMembers = displayMembers.slice(0, MAX_DISPLAY)
  }

  const overflow = Math.max(teamSize - displayMembers.length, 0)

  /* ------------------------------- VIEW ----------------------------------- */
  return (
    <section className='mx-auto max-w-5xl space-y-10'>
      {/* Profile-style header for visual consistency */}
      <ProfileHeader
        name={user.name ?? null}
        email={user.email ?? ''}
        avatarSrc={(user as any)?.image ?? undefined}
      />

      {/* Main card */}
      <Card className='shadow-md transition-shadow hover:shadow-lg'>
        <CardHeader className='flex items-center gap-3 space-y-0'>
          <KeyRound className='text-primary h-10 w-10 flex-shrink-0' />
          <div>
            <CardTitle className='text-2xl font-extrabold tracking-tight'>
              Create your Team&nbsp;DID
            </CardTitle>
            <p className='text-muted-foreground mt-1 text-sm'>
              Unlock verifiable credentials and sign them as a team.
            </p>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Team avatars */}
          <div className='flex -space-x-3'>
            {displayMembers.map((member) => (
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
                  <span className='text-muted-foreground break-all text-xs'>{member.email}</span>
                </HoverCardContent>
              </HoverCard>
            ))}

            {overflow > 0 && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className='border-background bg-muted flex size-10 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-medium text-muted-foreground'>
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
            created, your team can issue <span className='font-semibold'>signed</span> credentials
            that employers, clients, and platforms can trust instantly.
          </p>

          <CreateDidButton />
        </CardContent>
      </Card>
    </section>
  )
}
'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import {
  invitations,
  teamMembers,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema'
import { teams } from '@/lib/db/schema/core'

/* -------------------------------------------------------------------------- */
/*                                  A C C E P T                               */
/* -------------------------------------------------------------------------- */

const acceptSchema = z.object({ invitationId: z.coerce.number() })

const _acceptInvitation = validatedActionWithUser(
  acceptSchema,
  async ({ invitationId }, _formData, user) => {
    const [inv] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.email, user.email),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1)

    if (!inv) return { error: 'Invitation not found or already handled.' }

    await db.transaction(async (tx) => {
      await tx.insert(teamMembers).values({
        userId: user.id,
        teamId: inv.teamId,
        role: inv.role,
      })
      await tx
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, inv.id))

      await tx.insert(activityLogs).values({
        teamId: inv.teamId,
        userId: user.id,
        action: ActivityType.ACCEPT_INVITATION,
      })
    })

    revalidatePath('/invitations')
    return { success: 'Invitation accepted — you are now a team member.' }
  },
)

export const acceptInvitationAction = async (
  ...args: Parameters<typeof _acceptInvitation>
) => {
  'use server'
  return _acceptInvitation(...args)
}

/* -------------------------------------------------------------------------- */
/*                                 D E C L I N E                              */
/* -------------------------------------------------------------------------- */

const declineSchema = z.object({ invitationId: z.coerce.number() })

const _declineInvitation = validatedActionWithUser(
  declineSchema,
  async ({ invitationId }, _formData, user) => {
    const res = await db
      .update(invitations)
      .set({ status: 'declined' })
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.email, user.email),
          eq(invitations.status, 'pending'),
        ),
      )

    if (res.rowCount === 0) return { error: 'Invitation not found or already handled.' }

    revalidatePath('/invitations')
    return { success: 'Invitation declined.' }
  },
)

export const declineInvitationAction = async (
  ...args: Parameters<typeof _declineInvitation>
) => {
  'use server'
  return _declineInvitation(...args)
}

/* -------------------------------------------------------------------------- */
/*                                 D E L E T E                                */
/* -------------------------------------------------------------------------- */

const deleteSchema = z.object({ invitationId: z.coerce.number() })

const _deleteInvitation = validatedActionWithUser(
  deleteSchema,
  async ({ invitationId }, _formData, user) => {
    const res = await db
      .delete(invitations)
      .where(and(eq(invitations.id, invitationId), eq(invitations.email, user.email)))
      .returning({ id: invitations.id })

    if (res.length === 0) return { error: 'Invitation not found or unauthorized.' }

    revalidatePath('/invitations')
    return { success: 'Invitation deleted.' }
  },
)

export const deleteInvitationAction = async (
  ...args: Parameters<typeof _deleteInvitation>
) => {
  'use server'
  return _deleteInvitation(...args)
}
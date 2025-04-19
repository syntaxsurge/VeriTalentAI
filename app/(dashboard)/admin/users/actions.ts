'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema/core'

export const deleteUserAction = validatedActionWithUser(
  z.object({
    userId: z.coerce.number(),
  }),
  async ({ userId }, _, authUser) => {
    if (authUser.role !== 'admin') return { error: 'Unauthorized.' }
    if (authUser.id === userId) return { error: 'You cannot delete your own account.' }

    await db.delete(users).where(eq(users.id, userId))
    return { success: 'User deleted.' }
  },
)
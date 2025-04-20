'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema/core'
import { candidates } from '@/lib/db/schema/viskify'

export const updateCandidateProfile = validatedActionWithUser(
  z.object({
    name: z.string().min(1, 'Name is required').max(100),
    bio: z.string().max(2000).optional().default(''),
  }),
  async (data, _, user) => {
    const { name, bio } = data

    // update user display name
    await db.update(users).set({ name }).where(eq(users.id, user.id))

    // ensure candidate row exists
    let [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (!candidate) {
      await db.insert(candidates).values({ userId: user.id, bio: bio ?? '' })
    } else {
      await db
        .update(candidates)
        .set({ bio: bio ?? '' })
        .where(eq(candidates.id, candidate.id))
    }

    return { success: 'Profile updated successfully.' }
  },
)

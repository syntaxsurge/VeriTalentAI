'use server'

import { eq } from 'drizzle-orm'

import { getUser } from '@/lib/db/queries/queries'
import { db } from '@/lib/db/drizzle'
import { candidates, verifiedCredentials } from '@/lib/db/schema/viskify'

/**
 * Persist a verified (or failed) VC JSON for later copy/paste.
 */
export async function saveVerifiedVc(vcJson: string, verified: boolean): Promise<void> {
  const user = await getUser()
  if (!user) return

  // Ensure candidate row
  let [candidateRow] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!candidateRow) {
    const [newCand] = await db.insert(candidates).values({ userId: user.id, bio: '' }).returning()
    candidateRow = newCand
  }

  await db.insert(verifiedCredentials).values({
    candidateId: candidateRow.id,
    vcJson,
    verified,
  })
}
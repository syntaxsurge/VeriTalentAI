import { eq, desc } from 'drizzle-orm'
import { db } from './drizzle'
import { activityLogs } from './schema/core'

/**
 * Fetch one page of activity logs for the current user.
 *
 * Returns exactly `pageSize` rows (oldest first) plus a `hasNext` boolean
 * so callers can decide whether to show a "Next” link.
 */
export async function getActivityLogsPage(
  userId: number,
  page: number,
  pageSize = 10,
): Promise<{ logs: typeof activityLogs.$inferSelect[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize
  // grab one extra row so we know if another page exists
  const rows = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop() // keep result length == pageSize
  return { logs: rows, hasNext }
}
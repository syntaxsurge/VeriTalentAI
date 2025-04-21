import { eq, asc, desc } from 'drizzle-orm'
import { db } from './drizzle'
import { activityLogs } from './schema/core'

export type ActivityLogRow = typeof activityLogs.$inferSelect

/**
 * Fetch one page of activity logs for a user with server‑side pagination & sorting.
 */
export async function getActivityLogsPage(
  userId: number,
  page: number,
  pageSize = 10,
  sortBy: 'timestamp' | 'action' = 'timestamp',
  order: 'asc' | 'desc' = 'desc',
): Promise<{ logs: ActivityLogRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* Determine ORDER BY column/direction */
  const orderBy =
    sortBy === 'action'
      ? order === 'asc'
        ? asc(activityLogs.action)
        : desc(activityLogs.action)
      : order === 'asc'
        ? asc(activityLogs.timestamp)
        : desc(activityLogs.timestamp)

  /* Grab an extra row to know if another page exists */
  const rows = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { logs: rows, hasNext }
}
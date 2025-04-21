import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getUser } from '@/lib/db/queries/queries'
import { getActivityLogsPage } from '@/lib/db/queries/activity'
import { ActivityType } from '@/lib/db/schema'

import ActivityLogsTable, { RowType } from '@/components/dashboard/settings/activity-logs-table'

export const revalidate = 0

export default async function ActivityPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* --------------------------- Query Params --------------------------- */
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const sizeRaw = Number(searchParams.size ?? 10)
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = (searchParams.sort as string) || 'timestamp'
  const order = (searchParams.order as string) === 'asc' ? 'asc' : 'desc'
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''

  /* ------------------------- Data Fetching --------------------------- */
  const { logs, hasNext } = await getActivityLogsPage(
    user.id,
    page,
    pageSize,
    sort as 'timestamp' | 'action',
    order as 'asc' | 'desc',
    searchQuery,
  )

  const rows: RowType[] = logs.map((log) => ({
    id: log.id,
    type: log.action as ActivityType,
    ipAddress: log.ipAddress,
    timestamp:
      log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
  }))

  /* Build base params excluding "page” for link helpers */
  const initialParams: Record<string, string> = {}
  Object.entries(searchParams).forEach(([k, v]) => {
    if (k !== 'page' && typeof v === 'string' && v.length > 0) initialParams[k] = v
  })

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>Activity Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <ActivityLogsTable
            rows={rows}
            sort={sort}
            order={order as 'asc' | 'desc'}
            basePath='/settings/activity'
            initialParams={initialParams}
            searchQuery={searchQuery}
          />

          <TablePagination
            page={page}
            hasNext={hasNext}
            basePath='/settings/activity'
            initialParams={initialParams}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </section>
  )
}
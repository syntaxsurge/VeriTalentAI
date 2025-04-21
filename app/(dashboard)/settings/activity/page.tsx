import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getUser } from '@/lib/db/queries/queries'
import { getActivityLogsPage } from '@/lib/db/queries/activity'
import { ActivityType } from '@/lib/db/schema'

import ActivityLogsTable, {
  RowType,
} from '@/components/dashboard/settings/activity-logs-table'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>

/** Safely return the first value of a query param. */
function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function ActivityPage({
  searchParams,
}: {
  /** Next 15 passes searchParams as an async object — await it first. */
  searchParams: Promise<Query> | Query
}) {
  /* ---------------------- Resolve dynamic API first ----------------------- */
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))

  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = getParam(params, 'sort') ?? 'timestamp'
  const order = getParam(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(params, 'q') ?? '').trim()

  /* -------------------------- Data fetching ------------------------------ */
  const { logs, hasNext } = await getActivityLogsPage(
    user.id,
    page,
    pageSize,
    sort as 'timestamp' | 'action',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = logs.map((log) => ({
    id: log.id,
    type: log.action as ActivityType,
    ipAddress: log.ipAddress,
    timestamp:
      log.timestamp instanceof Date
        ? log.timestamp.toISOString()
        : String(log.timestamp),
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = getParam(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------ View ----------------------------------- */
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
            searchQuery={searchTerm}
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
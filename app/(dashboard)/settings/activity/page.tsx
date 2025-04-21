import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getActivityLogs, getUser } from '@/lib/db/queries'
import { ActivityType } from '@/lib/db/schema'

import ActivityLogsTable, {
  RowType,
} from '@/components/dashboard/settings/activity-logs-table'

export const revalidate = 0

export default async function ActivityPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const logs = await getActivityLogs()

  const rows: RowType[] = logs.map((log) => ({
    id: log.id,
    type: log.action as ActivityType,
    ipAddress: log.ipAddress,
    timestamp:
      log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
  }))

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>Activity Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <ActivityLogsTable rows={rows} />
        </CardContent>
      </Card>
    </section>
  )
}
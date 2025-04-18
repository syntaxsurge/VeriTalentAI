import { redirect } from 'next/navigation'

import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getActivityLogs, getUser } from '@/lib/db/queries'
import { ActivityType } from '@/lib/db/schema'
import { relativeTime } from '@/lib/utils/time'

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up'
    case ActivityType.SIGN_IN:
      return 'You signed in'
    case ActivityType.SIGN_OUT:
      return 'You signed out'
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password'
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account'
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account'
    case ActivityType.CREATE_TEAM:
      return 'You created a new team'
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member'
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member'
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation'
    default:
      return 'Unknown action occurred'
  }
}

export default async function ActivityPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const logs = await getActivityLogs()

  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>Activity Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>

        <CardContent>
          {logs.length > 0 ? (
            <ul className='space-y-4'>
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings
                const formattedAction = formatAction(log.action as ActivityType)

                return (
                  <li key={log.id} className='flex items-center space-x-4'>
                    <div className='dark:bg-muted rounded-full bg-orange-100 p-2'>
                      <Icon className='dark:text-muted-foreground h-5 w-5 text-orange-500' />
                    </div>

                    <div className='flex-1'>
                      <p className='text-foreground text-sm font-medium'>
                        {formattedAction}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {relativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <AlertCircle className='mb-4 h-12 w-12 text-orange-500' />
              <h3 className='text-foreground mb-2 text-lg font-semibold'>No activity yet</h3>
              <p className='text-muted-foreground max-w-sm text-sm'>
                When you perform actions like signing in or updating your account, they'll appear
                here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

'use client'

import * as React from 'react'
import {
  Settings,
  LogOut,
  UserPlus,
  UserCog,
  Lock,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'

import { ActivityType } from '@/lib/db/schema'
import { relativeTime } from '@/lib/utils/time'
import { DataTable, type Column } from '@/components/ui/tables/data-table'

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                 Row Type                                   */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  type: ActivityType
  ipAddress?: string | null
  timestamp: string
}

/* -------------------------------------------------------------------------- */
/*                               Activity Table                               */
/* -------------------------------------------------------------------------- */

export default function ActivityLogsTable({ rows }: { rows: RowType[] }) {
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        className: 'w-[40px]',
        render: (_v, row) => {
          const Icon = iconMap[row.type] || Settings
          return (
            <div className='dark:bg-muted flex h-8 w-8 items-center justify-center rounded-full bg-orange-100'>
              <Icon className='dark:text-muted-foreground h-4 w-4 text-orange-500' />
            </div>
          )
        },
      },
      {
        key: 'type',
        header: 'Action',
        sortable: false,
        render: (_v, row) => (
          <p className='text-sm'>
            {formatAction(row.type)}
            {row.ipAddress && ` from IP ${row.ipAddress}`}
          </p>
        ),
      },
      {
        key: 'timestamp',
        header: 'When',
        sortable: true,
        className: 'min-w-[120px]',
        render: (v) => (
          <span className='text-xs text-muted-foreground'>
            {relativeTime(new Date(v as string))}
          </span>
        ),
      },
    ]
  }, [])

  /* Show all rows in one client page – real paging is done server‑side */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}
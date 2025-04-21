'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  type LucideProps,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

import {
  DataTable,
  type Column,
  type BulkAction,
} from '@/components/ui/tables/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

import {
  acceptInvitationAction,
  declineInvitationAction,
  deleteInvitationAction,
} from '@/app/(dashboard)/invitations/actions'

/* -------------------------------------------------------------------------- */
/*                              C O L O U R  I C O N S                        */
/* -------------------------------------------------------------------------- */

/** Success-green icon for “Accept” actions. */
const AcceptIcon = (props: LucideProps) => (
  <CheckCircle2
    {...props}
    className='mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400'
  />
)

/** Warning-amber icon for “Decline” actions. */
const DeclineIcon = (props: LucideProps) => (
  <XCircle {...props} className='mr-2 h-4 w-4 text-amber-600 dark:text-amber-400' />
)

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  team: string
  role: string
  inviter: string
  status: string
  invitedAt: Date
}

/* -------------------------------------------------------------------------- */
/*                              Row-level actions                             */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isPendingStatus = row.status === 'pending'

  function runAction(
    fn:
      | typeof acceptInvitationAction
      | typeof declineInvitationAction
      | typeof deleteInvitationAction,
    successMsg: string,
  ) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('invitationId', row.id.toString())
      const res = await fn({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? successMsg)
      }
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0' disabled={isPending}>
          {isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <MoreHorizontal className='h-4 w-4' />
          )}
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        {isPendingStatus && (
          <>
            <DropdownMenuItem
              onClick={() => runAction(acceptInvitationAction, 'Invitation accepted.')}
              disabled={isPending}
            >
              <AcceptIcon />
              Accept
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => runAction(declineInvitationAction, 'Invitation declined.')}
              disabled={isPending}
            >
              <DeclineIcon />
              Decline
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => runAction(deleteInvitationAction, 'Invitation deleted.')}
          disabled={isPending}
          className='font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Columns                                  */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  {
    key: 'team',
    header: 'Team',
    sortable: true,
    render: (v) => <span className='font-medium'>{v as string}</span>,
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    className: 'capitalize',
    render: (v) => (v as string) || '—',
  },
  {
    key: 'inviter',
    header: 'Invited By',
    sortable: true,
    className: 'break-all',
    render: (v) => (v as string) || '—',
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (v) => {
      const s = v as string
      const cls =
        s === 'accepted'
          ? 'text-emerald-600'
          : s === 'pending'
            ? 'text-amber-600'
            : 'text-muted-foreground'
      return <span className={cls}>{s}</span>
    },
  },
  {
    key: 'invitedAt',
    header: 'Invited',
    sortable: true,
    render: (v) => formatDistanceToNow(v as Date, { addSuffix: true }),
  },
  {
    key: 'id',
    header: '',
    enableHiding: false,
    sortable: false,
    render: (_v, row) => <RowActions row={row} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                              Bulk actions                                  */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = useTransition()

  async function runBulk(
    rows: RowType[],
    fn:
      | typeof acceptInvitationAction
      | typeof declineInvitationAction
      | typeof deleteInvitationAction,
    loadingMsg: string,
    successMsg: string,
  ) {
    const toastId = toast.loading(loadingMsg)
    const results = await Promise.all(
      rows.map(async (inv) => {
        const fd = new FormData()
        fd.append('invitationId', inv.id.toString())
        return fn({}, fd)
      }),
    )
    const errors = results.filter((r) => r?.error).map((r) => r!.error)
    if (errors.length) {
      toast.error(errors.join('\n'), { id: toastId })
    } else {
      toast.success(successMsg, { id: toastId })
    }
    router.refresh()
  }

  const canAccept = (rows: RowType[]) =>
    rows.length > 0 &&
    rows.every((r) => r.status === 'pending') &&
    new Set(rows.map((r) => r.role)).size === 1

  const canDecline = (rows: RowType[]) =>
    rows.length > 0 && rows.every((r) => r.status === 'pending')

  return [
    {
      label: 'Accept',
      icon: AcceptIcon as any,
      onClick: (selected) =>
        startTransition(() =>
          runBulk(selected, acceptInvitationAction, 'Accepting…', 'Invitations accepted.'),
        ),
      isAvailable: canAccept,
      isDisabled: (rows) => !canAccept(rows) || isPending,
    },
    {
      label: 'Decline',
      icon: DeclineIcon as any,
      onClick: (selected) =>
        startTransition(() =>
          runBulk(selected, declineInvitationAction, 'Declining…', 'Invitations declined.'),
        ),
      isAvailable: canDecline,
      isDisabled: (rows) => !canDecline(rows) || isPending,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(() =>
          runBulk(selected, deleteInvitationAction, 'Deleting…', 'Invitations deleted.'),
        ),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function InvitationsTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return (
    <DataTable columns={columns} rows={rows} filterKey='team' bulkActions={bulkActions} />
  )
}
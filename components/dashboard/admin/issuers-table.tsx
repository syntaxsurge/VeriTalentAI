'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Loader2,
  ShieldCheck,
  ShieldX,
  XCircle,
  Trash2,
  type LucideProps,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  updateIssuerStatusAction,
  deleteIssuerAction,
} from '@/app/(dashboard)/admin/issuers/actions'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { IssuerStatus } from '@/lib/db/schema/issuer'
import { cn } from '@/lib/utils'

export interface RowType {
  id: number
  name: string
  domain: string
  owner: string
  category: string
  industry: string
  status: string
}

/* -------------------------------------------------------------------------- */
/*                            C O L O R  E D   I C O N S                      */
/* -------------------------------------------------------------------------- */

const VerifyIcon = ({ className, ...props }: LucideProps) => (
  <ShieldCheck
    {...props}
    className={cn('mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400', className)}
  />
)

const UnverifyIcon = ({ className, ...props }: LucideProps) => (
  <ShieldX
    {...props}
    className={cn('mr-2 h-4 w-4 text-amber-600 dark:text-amber-400', className)}
  />
)

const RejectIcon = ({ className, ...props }: LucideProps) => (
  <XCircle
    {...props}
    className={cn('mr-2 h-4 w-4 text-rose-600 dark:text-rose-400', className)}
  />
)

/* -------------------------------------------------------------------------- */
/*                                  Utils                                     */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ACTIVE'
      ? 'text-emerald-600'
      : status === 'PENDING'
        ? 'text-amber-600'
        : 'text-rose-600'
  return <span className={`${cls} capitalize`}>{status.toLowerCase()}</span>
}

/* -------------------------------------------------------------------------- */
/*                               Row Actions                                  */
/* -------------------------------------------------------------------------- */

function RowActions({ id, status }: { id: number; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function mutate(next: keyof typeof IssuerStatus, reason?: string) {
    startTransition(async () => {
      const toastId = toast.loading('Updating issuer…')
      const fd = new FormData()
      fd.append('issuerId', id.toString())
      fd.append('status', next)
      if (reason) fd.append('rejectionReason', reason)
      const res = await updateIssuerStatusAction({}, fd)

      if (res?.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success(res?.success ?? 'Issuer updated.', { id: toastId })
      }
      router.refresh()
    })
  }

  async function destroy() {
    startTransition(async () => {
      const toastId = toast.loading('Deleting issuer…')
      const fd = new FormData()
      fd.append('issuerId', id.toString())
      const res = await deleteIssuerAction({}, fd)

      if (res?.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success(res?.success ?? 'Issuer deleted.', { id: toastId })
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

        {status !== 'ACTIVE' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.ACTIVE)}
            disabled={isPending}
            className='hover:bg-emerald-500/10 focus:bg-emerald-500/10'
          >
            <VerifyIcon />
            Verify
          </DropdownMenuItem>
        )}

        {status === 'ACTIVE' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.PENDING)}
            disabled={isPending}
            className='hover:bg-amber-500/10 focus:bg-amber-500/10'
          >
            <UnverifyIcon />
            Unverify
          </DropdownMenuItem>
        )}

        {status !== 'REJECTED' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.REJECTED, 'Rejected by admin')}
            disabled={isPending}
            className='hover:bg-rose-500/10 focus:bg-rose-500/10'
          >
            <RejectIcon />
            Reject
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={destroy}
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
/*                                Columns                                     */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  {
    key: 'name',
    header: 'Name / Domain',
    sortable: true,
    render: (_v, row) => (
      <div className='min-w-[180px]'>
        <p className='truncate font-medium'>{row.name}</p>
        <p className='truncate text-xs text-muted-foreground'>{row.domain}</p>
      </div>
    ),
  },
  {
    key: 'owner',
    header: 'Owner',
    sortable: true,
    className: 'truncate',
    render: (v) => <span className='break-all'>{(v && String(v).trim()) || '—'}</span>,
  },
  {
    key: 'category',
    header: 'Category',
    sortable: true,
    className: 'capitalize',
    render: (v) => (v as string).replaceAll('_', ' ').toLowerCase(),
  },
  {
    key: 'industry',
    header: 'Industry',
    sortable: true,
    className: 'capitalize',
    render: (v) => (v as string).toLowerCase(),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (v) => <StatusBadge status={v as string} />,
  },
  {
    key: 'id',
    header: '',
    enableHiding: false,
    sortable: false,
    render: (_v, row) => <RowActions id={row.id} status={row.status} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                           Bulk‑Selection Actions                           */
/* -------------------------------------------------------------------------- */

export default function AdminIssuersTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()

  async function bulkUpdate(
    selected: RowType[],
    status: keyof typeof IssuerStatus,
    reason?: string,
  ) {
    const toastId = toast.loading('Updating issuers…')
    const results = await Promise.all(
      selected.map(async (row) => {
        const fd = new FormData()
        fd.append('issuerId', row.id.toString())
        fd.append('status', status)
        if (reason) fd.append('rejectionReason', reason)
        return updateIssuerStatusAction({}, fd)
      }),
    )
    const errors = results.filter((r) => r?.error).map((r) => r!.error)
    if (errors.length) {
      toast.error(errors.join('\n'), { id: toastId })
    } else {
      toast.success('Issuers updated.', { id: toastId })
    }
    router.refresh()
  }

  async function bulkDelete(selected: RowType[]) {
    const toastId = toast.loading('Deleting issuers…')
    const results = await Promise.all(
      selected.map(async (row) => {
        const fd = new FormData()
        fd.append('issuerId', row.id.toString())
        return deleteIssuerAction({}, fd)
      }),
    )
    const errors = results.filter((r) => r?.error).map((r) => r!.error)
    if (errors.length) {
      toast.error(errors.join('\n'), { id: toastId })
    } else {
      toast.success('Issuers deleted.', { id: toastId })
    }
    router.refresh()
  }

  const bulkActions: BulkAction<RowType>[] = [
    {
      label: 'Verify',
      icon: VerifyIcon as any,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.ACTIVE),
    },
    {
      label: 'Unverify',
      icon: UnverifyIcon as any,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.PENDING),
    },
    {
      label: 'Reject',
      icon: RejectIcon as any,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.REJECTED, 'Bulk reject'),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: bulkDelete,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='name'
      bulkActions={bulkActions}
    />
  )
}
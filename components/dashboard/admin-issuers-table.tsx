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
} from 'lucide-react'

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
/*                               H E L P E R S                                */
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

/* ------------------------------ Row actions ------------------------------- */

function RowActions({ id, status }: { id: number; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function mutate(next: keyof typeof IssuerStatus, reason?: string) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('issuerId', id.toString())
      fd.append('status', next)
      if (reason) fd.append('rejectionReason', reason)
      await updateIssuerStatusAction({}, fd)
      router.refresh()
    })
  }

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('issuerId', id.toString())
      await deleteIssuerAction({}, fd)
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
            <ShieldCheck className='mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400' />
            Verify
          </DropdownMenuItem>
        )}

        {status === 'ACTIVE' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.PENDING)}
            disabled={isPending}
            className='hover:bg-amber-500/10 focus:bg-amber-500/10'
          >
            <ShieldX className='mr-2 h-4 w-4 text-amber-600 dark:text-amber-400' />
            Unverify
          </DropdownMenuItem>
        )}

        {status !== 'REJECTED' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.REJECTED, 'Rejected by admin')}
            disabled={isPending}
            className='hover:bg-rose-500/10 focus:bg-rose-500/10'
          >
            <XCircle className='mr-2 h-4 w-4 text-rose-600 dark:text-rose-400' />
            Reject
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={destroy}
          disabled={isPending}
          className='text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-500/10 focus:bg-rose-500/10'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ------------------------------ Columns ----------------------------------- */

const columns: Column<RowType>[] = [
  {
    key: 'name',
    header: 'Name / Domain',
    sortable: true,
    render: (_v, row) => (
      <div>
        {row.name}
        <div className='text-muted-foreground text-xs'>{row.domain}</div>
      </div>
    ),
  },
  { key: 'owner', header: 'Owner', sortable: true },
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
/*                       B U L K   A C T I O N S                              */
/* -------------------------------------------------------------------------- */

export default function AdminIssuersTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function bulkUpdate(
    selected: RowType[],
    status: keyof typeof IssuerStatus,
    reason?: string,
  ) {
    startTransition(async () => {
      await Promise.all(
        selected.map(async (row) => {
          const fd = new FormData()
          fd.append('issuerId', row.id.toString())
          fd.append('status', status)
          if (reason) fd.append('rejectionReason', reason)
          await updateIssuerStatusAction({}, fd)
        }),
      )
      router.refresh()
    })
  }

  async function bulkDelete(selected: RowType[]) {
    startTransition(async () => {
      await Promise.all(
        selected.map(async (row) => {
          const fd = new FormData()
          fd.append('issuerId', row.id.toString())
          await deleteIssuerAction({}, fd)
        }),
      )
      router.refresh()
    })
  }

  const bulkActions: BulkAction<RowType>[] = [
    {
      label: 'Verify',
      icon: ShieldCheck,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.ACTIVE),
    },
    {
      label: 'Unverify',
      icon: ShieldX,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.PENDING),
    },
    {
      label: 'Reject',
      icon: XCircle,
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
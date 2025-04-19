'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Trash2,
  Loader2,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { deleteUserAction } from '@/app/(dashboard)/admin/users/actions'

export interface RowType {
  id: number
  email: string
  role: string
  createdAt: Date
}

/* -------------------------------------------------------------------------- */
/*                                   Utils                                    */
/* -------------------------------------------------------------------------- */

function formatDateTime(d: Date) {
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/* -------------------------------------------------------------------------- */
/*                             Row‑level actions                              */
/* -------------------------------------------------------------------------- */

function RowActions({ id }: { id: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('userId', id.toString())
      await deleteUserAction({}, fd)
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

        {/* Future‑proof: add more row‑level actions here, e.g. “Edit User” */}

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

/* -------------------------------------------------------------------------- */
/*                                 Columns                                    */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  {
    key: 'email',
    header: 'Email',
    sortable: true,
    render: (v) => v as string,
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    className: 'capitalize',
    render: (v) => v as string,
  },
  {
    key: 'createdAt',
    header: 'Joined',
    sortable: true,
    render: (v) => formatDateTime(v as Date),
  },
  {
    key: 'id',
    header: '',
    enableHiding: false,
    sortable: false,
    render: (_v, row) => <RowActions id={row.id} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                                 Bulk                                       */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = useTransition()

  return [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          await Promise.all(
            selected.map(async (u) => {
              const fd = new FormData()
              fd.append('userId', u.id.toString())
              await deleteUserAction({}, fd)
            }),
          )
          router.refresh()
        }),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                  View                                      */
/* -------------------------------------------------------------------------- */

export default function AdminUsersTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='email'
      bulkActions={bulkActions}
    />
  )
}
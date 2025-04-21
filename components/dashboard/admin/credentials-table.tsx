'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { deleteCredentialAction } from '@/app/(dashboard)/admin/credentials/actions'

export interface RowType {
  id: number
  title: string
  candidate: string
  issuer: string | null
  status: string
}

/* -------------------------------------------------------------------------- */
/*                              Row-level actions                             */
/* -------------------------------------------------------------------------- */

function RowActions({ id }: { id: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('credentialId', id.toString())
      const res = await deleteCredentialAction({}, fd)

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Credential deleted.')
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
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={destroy}
          disabled={isPending}
          className='cursor-pointer font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
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
    key: 'title',
    header: 'Title',
    sortable: true,
    render: (v) => (v ? (v as string) : '—'),
  },
  {
    key: 'candidate',
    header: 'Candidate',
    sortable: true,
    render: (v) => (v ? (v as string) : '—'),
  },
  {
    key: 'issuer',
    header: 'Issuer',
    sortable: true,
    render: (v) => (v as string | null) || '—',
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    className: 'capitalize',
    render: (v) => {
      const s = v as string
      const cls =
        s === 'VERIFIED'
          ? 'text-emerald-600'
          : s === 'PENDING'
            ? 'text-amber-600'
            : s === 'REJECTED'
              ? 'text-rose-600'
              : 'text-muted-foreground'
      return <span className={cls}>{s.toLowerCase()}</span>
    },
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
/*                                 Bulk actions                               */
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
          const results = await Promise.all(
            selected.map(async (cred) => {
              const fd = new FormData()
              fd.append('credentialId', cred.id.toString())
              return deleteCredentialAction({}, fd)
            }),
          )
          const errors = results.filter((r) => r?.error).map((r) => r!.error)
          if (errors.length) {
            toast.error(errors.join('\n'))
          } else {
            toast.success('Selected credentials deleted.')
          }
          router.refresh()
        }),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function AdminCredentialsTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return (
    <DataTable columns={columns} rows={rows} filterKey='title' bulkActions={bulkActions} />
  )
}
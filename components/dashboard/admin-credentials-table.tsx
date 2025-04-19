'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Trash2,
  Loader2,
} from 'lucide-react'

import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { deleteCredentialAction } from '@/app/(dashboard)/admin/credentials/actions'

export interface RowType {
  id: number
  title: string
  candidate: string
  issuer: string | null
  status: string
}

/* -------------------------------------------------------------------------- */
/*                            Row‑level actions                               */
/* -------------------------------------------------------------------------- */

function RowActions({ id }: { id: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('credentialId', id.toString())
      await deleteCredentialAction({}, fd)
      router.refresh()
    })
  }

  return (
    <button
      className='flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-50'
      onClick={destroy}
      disabled={isPending}
      title='Delete credential'
    >
      {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <MoreHorizontal className='h-4 w-4' />}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Columns                                  */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  { key: 'title', header: 'Title', sortable: true },
  { key: 'candidate', header: 'Candidate', sortable: true },
  {
    key: 'issuer',
    header: 'Issuer',
    sortable: true,
    render: (v) => v || '—',
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
          : 'text-rose-600'
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
          await Promise.all(
            selected.map(async (cred) => {
              const fd = new FormData()
              fd.append('credentialId', cred.id.toString())
              await deleteCredentialAction({}, fd)
            }),
          )
          router.refresh()
        }),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                  View                                      */
/* -------------------------------------------------------------------------- */

export default function AdminCredentialsTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='title'
      bulkActions={bulkActions}
    />
  )
}
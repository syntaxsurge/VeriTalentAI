'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { FileSignature, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { rejectCredentialAction } from '@/app/(dashboard)/issuer/credentials/actions'
import { CredentialStatus } from '@/lib/db/schema/viskify'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  title: string
  type: string
  candidate: string
  status: CredentialStatus
}

/* -------------------------------------------------------------------------- */
/*                                 Icons                                      */
/* -------------------------------------------------------------------------- */

const RejectIcon = (props: any) => (
  <XCircle {...props} className='mr-2 h-4 w-4 text-rose-600 dark:text-rose-400' />
)

/* -------------------------------------------------------------------------- */
/*                              Row‑level link                                */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  return (
    <Link
      href={`/issuer/credentials/${row.id}`}
      className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-muted hover:text-foreground'
    >
      <FileSignature className='h-4 w-4' />
      <span className='hidden sm:inline'>Review&nbsp;&amp;&nbsp;Sign</span>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Columns                                  */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  { key: 'title', header: 'Title', sortable: true, render: (v) => v as string },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    className: 'capitalize',
    render: (v) => v as string,
  },
  { key: 'candidate', header: 'Candidate', sortable: true, render: (v) => v as string },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    className: 'capitalize',
    render: (v) => {
      const s = v as CredentialStatus
      const cls =
        s === CredentialStatus.VERIFIED
          ? 'text-emerald-600'
          : s === CredentialStatus.PENDING
            ? 'text-amber-600'
            : s === CredentialStatus.REJECTED
              ? 'text-rose-600'
              : 'text-muted-foreground'
      return <span className={cls}>{s}</span>
    },
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
/*                               Bulk actions                                 */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = useTransition()

  async function bulkReject(rows: RowType[]) {
    const toastId = toast.loading('Rejecting…')
    const results = await Promise.all(
      rows.map(async (cred) => {
        const fd = new FormData()
        fd.append('credentialId', cred.id.toString())
        return rejectCredentialAction({}, fd)
      }),
    )
    const errors = results.filter((r) => r?.error).map((r) => r!.error)
    if (errors.length) {
      toast.error(errors.join('\n'), { id: toastId })
    } else {
      toast.success('Credentials rejected.', { id: toastId })
    }
    router.refresh()
  }

  return [
    {
      label: 'Reject',
      icon: RejectIcon as any,
      variant: 'destructive',
      onClick: (selected) => startTransition(() => bulkReject(selected)),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                    View                                    */
/* -------------------------------------------------------------------------- */

export default function IssuerRequestsTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return <DataTable columns={columns} rows={rows} filterKey='title' bulkActions={bulkActions} />
}
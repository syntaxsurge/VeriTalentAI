'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideProps,
} from 'lucide-react'
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
import {
  approveCredentialAction,
  rejectCredentialAction,
} from '@/app/(dashboard)/issuer/credentials/actions'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  title: string
  type: string
  candidate: string
  status: string
}

/* -------------------------------------------------------------------------- */
/*                                 Icons                                      */
/* -------------------------------------------------------------------------- */

const ApproveIcon = (props: LucideProps) => (
  <CheckCircle2 {...props} className='mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400' />
)

const RejectIcon = (props: LucideProps) => (
  <XCircle {...props} className='mr-2 h-4 w-4 text-rose-600 dark:text-rose-400' />
)

/* -------------------------------------------------------------------------- */
/*                              Row‑level actions                             */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function runAction(
    fn: typeof approveCredentialAction | typeof rejectCredentialAction,
    successMsg: string,
  ) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('credentialId', row.id.toString())
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

        <DropdownMenuItem asChild>
          <Link
            href={`/issuer/credentials/${row.id}`}
            className='flex cursor-pointer items-center'
          >
            <ApproveIcon />
            Review &amp; Sign
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => runAction(approveCredentialAction, 'Credential approved.')}
          disabled={isPending}
          className='cursor-pointer hover:bg-emerald-500/10 focus:bg-emerald-500/10'
        >
          <ApproveIcon />
          Approve
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => runAction(rejectCredentialAction, 'Credential rejected.')}
          disabled={isPending}
          className='cursor-pointer font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
        >
          <RejectIcon />
          Reject
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
    render: (v) => v as string,
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    className: 'capitalize',
    render: (v) => v as string,
  },
  {
    key: 'candidate',
    header: 'Candidate',
    sortable: true,
    render: (v) => v as string,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    className: 'capitalize',
    render: (v) => (
      <span className='text-amber-600'>{(v as string).toLowerCase()}</span>
    ),
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

  async function runBulk(
    rows: RowType[],
    fn: typeof approveCredentialAction | typeof rejectCredentialAction,
    loadingMsg: string,
    successMsg: string,
  ) {
    const toastId = toast.loading(loadingMsg)
    const results = await Promise.all(
      rows.map(async (cred) => {
        const fd = new FormData()
        fd.append('credentialId', cred.id.toString())
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

  return [
    {
      label: 'Approve',
      icon: ApproveIcon as any,
      onClick: (selected) =>
        startTransition(() =>
          runBulk(selected, approveCredentialAction, 'Approving…', 'Credentials approved.'),
        ),
      isDisabled: () => isPending,
    },
    {
      label: 'Reject',
      icon: RejectIcon as any,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(() =>
          runBulk(selected, rejectCredentialAction, 'Rejecting…', 'Credentials rejected.'),
        ),
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
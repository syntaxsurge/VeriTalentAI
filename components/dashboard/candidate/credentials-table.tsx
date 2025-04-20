'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader2, FileText, type LucideProps } from 'lucide-react'
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
import { deleteCredentialAction } from '@/app/(dashboard)/candidate/credentials/actions'

export interface RowType {
  id: number
  title: string
  type: string
  issuer: string | null
  status: string
  fileUrl: string | null
}

/* -------------------------------------------------------------------------- */
/*                                   ICONS                                    */
/* -------------------------------------------------------------------------- */

const ViewIcon = (props: LucideProps) => (
  <FileText {...props} className='mr-2 h-4 w-4 text-sky-600 dark:text-sky-400' />
)

/* -------------------------------------------------------------------------- */
/*                               Row actions                                  */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('credentialId', row.id.toString())
      const res = await deleteCredentialAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Credential deleted.')
        router.refresh()
      }
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

        {row.fileUrl && (
          <DropdownMenuItem asChild>
            <a
              href={row.fileUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='flex cursor-pointer items-center'
            >
              <ViewIcon />
              View file
            </a>
          </DropdownMenuItem>
        )}

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
/*                                  Columns                                   */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  { key: 'title', header: 'Title', sortable: true, render: (v) => v as string },
  { key: 'type', header: 'Type', sortable: true, className: 'capitalize', render: (v) => v as string },
  { key: 'issuer', header: 'Issuer', sortable: true, render: (v) => (v as string | null) || '—' },
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
    render: (_v, row) => <RowActions row={row} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                               Bulk actions                                 */
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
          const toastId = toast.loading('Deleting credentials…')
          await Promise.all(
            selected.map(async (cred) => {
              const fd = new FormData()
              fd.append('credentialId', cred.id.toString())
              return deleteCredentialAction({}, fd)
            }),
          )
          toast.success('Selected credentials deleted.', { id: toastId })
          router.refresh()
        }),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function CandidateCredentialsTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)
  return <DataTable columns={columns} rows={rows} filterKey='title' bulkActions={bulkActions} />
}
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Trash2, FileText, Clipboard, Search } from 'lucide-react'
import SearchTelegramModal from './search-telegram-modal'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { TableRowActions, type TableRowAction } from '@/components/ui/tables/row-actions'
import { deleteCredentialAction } from '@/lib/actions/delete'
import { useBulkActions } from '@/lib/hooks/use-bulk-actions'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { TableProps, CandidateCredentialRow } from '@/lib/types/tables'
import { copyToClipboard } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                        Candidate Credentials Table                         */
/* -------------------------------------------------------------------------- */

export default function CandidateCredentialsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
  veridaConnected = false,
}: TableProps<CandidateCredentialRow> & { veridaConnected?: boolean }) {
  const router = useRouter()
  /* ---------------------- Verida search modal state ---------------------- */
  const [searchOpen, setSearchOpen] = React.useState(false)

  /* ------------------------ Bulk-selection actions ----------------------- */
  const bulkActions = useBulkActions<CandidateCredentialRow>([
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      handler: async (selected) => {
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
      },
    },
  ])

  /* -------------------- Centralised navigation helpers ------------------ */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* --------------------------- Row actions ------------------------------ */
  const makeActions = React.useCallback(
    (row: CandidateCredentialRow): TableRowAction<CandidateCredentialRow>[] => {
      const actions: TableRowAction<CandidateCredentialRow>[] = []

      /* Search Verida ---------------------------------------------------- */
      if (veridaConnected) {
        actions.push({
          label: 'Search My Verida Data',
          icon: Search,
          onClick: () => setSearchOpen(true),
        })
      }

      /* View original file ------------------------------------------------ */
      if (row.fileUrl) {
        actions.push({
          label: 'View file',
          icon: FileText,
          href: row.fileUrl,
        })
      }

      /* Copy raw VC JSON -------------------------------------------------- */
      if (row.vcJson) {
        actions.push({
          label: 'Copy VC JSON',
          icon: Clipboard,
          onClick: () => copyToClipboard(row.vcJson!),
        })
      }

      /* Delete (single) --------------------------------------------------- */
      actions.push({
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        onClick: async () => {
          const fd = new FormData()
          fd.append('credentialId', row.id.toString())
          const res = await deleteCredentialAction({}, fd)
          res?.error ? toast.error(res.error) : toast.success(res?.success ?? 'Credential deleted.')
          router.refresh()
        },
      })

      return actions
    },
    [router],
  )

  /* ------------------------------- Columns ------------------------------ */
  const columns = React.useMemo<Column<CandidateCredentialRow>[]>(() => {
    return [
      {
        key: 'title',
        header: sortableHeader('Title', 'title'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'category',
        header: sortableHeader('Category', 'category'),
        sortable: false,
        className: 'capitalize',
        render: (v) => v as string,
      },
      {
        key: 'type',
        header: sortableHeader('Type', 'type'),
        sortable: false,
        className: 'capitalize',
        render: (v) => v as string,
      },
      {
        key: 'issuer',
        header: sortableHeader('Issuer', 'issuer'),
        sortable: false,
        render: (v) => (v as string | null) || '—',
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => <StatusBadge status={String(v)} />,
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <TableRowActions row={row} actions={makeActions(row)} />,
      },
    ]
  }, [sortableHeader, makeActions])

  /* ------------------------------ Render ------------------------------- */
  return (
    <>
      <SearchTelegramModal open={searchOpen} onOpenChange={setSearchOpen} />
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='title'
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      /* Disable client-side pagination – handled by server TablePagination */
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
    </>
  )
}
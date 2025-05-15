'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Trash2, FileText, Clipboard, Search, Send } from 'lucide-react'
import { toast } from 'sonner'

import { submitCredentialForReview } from '@/app/(dashboard)/candidate/credentials/actions'
import IssuerSelect from '@/components/issuer-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { TableRowActions, type TableRowAction } from '@/components/ui/tables/row-actions'
import { deleteCredentialAction } from '@/lib/actions/delete'
import { useBulkActions } from '@/lib/hooks/use-bulk-actions'
import { useDisclosure } from '@/lib/hooks/use-disclosure'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { TableProps, CandidateCredentialRow } from '@/lib/types/tables'
import { copyToClipboard } from '@/lib/utils'

import SearchTelegramModal from './search-telegram-modal'

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
  const { isOpen: searchOpen, open: openSearch, onOpenChange: setSearchOpen } = useDisclosure()

  /* -------------------- Submit-for-review modal state -------------------- */
  const { isOpen: submitOpen, open: openSubmit, onOpenChange: setSubmitOpen } = useDisclosure()
  const [currentCredId, setCurrentCredId] = React.useState<number | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

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

  /* ---------------------- Submit-for-review handler ---------------------- */
  async function handleSubmitForReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!currentCredId) return
    const fd = new FormData(e.currentTarget)
    fd.append('credentialId', currentCredId.toString())

    setSubmitting(true)
    const toastId = toast.loading('Submitting for review…')
    try {
      const res = await submitCredentialForReview({}, fd)
      if (res?.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success(res?.success ?? 'Credential submitted.', { id: toastId })
        setSubmitOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  /* --------------------------- Row actions ------------------------------ */
  const makeActions = React.useCallback(
    (row: CandidateCredentialRow): TableRowAction<CandidateCredentialRow>[] => {
      const actions: TableRowAction<CandidateCredentialRow>[] = []

      /* Search Verida ---------------------------------------------------- */
      if (veridaConnected) {
        actions.push({
          label: 'Search My Private Data',
          icon: Search,
          onClick: () => openSearch(),
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

      /* Submit for review (only when unverified) ------------------------- */
      if (row.status === 'unverified') {
        actions.push({
          label: 'Submit for Review',
          icon: Send,
          onClick: () => {
            setCurrentCredId(row.id)
            openSubmit()
          },
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
    [router, veridaConnected],
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
      {/* Verida search modal */}
      <SearchTelegramModal open={searchOpen} onOpenChange={setSearchOpen} scope='all' />

      {/* Submit-for-review modal */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Select Issuer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitForReview} className='space-y-6'>
            <IssuerSelect />
            <DialogFooter>
              <Button type='submit' disabled={submitting} className='w-full'>
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials table */}
      <DataTable
        columns={columns}
        rows={rows}
        filterKey='title'
        filterValue={search}
        onFilterChange={handleSearchChange}
        bulkActions={bulkActions}
        pageSize={rows.length}
        pageSizeOptions={[rows.length]}
        hidePagination
      />
    </>
  )
}

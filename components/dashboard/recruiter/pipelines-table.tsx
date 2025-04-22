'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

import { deletePipelineAction } from '@/app/(dashboard)/recruiter/pipelines/actions'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  name: string
  description: string | null
  createdAt: string
}

interface PipelinesTableProps {
  rows: RowType[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function buildLink(
  basePath: string,
  init: Record<string, string>,
  overrides: Record<string, any>,
) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  Array.from(sp.entries()).forEach(([k, v]) => {
    if (v === '') sp.delete(k)
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/* -------------------------------------------------------------------------- */
/*                            Bulk delete helper                              */
/* -------------------------------------------------------------------------- */

function makeBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = React.useTransition()

  return [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          const toastId = toast.loading('Deleting pipelines…')
          await Promise.all(
            selected.map(async (p) => {
              const fd = new FormData()
              fd.append('pipelineId', p.id.toString())
              return deletePipelineAction({}, fd)
            }),
          )
          toast.success('Selected pipelines deleted.', { id: toastId })
          router.refresh()
        }),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function PipelinesTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: PipelinesTableProps) {
  const router = useRouter()
  const bulkActions = makeBulkActions(router)

  /* --------------------------- Search (server) --------------------------- */
  const [search, setSearch] = React.useState(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { q: value, page: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* ----------------------------- Sorting --------------------------------- */
  function sortableHeader(label: string, key: string) {
    const nextOrder = sort === key && order === 'asc' ? 'desc' : 'asc'
    const href = buildLink(basePath, initialParams, {
      sort: key,
      order: nextOrder,
      page: 1,
      q: search,
    })
    return (
      <Link href={href} scroll={false} className="flex items-center gap-1">
        {label} <ArrowUpDown className="h-4 w-4" />
      </Link>
    )
  }

  /* ----------------------------- Columns --------------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v) => <span className="font-medium">{v as string}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        render: (v) => (
          <span className="line-clamp-2 max-w-[480px]">{(v as string) || '—'}</span>
        ),
      },
      {
        key: 'createdAt',
        header: sortableHeader('Created', 'createdAt'),
        sortable: false,
        render: (v) =>
          formatDistanceToNow(new Date(v as string), { addSuffix: true }),
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => (
          <Link href={`/recruiter/pipelines/${row.id}`} className="text-primary underline">
            Open&nbsp;Board
          </Link>
        ),
      },
    ]
  }, [sort, order, basePath, initialParams, search])

  /* ------------------------------- View ---------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey="name"
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}
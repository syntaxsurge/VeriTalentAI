'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  FileText,
} from 'lucide-react'

import { DataTable, type Column } from '@/components/ui/tables/data-table'

import { CredentialStatus } from '@/lib/db/schema/viskify'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  title: string
  issuer: string | null
  status: CredentialStatus
  fileUrl: string | null
}

interface CredentialsTableProps {
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
  Array.from(sp.entries()).forEach(([k, v]) => !v && sp.delete(k))
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

function statusBadge(status: CredentialStatus) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
  switch (status) {
    case 'verified':
      return (
        <span className={`${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`}>
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </span>
      )
    case 'pending':
      return (
        <span className={`${base} bg-amber-500/10 text-amber-700 dark:text-amber-400`}>
          <Clock className="h-3 w-3" />
          Pending
        </span>
      )
    case 'rejected':
      return (
        <span className={`${base} bg-rose-500/10 text-rose-700 dark:text-rose-400`}>
          <XCircle className="h-3 w-3" />
          Rejected
        </span>
      )
    default:
      return (
        <span className={`${base} bg-muted text-muted-foreground`}>
          <HelpCircle className="h-3 w-3" />
          Unverified
        </span>
      )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function CredentialsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: CredentialsTableProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  /* --------------------------- Server search ---------------------------- */
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { q: value, page: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* ----------------------------- Sorting -------------------------------- */
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

  /* ----------------------------- Columns -------------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(
    () => [
      {
        key: 'title',
        header: sortableHeader('Title', 'title'),
        sortable: false,
        render: (v) => <span className="font-medium">{v as string}</span>,
      },
      {
        key: 'issuer',
        header: sortableHeader('Issuer', 'issuer'),
        sortable: false,
        render: (v) => (v as string) || '—',
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => statusBadge(v as CredentialStatus),
      },
      {
        key: 'fileUrl',
        header: 'File',
        enableHiding: false,
        sortable: false,
        render: (v) =>
          v ? (
            <a
              href={v as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline"
            >
              <FileText className="h-4 w-4" />
              View
            </a>
          ) : (
            '—'
          ),
      },
    ],
    [sort, order, basePath, initialParams, search],
  )

  /* ------------------------------- View ---------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey="title"
      filterValue={search}
      onFilterChange={handleSearchChange}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}
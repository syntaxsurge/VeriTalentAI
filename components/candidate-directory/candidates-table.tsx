'use client'

import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { UserAvatar } from '@/components/ui/user-avatar'
import { VeridaWalletBadge } from '@/components/ui/verida-wallet-badge'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import { useVeridaStatus } from '@/lib/hooks/use-verida-status'
import type { TableProps, CandidateDirectoryRow } from '@/lib/types/tables'

/* -------------------------------------------------------------------------- */
/*                         W A L L E T   C E L L                              */
/* -------------------------------------------------------------------------- */

function WalletBadgeCell({ userId }: { userId: number }) {
  /* Lazy-fetch the status for this user */
  const { connected } = useVeridaStatus(userId, true)
  return <VeridaWalletBadge connected={connected} userId={userId} />
}

/* -------------------------------------------------------------------------- */
/*                             T A B L E   V I E W                            */
/* -------------------------------------------------------------------------- */

export default function CandidatesTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<CandidateDirectoryRow>) {
  /* Centralised navigation helpers */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* Column definitions */
  const columns = React.useMemo<Column<CandidateDirectoryRow>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v: unknown, row: CandidateDirectoryRow) => (
          <div className='flex items-center gap-2'>
            <UserAvatar name={row.name} email={row.email} className='size-7' />
            <span className='font-medium'>{v || 'Unnamed'}</span>
          </div>
        ),
      },
      {
        key: 'email',
        header: sortableHeader('Email', 'email'),
        sortable: false,
        render: (v: unknown, _row: CandidateDirectoryRow) => v as React.ReactNode,
        className: 'break-all',
      },
      {
        key: 'verida', // virtual column – value comes from render only
        header: 'Verida',
        sortable: false,
        enableHiding: false,
        render: (_v: unknown, row: CandidateDirectoryRow) => (
          <WalletBadgeCell userId={(row as any).userId ?? row.id} />
        ),
        className: 'text-center',
      },
      {
        key: 'verified',
        header: sortableHeader('Verified', 'verified'),
        sortable: false,
        render: (v: unknown, _row: CandidateDirectoryRow) =>
          ((v as number) > 0 ? v : '—') as React.ReactNode,
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v: unknown, row: CandidateDirectoryRow) => (
          <Button asChild variant='link' size='sm' className='text-primary'>
            <Link href={`/candidates/${row.id}`}>View Profile</Link>
          </Button>
        ),
      },
    ]
  }, [sortableHeader])

  /* Render */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='name'
      filterValue={search}
      onFilterChange={handleSearchChange}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}
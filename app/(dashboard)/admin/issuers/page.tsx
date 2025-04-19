import { redirect } from 'next/navigation'
import { asc, desc, ilike, eq, sql } from 'drizzle-orm'

import IssuerStatusButtons from '@/components/dashboard/issuer-status-buttons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTable, Column } from '@/components/ui/data-table'
import { TablePagination } from '@/components/ui/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'
import { issuers as issuersTable, IssuerStatus } from '@/lib/db/schema/issuer'

export const revalidate = 0

const PAGE_SIZE = 20
const SORTABLE = {
  name: issuersTable.name,
  owner: usersTable.name,
  category: issuersTable.category,
  industry: issuersTable.industry,
  status: issuersTable.status,
  created: issuersTable.createdAt,
} as const

type SortKey = keyof typeof SORTABLE

export default async function AdminIssuersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>
}) {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  const q = (searchParams?.q as string) ?? ''
  const sort: SortKey = (searchParams?.sort as SortKey) in SORTABLE ? ((searchParams?.sort as SortKey) || 'created') : 'created'
  const dir: 'asc' | 'desc' = (searchParams?.dir as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, parseInt((searchParams?.page as string) ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const base = db
    .select({ issuer: issuersTable, owner: usersTable })
    .from(issuersTable)
    .leftJoin(usersTable, eq(issuersTable.ownerUserId, usersTable.id))

  const searchCond = q
    ? ilike(sql`${issuersTable.name} || ' ' || ${issuersTable.domain} || ' ' || ${usersTable.name} || ' ' || ${usersTable.email}`, `%${q}%`)
    : undefined

  const rows = await base
    .where(searchCond ? searchCond : undefined)
    .orderBy(dir === 'asc' ? asc(SORTABLE[sort]) : desc(SORTABLE[sort]))
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  const hasNext = rows.length > PAGE_SIZE
  const data = rows.slice(0, PAGE_SIZE)

  const buildLink = (params: Record<string, any>) => {
    const sp = new URLSearchParams({ q, sort, dir, page: page.toString(), ...params })
    return `?${sp.toString()}`
  }

  interface RowType {
    id: number
    name: string
    domain: string
    owner: string
    category: string
    industry: string
    status: string
  }

  const tableRows: RowType[] = data.map(({ issuer, owner }) => ({
    id: issuer.id,
    name: issuer.name,
    domain: issuer.domain,
    owner: owner?.name || owner?.email || '—',
    category: issuer.category,
    industry: issuer.industry,
    status: issuer.status,
  }))

  const columns: Column<RowType>[] = [
    {
      key: 'name',
      header: 'Name / Domain',
      sortable: true,
      render: (_v, row) => (
        <div>
          {row.name}
          <div className='text-muted-foreground text-xs'>{row.domain}</div>
        </div>
      ),
    },
    { key: 'owner', header: 'Owner', sortable: true },
    { key: 'category', header: 'Category', sortable: true, className: 'capitalize', render: (v) => (v as string).replaceAll('_', ' ').toLowerCase() },
    { key: 'industry', header: 'Industry', sortable: true, className: 'capitalize', render: (v) => (v as string).toLowerCase() },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'capitalize',
      render: (v) => (
        <span
          className={
            v === IssuerStatus.ACTIVE ? 'text-emerald-600' : v === IssuerStatus.PENDING ? 'text-amber-600' : 'text-rose-600'
          }
        >
          {(v as string).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (_v, row) => <IssuerStatusButtons issuerId={row.id} status={row.status} />,
    },
  ]

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>Issuer Management</h2>

      <form method='GET' className='flex max-w-xs gap-2'>
        <Input id='q' name='q' placeholder='Search name / owner…' defaultValue={q} className='h-9' />
        <Button size='sm' type='submit'>Search</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>All Issuers</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <DataTable columns={columns} rows={tableRows} sort={sort} dir={dir} buildLink={buildLink} />
        </CardContent>
      </Card>

      <TablePagination page={page} hasNext={hasNext} buildLink={buildLink} />
    </section>
  )
}
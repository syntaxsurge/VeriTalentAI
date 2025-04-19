import { redirect } from 'next/navigation'
import { asc, desc, ilike, eq, sql } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTable, Column } from '@/components/ui/data-table'
import { TablePagination } from '@/components/ui/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'

export const revalidate = 0

/* -------------------------------- config -------------------------------- */
const PAGE_SIZE = 20
const SORTABLE = {
  name: usersTable.name,
  email: usersTable.email,
  role: usersTable.role,
  created: usersTable.createdAt,
} as const

type SortKey = keyof typeof SORTABLE

/* -------------------------------- page ---------------------------------- */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>
}) {
  /* auth */
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* query params */
  const q = (searchParams?.q as string) ?? ''
  const sort: SortKey = (searchParams?.sort as SortKey) in SORTABLE ? ((searchParams?.sort as SortKey) || 'created') : 'created'
  const dir: 'asc' | 'desc' = (searchParams?.dir as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, parseInt((searchParams?.page as string) ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  /* where */
  const conditions = q ? ilike(sql`${usersTable.name} || ' ' || ${usersTable.email}`, `%${q}%`) : undefined

  /* query */
  const rows = await db
    .select()
    .from(usersTable)
    .where(conditions ? conditions : undefined)
    .orderBy(dir === 'asc' ? asc(SORTABLE[sort]) : desc(SORTABLE[sort]))
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  const hasNext = rows.length > PAGE_SIZE
  const users = rows.slice(0, PAGE_SIZE)

  /* helpers */
  const buildLink = (params: Record<string, any>) => {
    const sp = new URLSearchParams({ q, sort, dir, page: page.toString(), ...params })
    return `?${sp.toString()}`
  }

  /* table columns */
  interface RowType {
    id: number
    name: string | null
    email: string
    role: string
    createdAt: Date
  }

  const columns: Column<RowType>[] = [
    {
      key: 'name',
      header: 'Name / Email',
      sortable: true,
      render: (_v, row) => (
        <div>
          {row.name || row.email}
          <div className='text-muted-foreground text-xs'>{row.email}</div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortable: true, className: 'capitalize' },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (v) =>
        (v as Date).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
  ]

  /* ui */
  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>All Users</h2>

      {/* search */}
      <form method='GET' className='flex max-w-xs gap-2'>
        <Input id='q' name='q' placeholder='Search name / email…' defaultValue={q} className='h-9' />
        <Button type='submit' size='sm'>Search</Button>
      </form>

      {/* table */}
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <DataTable columns={columns} rows={users as RowType[]} sort={sort} dir={dir} buildLink={buildLink} />
        </CardContent>
      </Card>

      {/* pagination */}
      <TablePagination page={page} hasNext={hasNext} buildLink={buildLink} />
    </section>
  )
}
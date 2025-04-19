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
import { issuers as issuersTable } from '@/lib/db/schema/issuer'
import { candidateCredentials as credsT, CredentialStatus, candidates as candT } from '@/lib/db/schema/veritalent'

export const revalidate = 0

const PAGE_SIZE = 20
const SORTABLE = {
  title: credsT.title,
  candidate: usersTable.name,
  issuer: issuersTable.name,
  status: credsT.status,
  created: credsT.createdAt,
} as const

type SortKey = keyof typeof SORTABLE

export default async function AdminCredentialsPage({
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
    .select({ cred: credsT, candUser: usersTable, issuer: issuersTable })
    .from(credsT)
    .leftJoin(candT, eq(credsT.candidateId, candT.id))
    .leftJoin(usersTable, eq(candT.userId, usersTable.id))
    .leftJoin(issuersTable, eq(credsT.issuerId, issuersTable.id))

  const searchCond = q
    ? ilike(sql`${credsT.title} || ' ' || ${usersTable.name} || ' ' || ${usersTable.email}`, `%${q}%`)
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
    title: string
    candidate: string
    issuer: string | null
    status: CredentialStatus
  }

  const tableRows: RowType[] = data.map((r) => ({
    id: r.cred.id,
    title: r.cred.title,
    candidate: r.candUser?.name || r.candUser?.email || 'Unknown',
    issuer: r.issuer?.name || null,
    status: r.cred.status as CredentialStatus,
  }))

  const columns: Column<RowType>[] = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'candidate', header: 'Candidate', sortable: true },
    { key: 'issuer', header: 'Issuer', sortable: true, render: (v) => v || '—' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'capitalize',
      render: (v: any) => (
        <span
          className={
            v === CredentialStatus.VERIFIED
              ? 'text-emerald-600'
              : v === CredentialStatus.PENDING
                ? 'text-amber-600'
                : 'text-rose-600'
          }
        >
          {v}
        </span>
      ),
    },
  ]

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>All Credentials</h2>

      <form method='GET' className='flex max-w-xs gap-2'>
        <Input id='q' name='q' placeholder='Search title / candidate…' defaultValue={q} className='h-9' />
        <Button size='sm' type='submit'>Search</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Credentials Overview</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <DataTable columns={columns} rows={tableRows} sort={sort} dir={dir} buildLink={buildLink} />
        </CardContent>
      </Card>

      <TablePagination page={page} hasNext={hasNext} buildLink={buildLink} />
    </section>
  )
}
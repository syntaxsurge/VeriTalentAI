import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  asc,
  desc,
  ilike,
  eq,
  sql,
} from 'drizzle-orm'

import IssuerStatusButtons from '@/components/dashboard/issuer-status-buttons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  /* ---------------- auth guard ---------------- */
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* -------------- query params ---------------- */
  const q = (searchParams?.q as string) ?? ''
  const sort: SortKey = (searchParams?.sort as SortKey) in SORTABLE ? (searchParams?.sort as SortKey) : 'created'
  const dir = (searchParams?.dir as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, parseInt((searchParams?.page as string) ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  /* -------------- base query ------------------ */
  const base = db
    .select({
      issuer: issuersTable,
      owner: usersTable,
    })
    .from(issuersTable)
    .leftJoin(usersTable, eq(issuersTable.ownerUserId, usersTable.id))

  const searchCond = q
    ? ilike(
        sql`${issuersTable.name} || ' ' || ${issuersTable.domain} || ' ' || ${usersTable.name} || ' ' || ${usersTable.email}`,
        `%${q}%`,
      )
    : undefined

  const rows = await base
    .where(searchCond ? searchCond : undefined)
    .orderBy(dir === 'asc' ? asc(SORTABLE[sort]) : desc(SORTABLE[sort]))
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  const hasNext = rows.length > PAGE_SIZE
  const data = rows.slice(0, PAGE_SIZE)

  /* -------------- helpers ------------------ */
  const buildLink = (params: Record<string, any>) => {
    const sp = new URLSearchParams({
      q,
      sort,
      dir,
      page: page.toString(),
      ...Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
      ),
    })
    return `?${sp.toString()}`
  }
  const sortIndicator = (key: SortKey) => (sort === key ? (dir === 'asc' ? '▲' : '▼') : '')

  /* ---------------- UI ------------------- */
  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>Issuer Management</h2>

      {/* Search */}
      <form method='GET' className='flex max-w-xs gap-2'>
        <Input id='q' name='q' placeholder='Search name / owner…' defaultValue={q} className='h-9' />
        <Button size='sm' type='submit'>Search</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>All Issuers</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_th]:text-muted-foreground border-b'>
              <tr>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'name', dir: sort === 'name' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Name / Domain {sortIndicator('name')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'owner', dir: sort === 'owner' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Owner {sortIndicator('owner')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'category', dir: sort === 'category' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Category {sortIndicator('category')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'industry', dir: sort === 'industry' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Industry {sortIndicator('industry')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'status', dir: sort === 'status' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Status {sortIndicator('status')}
                  </Link>
                </th>
                <th className='py-2 text-left'></th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {data.map(({ issuer, owner }) => (
                <tr key={issuer.id} className='hover:bg-muted/30'>
                  <td className='py-2 pr-4'>
                    {issuer.name}
                    <div className='text-muted-foreground text-xs'>{issuer.domain}</div>
                  </td>
                  <td className='py-2 pr-4'>
                    {owner?.name || owner?.email || '—'}
                    <div className='text-muted-foreground text-xs'>{owner?.email}</div>
                  </td>
                  <td className='capitalize py-2 pr-4'>
                    {issuer.category.replaceAll('_', ' ').toLowerCase()}
                  </td>
                  <td className='capitalize py-2 pr-4'>
                    {issuer.industry.toLowerCase()}
                  </td>
                  <td
                    className={`capitalize py-2 pr-4 ${
                      issuer.status === IssuerStatus.ACTIVE
                        ? 'text-emerald-600'
                        : issuer.status === IssuerStatus.PENDING
                          ? 'text-amber-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {issuer.status.toLowerCase()}
                  </td>
                  <td className='py-2 pr-4'>
                    <IssuerStatusButtons issuerId={issuer.id} status={issuer.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <Button asChild variant='outline' size='sm' disabled={page === 1}>
          <Link href={buildLink({ page: page - 1 })}>Previous</Link>
        </Button>
        <span className='text-sm'>Page {page}</span>
        <Button asChild variant='outline' size='sm' disabled={!hasNext}>
          <Link href={buildLink({ page: page + 1 })}>Next</Link>
        </Button>
      </div>
    </section>
  )
}
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  and,
  asc,
  desc,
  ilike,
  eq,
  sql,
} from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'
import { issuers as issuersTable } from '@/lib/db/schema/issuer'
import {
  candidateCredentials as credsT,
  CredentialStatus,
  candidates as candT,
} from '@/lib/db/schema/veritalent'

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
  const sort: SortKey = (searchParams?.sort as SortKey) in SORTABLE ? (searchParams?.sort as SortKey) : 'created'
  const dir = (searchParams?.dir as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, parseInt((searchParams?.page as string) ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  /* ---------------------------- base query ---------------------------- */
  const base = db
    .select({
      cred: credsT,
      candUser: usersTable,
      issuer: issuersTable,
    })
    .from(credsT)
    .leftJoin(candT, eq(credsT.candidateId, candT.id))
    .leftJoin(usersTable, eq(candT.userId, usersTable.id))
    .leftJoin(issuersTable, eq(credsT.issuerId, issuersTable.id))

  const searchCond = q
    ? ilike(
        sql`${credsT.title} || ' ' || ${usersTable.name} || ' ' || ${usersTable.email}`,
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

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>All Credentials</h2>

      {/* Search */}
      <form method='GET' className='flex max-w-xs gap-2'>
        <Input id='q' name='q' placeholder='Search title / candidate…' defaultValue={q} className='h-9' />
        <Button size='sm' type='submit'>Search</Button>
      </form>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Credentials Overview</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_th]:text-muted-foreground border-b'>
              <tr>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'title', dir: sort === 'title' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Title {sortIndicator('title')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'candidate', dir: sort === 'candidate' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Candidate {sortIndicator('candidate')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'issuer', dir: sort === 'issuer' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Issuer {sortIndicator('issuer')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link href={buildLink({ sort: 'status', dir: sort === 'status' && dir === 'asc' ? 'desc' : 'asc', page: 1 })} className='flex items-center gap-1'>
                    Status {sortIndicator('status')}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {data.map((r) => (
                <tr key={r.cred.id} className='hover:bg-muted/30'>
                  <td className='py-2 pr-4'>{r.cred.title}</td>
                  <td className='py-2 pr-4'>{r.candUser?.name || r.candUser?.email || 'Unknown'}</td>
                  <td className='py-2 pr-4'>{r.issuer?.name || '—'}</td>
                  <td
                    className={`capitalize py-2 pr-4 ${
                      r.cred.status === CredentialStatus.VERIFIED
                        ? 'text-emerald-600'
                        : r.cred.status === CredentialStatus.PENDING
                          ? 'text-amber-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {r.cred.status}
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
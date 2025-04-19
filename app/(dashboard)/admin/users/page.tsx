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

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                               CONFIG & TYPES                               */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20
const SORTABLE = {
  name: usersTable.name,
  email: usersTable.email,
  role: usersTable.role,
  created: usersTable.createdAt,
} as const

type SortKey = keyof typeof SORTABLE

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>
}) {
  /* ----------------------- auth guard ----------------------- */
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* -------------------- query parameters -------------------- */
  const q = (searchParams?.q as string) ?? ''
  const sort: SortKey = (searchParams?.sort as SortKey) in SORTABLE ? (searchParams?.sort as SortKey) : 'created'
  const dir = (searchParams?.dir as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, parseInt((searchParams?.page as string) ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  /* ----------------------- where clause --------------------- */
  const conditions = q
    ? ilike(sql`${usersTable.name} || ' ' || ${usersTable.email}`, `%${q}%`)
    : undefined

  /* ------------------------ query db ------------------------ */
  const rows = await db
    .select()
    .from(usersTable)
    .where(conditions ? conditions : undefined)
    .orderBy(dir === 'asc' ? asc(SORTABLE[sort]) : desc(SORTABLE[sort]))
    .limit(PAGE_SIZE + 1) // +1 to know if a next page exists
    .offset(offset)

  const hasNext = rows.length > PAGE_SIZE
  const users = rows.slice(0, PAGE_SIZE)

  /* ------------------------- helpers ------------------------ */
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

  const sortIndicator = (key: SortKey) =>
    sort === key ? (dir === 'asc' ? '▲' : '▼') : ''

  /* --------------------------- UI --------------------------- */
  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>All Users</h2>

      {/* Search */}
      <form method='GET' className='flex max-w-xs gap-2'>
        <Input
          id='q'
          name='q'
          placeholder='Search name / email…'
          defaultValue={q}
          className='h-9'
        />
        <Button type='submit' size='sm'>
          Search
        </Button>
      </form>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_th]:text-muted-foreground border-b'>
              <tr>
                <th className='py-2 text-left'>
                  <Link
                    href={buildLink({
                      sort: 'name',
                      dir: sort === 'name' && dir === 'asc' ? 'desc' : 'asc',
                      page: 1,
                    })}
                    className='flex items-center gap-1'
                  >
                    Name / Email {sortIndicator('name')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link
                    href={buildLink({
                      sort: 'role',
                      dir: sort === 'role' && dir === 'asc' ? 'desc' : 'asc',
                      page: 1,
                    })}
                    className='flex items-center gap-1'
                  >
                    Role {sortIndicator('role')}
                  </Link>
                </th>
                <th className='py-2 text-left'>
                  <Link
                    href={buildLink({
                      sort: 'created',
                      dir: sort === 'created' && dir === 'asc' ? 'desc' : 'asc',
                      page: 1,
                    })}
                    className='flex items-center gap-1'
                  >
                    Joined {sortIndicator('created')}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {users.map((u) => (
                <tr key={u.id} className='hover:bg-muted/30'>
                  <td className='py-2 pr-4'>
                    {u.name || u.email}
                    <div className='text-muted-foreground text-xs'>{u.email}</div>
                  </td>
                  <td className='capitalize py-2 pr-4'>{u.role}</td>
                  <td className='py-2 pr-4'>
                    {u.createdAt.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <Button
          variant='outline'
          size='sm'
          disabled={page === 1}
          asChild
        >
          <Link href={buildLink({ page: page - 1 })}>Previous</Link>
        </Button>
        <span className='text-sm'>
          Page {page}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={!hasNext}
          asChild
        >
          <Link href={buildLink({ page: page + 1 })}>Next</Link>
        </Button>
      </div>
    </section>
  )
}
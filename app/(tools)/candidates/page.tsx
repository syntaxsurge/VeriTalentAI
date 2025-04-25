import Link from 'next/link'
import { eq, sql } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { db } from '@/lib/db/drizzle'
import { candidates, candidateCredentials, users } from '@/lib/db/schema'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                               PAGE CONFIG                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 30

type Query = Record<string, string | string[] | undefined>

export default async function CandidateDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const qRaw = params.q
  const q = typeof qRaw === 'string' ? qRaw.trim().toLowerCase() : ''

  const page = Math.max(
    1,
    Number(Array.isArray(params.page) ? params.page[0] : params.page ?? '1'),
  )
  const offset = (page - 1) * PAGE_SIZE

  /* ---------------------------- Core query ---------------------------- */
  const rows = await db
    .select({
      id: candidates.id,
      name: users.name,
      email: users.email,
      verified: sql<number>`COUNT(CASE WHEN ${candidateCredentials.status} = 'verified' THEN 1 END)`,
    })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .leftJoin(candidateCredentials, eq(candidateCredentials.candidateId, candidates.id))
    .where(
      q
        ? sql`LOWER(${users.name}) LIKE ${'%' + q + '%'} OR LOWER(${users.email}) LIKE ${
            '%' + q + '%'
          }`
        : sql`TRUE`,
    )
    .groupBy(candidates.id, users.name, users.email)
    .orderBy(sql`LOWER(${users.name}) ASC`)
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  const hasNext = rows.length > PAGE_SIZE
  if (hasNext) rows.pop()

  /* ---------------------------- View ---------------------------- */
  return (
    <section className='mx-auto max-w-7xl space-y-8'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight'>Candidate Directory</h1>
        <p className='text-muted-foreground max-w-2xl text-sm'>
          Discover talent — each profile is publicly shareable.
        </p>
      </header>

      {/* Search */}
      <form className='max-w-sm'>
        <input
          type='text'
          name='q'
          placeholder='Search candidates…'
          defaultValue={q}
          className='border-border w-full rounded-md border px-3 py-2 text-sm'
        />
      </form>

      {/* Grid */}
      {rows.length === 0 ? (
        <p className='text-muted-foreground'>No candidates found.</p>
      ) : (
        <ul className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/candidates/${c.id}`} className='block h-full'>
                <Card className='group h-full transition-shadow hover:shadow-lg'>
                  <CardContent className='flex flex-col items-center gap-4 p-6 text-center'>
                    <UserAvatar name={c.name} email={c.email} className='size-16 text-lg' />
                    <div>
                      <p className='font-medium'>{c.name || 'Unnamed'}</p>
                      <p className='text-muted-foreground text-sm'>{c.email}</p>
                    </div>
                    {c.verified > 0 && (
                      <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
                        {c.verified} verified credential{c.verified === 1 ? '' : 's'}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Simple pagination */}
      <div className='flex justify-center gap-4'>
        {page > 1 && (
          <Link href={`/candidates?page=${page - 1}${q ? `&q=${q}` : ''}`} className='underline'>
            Previous
          </Link>
        )}
        {hasNext && (
          <Link href={`/candidates?page=${page + 1}${q ? `&q=${q}` : ''}`} className='underline'>
            Next
          </Link>
        )}
      </div>
    </section>
  )
}
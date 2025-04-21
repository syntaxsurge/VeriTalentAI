import Link from 'next/link'

import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema/core'
import { candidates, candidateCredentials, quizAttempts } from '@/lib/db/schema/viskify'

export const revalidate = 0

/** Case-insensitive substring check */
function includesCI(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase())
}

export default async function TalentSearchPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>
}) {
  /* ------------------------------------------------------------------ */
  /* Query params                                                       */
  /* ------------------------------------------------------------------ */
  const keyword = (searchParams?.q as string) || ''
  const verifiedOnly = searchParams?.verifiedOnly === '1'
  const skillMin = parseInt((searchParams?.skillMin as string) || '0', 10)

  /* ------------------------------------------------------------------ */
  /* Raw candidate info                                                 */
  /* ------------------------------------------------------------------ */
  const baseRows = await db
    .select({
      candidateId: candidates.id,
      bio: candidates.bio,
      name: users.name,
      email: users.email,
    })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))

  /* ------------------------------------------------------------------ */
  /* Maps for verified counts & top scores                              */
  /* ------------------------------------------------------------------ */
  const verifiedRows = await db
    .select({ candidateId: candidateCredentials.candidateId })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.verified, true))

  const verifiedMap = new Map<number, number>()
  verifiedRows.forEach((r) =>
    verifiedMap.set(r.candidateId, (verifiedMap.get(r.candidateId) || 0) + 1),
  )

  const scoreRows = await db
    .select({
      candidateId: quizAttempts.candidateId,
      score: quizAttempts.score,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.pass, 1))

  const scoreMap = new Map<number, number>()
  scoreRows.forEach((r) => {
    const current = scoreMap.get(r.candidateId) ?? 0
    if (r.score !== null && r.score > current) {
      scoreMap.set(r.candidateId, r.score)
    }
  })

  /* ------------------------------------------------------------------ */
  /* Filtering                                                          */
  /* ------------------------------------------------------------------ */
  const results = baseRows.filter((row) => {
    if (keyword && !includesCI(`${row.name ?? ''} ${row.email ?? ''} ${row.bio ?? ''}`, keyword))
      return false

    if (verifiedOnly && !(verifiedMap.get(row.candidateId) ?? 0)) return false

    if (skillMin && (scoreMap.get(row.candidateId) ?? 0) < skillMin) return false

    return true
  })

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <section className='space-y-6'>
      <h2 className='text-xl font-semibold'>Talent Search</h2>

      {/* Search / filter form (GET) */}
      <form method='GET' className='grid items-end gap-4 md:grid-cols-4'>
        <div className='col-span-2'>
          <label htmlFor='q' className='mb-1 block text-sm font-medium'>
            Keyword
          </label>
          <Input id='q' name='q' defaultValue={keyword} placeholder='Search name, email, bio…' />
        </div>

        <div>
          <label htmlFor='skillMin' className='mb-1 block text-sm font-medium'>
            Min Skill Score
          </label>
          <Input
            id='skillMin'
            name='skillMin'
            type='number'
            min={0}
            max={100}
            defaultValue={skillMin || ''}
          />
        </div>

        <div className='flex items-center gap-2'>
          <input
            id='verifiedOnly'
            name='verifiedOnly'
            type='checkbox'
            value='1'
            defaultChecked={verifiedOnly}
            className='accent-primary size-4 cursor-pointer'
          />
          <label htmlFor='verifiedOnly' className='cursor-pointer text-sm'>
            Verified only
          </label>
        </div>

        <Button type='submit' className='w-max md:col-span-4'>
          Apply Filters
        </Button>
      </form>

      {/* Results list */}
      {results.length === 0 ? (
        <p className='text-muted-foreground'>No matching candidates.</p>
      ) : (
        <div className='grid gap-4'>
          {results.map((row) => {
            const verified = verifiedMap.get(row.candidateId) ?? 0
            const topScore = scoreMap.get(row.candidateId) ?? '—'
            return (
              <Card key={row.candidateId}>
                <CardHeader>
                  <CardTitle>{row.name || row.email}</CardTitle>
                </CardHeader>
                <CardContent className='text-muted-foreground space-y-1 text-sm'>
                  <p className='line-clamp-2'>{row.bio || 'No bio provided.'}</p>
                  <p>Verified Credentials: {verified}</p>
                  <p>Top Skill Score: {topScore}</p>
                  <Link
                    href={`/recruiter/talent/${row.candidateId}`}
                    className='text-primary underline'
                  >
                    View Profile
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

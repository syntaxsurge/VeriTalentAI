import Image from 'next/image'
import { eq } from 'drizzle-orm'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  issuers as issuersTable,
  IssuerCategory,
  IssuerIndustry,
  IssuerStatus,
} from '@/lib/db/schema/issuer'
import { db } from '@/lib/db/drizzle'
import { ReadonlyURLSearchParams } from 'next/navigation'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                H E L P E R S                               */
/* -------------------------------------------------------------------------- */

function includesCI(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase())
}

function prettify(text: string) {
  return text.replaceAll('_', ' ').toLowerCase()
}

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

export default async function IssuerDirectory({
  searchParams,
}: {
  searchParams: ReadonlyURLSearchParams
}) {
  /* --------------------------- Parse search params --------------------------- */
  const keyword = (searchParams.get('q') ?? '').trim()
  const category = searchParams.get('category') ?? 'ALL'
  const industry = searchParams.get('industry') ?? 'ALL'

  /* ---------------------------- Load active issuers --------------------------- */
  const rows = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.status, IssuerStatus.ACTIVE))

  /* -------------------------------- Filtering -------------------------------- */
  const filtered = rows.filter((r) => {
    if (keyword && !includesCI(`${r.name} ${r.domain}`, keyword)) return false
    if (category !== 'ALL' && r.category !== category) return false
    if (industry !== 'ALL' && r.industry !== industry) return false
    return true
  })

  /* Dropdown sources */
  const categories = ['ALL', ...Object.values(IssuerCategory)]
  const industries = ['ALL', ...Object.values(IssuerIndustry)]

  /* ---------------------------------- UI ------------------------------------ */
  return (
    <main className='mx-auto max-w-7xl space-y-10 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight'>Verified Issuers</h1>
        <p className='text-muted-foreground max-w-2xl text-sm'>
          Explore organisations that can cryptographically sign your credentials. Filter by keyword,
          category, or industry to quickly find the right issuer.
        </p>
      </header>

      {/* ------------------------------ Filters Card ----------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-medium'>Search &amp; Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method='GET' className='grid gap-4 sm:grid-cols-4 lg:grid-cols-6'>
            {/* Keyword */}
            <div className='sm:col-span-2 lg:col-span-3'>
              <label htmlFor='q' className='mb-1 block text-sm font-medium'>
                Keyword
              </label>
              <Input
                id='q'
                name='q'
                defaultValue={keyword}
                placeholder='Search issuer name or domain…'
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor='category' className='mb-1 block text-sm font-medium'>
                Category
              </label>
              <select
                id='category'
                name='category'
                className='h-10 w-full rounded-md border px-2 capitalize'
                defaultValue={category}
              >
                {categories.map((c) => (
                  <option key={c} value={c} className='capitalize'>
                    {c === 'ALL' ? 'All' : prettify(c)}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div>
              <label htmlFor='industry' className='mb-1 block text-sm font-medium'>
                Industry
              </label>
              <select
                id='industry'
                name='industry'
                className='h-10 w-full rounded-md border px-2 capitalize'
                defaultValue={industry}
              >
                {industries.map((i) => (
                  <option key={i} value={i} className='capitalize'>
                    {i === 'ALL' ? 'All' : i.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className='sm:col-span-4 lg:col-span-6'>
              <Button type='submit' className='w-full sm:w-auto'>
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ---------------------------- Results grid --------------------------- */}
      {filtered.length === 0 ? (
        <p className='text-muted-foreground text-sm'>No issuers match your filters.</p>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filtered.map((i) => (
            <Card
              key={i.id}
              className='group relative overflow-hidden border shadow-sm transition-shadow hover:shadow-lg'
            >
              {/* Decorative gradient blur */}
              <div className='pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 transition-opacity group-hover:opacity-100' />

              <CardHeader className='flex flex-row items-start gap-4'>
                {/* Logo with themed background */}
                <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border'>
                  {i.logoUrl ? (
                    <Image
                      src={i.logoUrl}
                      alt={`${i.name} logo`}
                      width={56}
                      height={56}
                      className='max-h-full max-w-full object-contain'
                    />
                  ) : (
                    <span className='text-muted-foreground text-xs'>No&nbsp;Logo</span>
                  )}
                </div>

                <div className='flex-1'>
                  <CardTitle className='truncate text-base font-semibold'>{i.name}</CardTitle>
                  <p className='text-muted-foreground truncate text-xs'>{i.domain}</p>
                </div>
              </CardHeader>

              <CardContent className='space-y-1 px-6 pb-6 text-sm'>
                <p className='capitalize'>
                  <span className='font-medium'>Category:</span> {prettify(i.category)}
                </p>
                <p className='capitalize'>
                  <span className='font-medium'>Industry:</span> {i.industry.toLowerCase()}
                </p>
                {i.did && (
                  <p className='break-all text-xs text-muted-foreground'>
                    <span className='font-medium'>DID:</span> {i.did}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import {
  issuers as issuersTable,
  IssuerStatus,
  IssuerCategory,
  IssuerIndustry,
} from '@/lib/db/schema/issuer'
import { eq } from 'drizzle-orm'

export const revalidate = 0

function includesCI(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase())
}

export default async function IssuerDirectory({ searchParams }: { searchParams?: Record<string, string> }) {
  const keyword = searchParams?.q ?? ''
  const category = searchParams?.category ?? 'ALL'
  const industry = searchParams?.industry ?? 'ALL'

  const rows = await db
    .select()
    .from(issuersTable)
    .where(eq(issuersTable.status, IssuerStatus.ACTIVE))

  const filtered = rows.filter((r) => {
    if (keyword && !includesCI(`${r.name} ${r.domain}`, keyword)) return false
    if (category !== 'ALL' && r.category !== category) return false
    if (industry !== 'ALL' && r.industry !== industry) return false
    return true
  })

  const categories = ['ALL', ...Object.values(IssuerCategory)]
  const industries = ['ALL', ...Object.values(IssuerIndustry)]

  return (
    <main className='mx-auto max-w-7xl space-y-8 px-4 py-12'>
      <h1 className='text-3xl font-bold'>Verified Issuers</h1>

      {/* Search / filters */}
      <form method='GET' className='grid gap-4 sm:grid-cols-4 items-end'>
        <div className='sm:col-span-2'>
          <label htmlFor='q' className='mb-1 block text-sm font-medium'>Keyword</label>
          <Input id='q' name='q' defaultValue={keyword} placeholder='Search issuer name or domain…' />
        </div>
        <div>
          <label htmlFor='category' className='mb-1 block text-sm font-medium'>Category</label>
          <select id='category' name='category' className='h-10 w-full rounded-md border px-2 capitalize' defaultValue={category}>
            {categories.map((c) => (
              <option key={c} value={c} className='capitalize'>
                {c === 'ALL' ? 'All' : c.replaceAll('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor='industry' className='mb-1 block text-sm font-medium'>Industry</label>
          <select id='industry' name='industry' className='h-10 w-full rounded-md border px-2 capitalize' defaultValue={industry}>
            {industries.map((i) => (
              <option key={i} value={i} className='capitalize'>
                {i === 'ALL' ? 'All' : i.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <button type='submit' className='h-10 rounded-md bg-primary px-4 text-white sm:col-span-4'>Apply</button>
      </form>

      {/* List */}
      {filtered.length === 0 ? (
        <p className='text-muted-foreground'>No issuers match your filters.</p>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((i) => (
            <Card key={i.id} className='transition-shadow hover:shadow-lg'>
              <CardHeader>
                <CardTitle className='truncate'>{i.name}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-1 text-sm'>
                <p className='text-muted-foreground'>{i.domain}</p>
                <p className='capitalize'>Category: {i.category.replaceAll('_', ' ').toLowerCase()}</p>
                <p className='capitalize'>Industry: {i.industry.toLowerCase()}</p>
                {i.logoUrl && (
                  <img src={i.logoUrl} alt={i.name} className='mt-2 h-10 w-auto' />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/db/queries/queries'
import { getTalentSearchPage } from '@/lib/db/queries/recruiter-talent'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import TalentTable, {
  RowType,
} from '@/components/dashboard/recruiter/talent-table'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>

function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function TalentSearchPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))

  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = getParam(params, 'sort') ?? 'name'
  const order = getParam(params, 'order') === 'desc' ? 'desc' : 'asc'

  const searchTerm = (getParam(params, 'q') ?? '').trim()
  const verifiedOnly = getParam(params, 'verifiedOnly') === '1'
  const skillMin = Math.max(0, Number(getParam(params, 'skillMin') ?? '0'))

  /* ---------------------------- Data fetch ------------------------------- */
  const { candidates, hasNext } = await getTalentSearchPage(
    page,
    pageSize,
    sort as 'name' | 'email' | 'id',
    order as 'asc' | 'desc',
    searchTerm,
    verifiedOnly,
    skillMin,
  )

  const rows: RowType[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    bio: c.bio,
    verified: c.verified,
    topScore: c.topScore,
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = getParam(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  add('verifiedOnly')
  add('skillMin')
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------- View ---------------------------------- */
  return (
    <section className='flex-1 p-4 lg:p-8'>
      <h1 className='mb-6 text-lg font-medium lg:text-2xl'>Talent Search</h1>

      {/* Filters */}
      <form
        method='GET'
        className='mb-6 grid items-end gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]'
      >
        <div>
          <label htmlFor='skillMin' className='mb-1 block text-sm font-medium'>
            Min Skill Score
          </label>
          <input
            id='skillMin'
            name='skillMin'
            type='number'
            min={0}
            max={100}
            defaultValue={skillMin || ''}
            className='h-10 w-full rounded-md border px-2 text-sm'
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

        <button
          type='submit'
          className='h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 sm:col-span-2 lg:col-span-1'
        >
          Apply Filters
        </button>
      </form>

      {/* Results table */}
      <div className='overflow-x-auto rounded-md border'>
        <TalentTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath='/recruiter/talent'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />
      </div>

      <TablePagination
        page={page}
        hasNext={hasNext}
        basePath='/recruiter/talent'
        initialParams={initialParams}
        pageSize={pageSize}
      />
    </section>
  )
}
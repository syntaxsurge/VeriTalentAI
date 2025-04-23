import Link from 'next/link'
import { redirect } from 'next/navigation'

import CandidateCredentialsTable, {
  RowType,
} from '@/components/dashboard/candidate/credentials-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getCandidateCredentialsPage } from '@/lib/db/queries/candidate-credentials'
import { getUser } from '@/lib/db/queries/queries'

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

export const revalidate = 0

type Query = Record<string, string | string[] | undefined>
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ---------------------------- Query params ----------------------------- */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))
  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(params, 'sort') ?? 'id'
  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim().toLowerCase()

  /* ---------------------------- Credentials ------------------------------ */
  const { credentials, hasNext } = await getCandidateCredentialsPage(
    user.id,
    page,
    pageSize,
    sort as any,
    order as any,
    searchTerm,
  )

  const rows: RowType[] = credentials.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    issuer: c.issuer ?? null,
    status: c.status,
    fileUrl: null,
    vcJson: c.vcJson ?? null,
  }))

  /* ------------------------ Initial query params ------------------------ */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = first(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* -------------------------------- View -------------------------------- */
  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>My Credentials</h2>
        <Link href='/candidate/credentials/add'>
          <Button size='sm'>Add Credential</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credentials Overview</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <CandidateCredentialsTable
            rows={rows}
            sort={sort}
            order={order as 'asc' | 'desc'}
            basePath='/candidate/credentials'
            initialParams={initialParams}
            searchQuery={searchTerm}
          />

          <TablePagination
            page={page}
            hasNext={hasNext}
            basePath='/candidate/credentials'
            initialParams={initialParams}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </section>
  )
}
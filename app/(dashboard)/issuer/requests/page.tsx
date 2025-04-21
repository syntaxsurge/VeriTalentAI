import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { AlertCircle } from 'lucide-react'

import IssuerRequestsTable, {
  type RowType,
} from '@/components/dashboard/issuer/requests-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { issuers } from '@/lib/db/schema/issuer'
import { getIssuerRequestsPage } from '@/lib/db/queries/issuer-requests'
import { CredentialStatus } from '@/lib/db/schema/viskify'
import { TablePagination } from '@/components/ui/tables/table-pagination'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const BASE_PATH = '/issuer/requests'

/** Safely return first param value. */
function first(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* --------------------- Validate issuer ownership ----------------------- */
  const [issuer] = await db
    .select()
    .from(issuers)
    .where(eq(issuers.ownerUserId, user.id))
    .limit(1)

  if (!issuer) redirect('/issuer/onboard')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))

  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = first(params, 'sort') ?? 'status'
  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim()

  /* ------------------------------ Data ----------------------------------- */
  const { requests, hasNext } = await getIssuerRequestsPage(
    issuer.id,
    page,
    pageSize,
    sort as 'title' | 'type' | 'status' | 'candidate',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = requests

  /* Build initialParams for pagination & headers */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = first(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------ View ----------------------------------- */
  return (
    <section className='flex-1 space-y-6'>
      <h2 className='text-xl font-semibold'>Verification Requests</h2>

      {rows.length === 0 ? (
        <div className='text-muted-foreground flex flex-col items-center gap-2 text-center'>
          <AlertCircle className='h-8 w-8' />
          <p>No verification requests found.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Requests Overview</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <IssuerRequestsTable
              rows={rows}
              sort={sort}
              order={order as 'asc' | 'desc'}
              basePath={BASE_PATH}
              initialParams={initialParams}
              searchQuery={searchTerm}
            />

            <TablePagination
              page={page}
              hasNext={hasNext}
              basePath={BASE_PATH}
              initialParams={initialParams}
              pageSize={pageSize}
            />
          </CardContent>
        </Card>
      )}
    </section>
  )
}
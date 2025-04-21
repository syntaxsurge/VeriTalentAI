import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import InvitationsTable, { RowType } from '@/components/dashboard/invitations-table'
import { getInvitationsPage } from '@/lib/db/queries/invitations'
import { getUser } from '@/lib/db/queries/queries'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>

function first(p: Query, k: string): string | undefined {
  const v = p[k]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))

  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = first(params, 'sort') ?? 'invitedAt'
  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim()

  /* -------------------------- Data fetching ------------------------------ */
  const { invitations, hasNext } = await getInvitationsPage(
    user.email,
    page,
    pageSize,
    sort as 'team' | 'role' | 'inviter' | 'status' | 'invitedAt',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = invitations.map((inv) => ({
    ...inv,
    invitedAt: new Date(inv.invitedAt),
  }))

  /* ------------------------ Build initialParams -------------------------- */
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
    <section className="flex-1">
      <h2 className="mb-4 text-xl font-semibold">Team Invitations</h2>

      <Card>
        <CardHeader>
          <CardTitle>Invitations Overview</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <InvitationsTable
            rows={rows}
            sort={sort}
            order={order as 'asc' | 'desc'}
            basePath="/invitations"
            initialParams={initialParams}
            searchQuery={searchTerm}
          />

          <TablePagination
            page={page}
            hasNext={hasNext}
            basePath="/invitations"
            initialParams={initialParams}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </section>
  )
}
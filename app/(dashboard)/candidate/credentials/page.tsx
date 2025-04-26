import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FileText } from 'lucide-react'

import ProfileHeader from '@/components/candidate/profile-header'
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

  /* ------------------------------ Auth ----------------------------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ---------------------------- Query params ----------------------------- */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))
  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(params, 'sort') ?? 'status'
  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim().toLowerCase()

  /* ---------------------------- Credentials ------------------------------ */
  const { rows: credentialRows, hasNext } = await getCandidateCredentialsPage(
    user.id,
    page,
    pageSize,
    sort as any,
    order as any,
    searchTerm,
  )

  const rows: RowType[] = credentialRows.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    type: c.type,
    issuer: c.issuer ?? null,
    status: c.status,
    fileUrl: null,
    vcJson: c.vcJson ?? null,
  }))

  /* ------------------------ Initial query params ------------------------ */
  const initialParams: Record<string, string> = {}
  const addParam = (k: string) => {
    const val = first(params, k)
    if (val) initialParams[k] = val
  }
  addParam('size')
  addParam('sort')
  addParam('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* -------------------------------- View -------------------------------- */
  return (
    <section className="mx-auto max-w-5xl space-y-10 py-10">
      {/* Candidate header */}
      <ProfileHeader
        name={user.name ?? null}
        email={user.email ?? ''}
        avatarSrc={(user as any)?.image ?? undefined}
      />

      {/* Credentials card */}
      <Card className="shadow-md transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* Icon, title, description */}
          <div className="flex items-center gap-3">
            <FileText className="text-primary h-10 w-10 flex-shrink-0" />
            <div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                My Credentials
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Add, organise, and track all of your verifiable credentials.
              </p>
            </div>
          </div>

          {/* Action */}
          <Link href="/candidate/credentials/add">
            <Button size="sm">Add Credential</Button>
          </Link>
        </CardHeader>

        <CardContent className="space-y-4 overflow-x-auto pt-0">
          <CandidateCredentialsTable
            rows={rows}
            sort={sort}
            order={order as 'asc' | 'desc'}
            basePath="/candidate/credentials"
            initialParams={initialParams}
            searchQuery={searchTerm}
          />

          <TablePagination
            page={page}
            hasNext={hasNext}
            basePath="/candidate/credentials"
            initialParams={initialParams}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </section>
  )
}
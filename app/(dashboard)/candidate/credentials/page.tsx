import Link from 'next/link'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import CandidateCredentialsTable, {
  RowType,
} from '@/components/dashboard/candidate/credentials-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getCandidateCredentialsPage } from '@/lib/db/queries/candidate-credentials'
import { getUser } from '@/lib/db/queries/queries'
import {
  candidates as candT,
  verifiedCredentials as vcTable,
} from '@/lib/db/schema/viskify'

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const ARCHIVE_OFFSET = 1_000_000 // ensure IDs don’t clash with candidate_credentials

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

  /* ---------------------------- Candidate row ---------------------------- */
  const [candidate] = await db.select().from(candT).where(eq(candT.userId, user.id)).limit(1)

  let rows: RowType[] = []
  let hasNext = false

  /* --------------------- Candidate-uploaded credentials ------------------ */
  if (candidate) {
    const { credentials, hasNext: next } = await getCandidateCredentialsPage(
      candidate.id,
      page,
      pageSize,
      sort as 'title' | 'type' | 'issuer' | 'status' | 'id',
      order as 'asc' | 'desc',
      searchTerm,
    )

    rows = credentials.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      issuer: c.issuer,
      status: c.status,
      fileUrl: null,
      vcJson: c.vcIssuedId ?? null,
    }))
    hasNext = next
  }

  /* ----------------------- Archived verified credentials ----------------- */
  if (candidate) {
    const archived = await db
      .select({
        id: vcTable.id,
        vcJson: vcTable.vcJson,
        verified: vcTable.verified,
        createdAt: vcTable.createdAt,
      })
      .from(vcTable)
      .where(eq(vcTable.candidateId, candidate.id))

    /* Minimal parsing to create user-friendly labels */
    const archiveRows: RowType[] = archived
      .filter((a) => (searchTerm ? a.vcJson.toLowerCase().includes(searchTerm) : true))
      .map((a) => {
        let title = 'Verifiable Credential'
        let issuer = '—'
        let type = 'vc'
        try {
          const obj = JSON.parse(a.vcJson)
          if (Array.isArray(obj?.type)) {
            type = obj.type[obj.type.length - 1] ?? 'vc'
          } else if (typeof obj?.type === 'string') {
            type = obj.type
          }
          issuer = obj?.issuer?.id ?? issuer
          title = type.charAt(0).toUpperCase() + type.slice(1)
        } catch {
          /* silently ignore JSON parse errors */
        }
        return {
          id: ARCHIVE_OFFSET + a.id,
          title,
          type,
          issuer,
          status: a.verified ? 'verified' : 'unverified',
          fileUrl: null,
          vcJson: a.vcJson,
        } as RowType
      })

    rows = [...archiveRows, ...rows]
  }

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
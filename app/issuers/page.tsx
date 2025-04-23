import Image from 'next/image'
import { asc, desc, ilike, or, and, eq } from 'drizzle-orm'

import IssuerFilters from '@/components/issuer-directory/issuer-filters'
import IssuersTable, { type RowType } from '@/components/issuer-directory/issuers-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import {
  issuers as issuersTable,
  IssuerStatus,
  IssuerCategory,
  IssuerIndustry,
} from '@/lib/db/schema/issuer'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Util                                     */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const BASE_PATH = '/issuers'

/** Safely return first value of a query param. */
function first(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function IssuerDirectoryPage({
  searchParams,
}: {
  /** Next 15 passes searchParams as a Promise – await it first. */
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))

  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = first(params, 'sort') ?? 'name'
  const order = first(params, 'order') === 'desc' ? 'desc' : 'asc'

  const searchTerm = (first(params, 'q') ?? '').trim()

  const categoryFilter = first(params, 'category')
  const industryFilter = first(params, 'industry')

  const validCategory = categoryFilter &&
    (Object.values(IssuerCategory) as string[]).includes(categoryFilter)
      ? categoryFilter
      : undefined

  const validIndustry = industryFilter &&
    (Object.values(IssuerIndustry) as string[]).includes(industryFilter)
      ? industryFilter
      : undefined

  /* --------------------------- ORDER BY helper --------------------------- */
  const sortMap = {
    name: issuersTable.name,
    domain: issuersTable.domain,
    category: issuersTable.category,
    industry: issuersTable.industry,
    createdAt: issuersTable.createdAt,
  } as const
  const orderExpr =
    order === 'asc'
      ? asc(sortMap[sort as keyof typeof sortMap])
      : desc(sortMap[sort as keyof typeof sortMap])

  /* ---------------------------- WHERE clause ---------------------------- */
  let whereExpr: any = eq(issuersTable.status, IssuerStatus.ACTIVE)

  if (validCategory) {
    whereExpr = and(whereExpr, eq(issuersTable.category, validCategory))
  }
  if (validIndustry) {
    whereExpr = and(whereExpr, eq(issuersTable.industry, validIndustry))
  }

  if (searchTerm.length > 0) {
    const searchCond = or(
      ilike(issuersTable.name, `%${searchTerm}%`),
      ilike(issuersTable.domain, `%${searchTerm}%`),
      ilike(issuersTable.category, `%${searchTerm}%`),
      ilike(issuersTable.industry, `%${searchTerm}%`),
    )
    whereExpr = and(whereExpr, searchCond)
  }

  /* ------------------------------ Data ---------------------------------- */
  const offset = (page - 1) * pageSize
  const rowsRaw = await db
    .select()
    .from(issuersTable)
    .where(whereExpr)
    .orderBy(orderExpr)
    .limit(pageSize + 1) // grab one extra to detect "next"
    .offset(offset)

  const hasNext = rowsRaw.length > pageSize
  if (hasNext) rowsRaw.pop()

  const rows: RowType[] = rowsRaw.map((i) => ({
    id: i.id,
    name: i.name,
    domain: i.domain,
    category: i.category,
    industry: i.industry,
    status: i.status,
    logoUrl: i.logoUrl,
    did: i.did ?? null,
    createdAt: i.createdAt?.toISOString() ?? '',
  }))

  /* ------------------------ Build initialParams ------------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = first(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm
  if (validCategory) initialParams['category'] = validCategory
  if (validIndustry) initialParams['industry'] = validIndustry

  /* ------------------------------ UI ------------------------------------ */
  return (
    <section className='mx-auto max-w-7xl space-y-10'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight'>Verified Issuers</h1>
        <p className='text-muted-foreground max-w-2xl text-sm'>
          Browse all verified organisations. Use the search box, category and industry filters,
          sortable headers, and pagination controls to quickly locate issuers.
        </p>
      </header>

      {/* Filters */}
      <IssuerFilters
        basePath={BASE_PATH}
        initialParams={initialParams}
        categories={Object.values(IssuerCategory)}
        industries={Object.values(IssuerIndustry)}
        selectedCategory={validCategory ?? ''}
        selectedIndustry={validIndustry ?? ''}
      />

      <Card>
        <CardHeader>
          <CardTitle>Issuer Directory</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <IssuersTable
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
    </section>
  )
}
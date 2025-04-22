import { redirect } from 'next/navigation'

import { TablePagination } from '@/components/ui/tables/table-pagination'
import PipelinesTable, {
  RowType,
} from '@/components/dashboard/recruiter/pipelines-table'
import CreatePipelineForm from './create-pipeline-form'
import { getRecruiterPipelinesPage } from '@/lib/db/queries/recruiter-pipelines'
import { getUser } from '@/lib/db/queries/queries'

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

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams: Query | Promise<Query>
}) {
  const params = (await searchParams) as Query

  /* ----------------------------- Auth guard ------------------------------ */
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))

  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = getParam(params, 'sort') ?? 'createdAt'
  const order = getParam(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(params, 'q') ?? '').trim()

  /* ---------------------------- Data fetch ------------------------------- */
  const { pipelines, hasNext } = await getRecruiterPipelinesPage(
    user.id,
    page,
    pageSize,
    sort as 'name' | 'createdAt',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
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
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------- View ---------------------------------- */
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-lg font-medium lg:text-2xl">Pipelines</h1>
        <a href="#create-pipeline-form" className="text-primary underline">
          + New&nbsp;Pipeline
        </a>
      </div>

      {/* Results */}
      <div className="overflow-x-auto rounded-md border">
        <PipelinesTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath="/recruiter/pipelines"
          initialParams={initialParams}
          searchQuery={searchTerm}
        />
      </div>

      <TablePagination
        page={page}
        hasNext={hasNext}
        basePath="/recruiter/pipelines"
        initialParams={initialParams}
        pageSize={pageSize}
      />

      {/* New pipeline form */}
      <CreatePipelineForm />
    </section>
  )
}
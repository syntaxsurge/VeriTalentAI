'use client'

import * as React from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface TablePaginationProps {
  /** 1‑based current page. */
  page: number
  /** Whether another page exists. */
  hasNext: boolean
  /** Route to navigate (e.g. "/settings/activity”). */
  basePath: string
  /** Existing query params (excluding "page”). */
  initialParams: Record<string, string>
  /** Current page size. */
  pageSize: number
  /** Options for selector (defaults to 10/20/50). */
  pageSizeOptions?: number[]
}

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function buildLink(
  basePath: string,
  init: Record<string, string>,
  overrides: Record<string, any>,
) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  Array.from(sp.entries()).forEach(([k, v]) => {
    if (v === '') sp.delete(k) // tidy URL
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

function getPages(current: number, hasNext: boolean): number[] {
  const pages: number[] = [1]
  if (current - 1 > 1) pages.push(current - 1)
  if (current !== 1) pages.push(current)
  if (hasNext) pages.push(current + 1)
  if (hasNext && current > 3) pages.push(-1)
  return [...new Set(pages)].sort((a, b) => a - b)
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export function TablePagination({
  page,
  hasNext,
  basePath,
  initialParams,
  pageSize,
  pageSizeOptions = [10, 20, 50],
}: TablePaginationProps) {
  if (page === 1 && !hasNext && pageSizeOptions.length === 0) return null
  const pages = React.useMemo(() => getPages(page, hasNext), [page, hasNext])
  const link = (p: number, extra: Record<string, any> = {}) =>
    buildLink(basePath, initialParams, { page: p, ...extra })

  function jumpToPage() {
    const input = prompt('Go to page:')
    if (!input) return
    const num = Number(input)
    if (Number.isNaN(num) || num < 1) return
    window.location.href = link(num)
  }

  /* Determine disabled states once to keep JSX readable */
  const prevDisabled = page <= 1
  const nextDisabled = !hasNext

  return (
    <div className='flex flex-col items-center justify-between gap-3 py-4 sm:flex-row'>
      <span className='text-sm text-muted-foreground'>Page {page}</span>

      <div className='flex items-center gap-2'>
        {/* Page‑size selector */}
        <select
          value={pageSize}
          onChange={(e) =>
            (window.location.href = buildLink(basePath, initialParams, {
              size: Number(e.target.value),
              page: 1,
            }))
          }
          className='h-8 rounded-md border px-2 text-sm'
        >
          {pageSizeOptions.map((sz) => (
            <option key={sz} value={sz}>
              {sz} / page
            </option>
          ))}
        </select>

        {/* Previous */}
        {prevDisabled ? (
          <Button variant='outline' size='sm' disabled>
            Previous
          </Button>
        ) : (
          <Button asChild variant='outline' size='sm'>
            <Link href={link(page - 1)}>Previous</Link>
          </Button>
        )}

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === -1 ? (
            <Button
              key={`ellipsis-${idx}`}
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              onClick={jumpToPage}
            >
              …
            </Button>
          ) : (
            <Button
              key={p}
              asChild={!prevDisabled && !nextDisabled}
              variant={p === page ? 'default' : 'outline'}
              size='sm'
              className='h-8 w-8 p-0'
            >
              <Link href={link(p)}>{p}</Link>
            </Button>
          ),
        )}

        {/* Next */}
        {nextDisabled ? (
          <Button variant='outline' size='sm' disabled>
            Next
          </Button>
        ) : (
          <Button asChild variant='outline' size='sm'>
            <Link href={link(page + 1)}>Next</Link>
          </Button>
        )}
      </div>

      <span className='hidden text-sm text-muted-foreground sm:inline' />
    </div>
  )
}
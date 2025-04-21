'use client'

import * as React from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

/* -------------------------------------------------------------------------- */
/*                                P R O P S                                   */
/* -------------------------------------------------------------------------- */

interface TablePaginationProps {
  /** Current page (1‑based). */
  page: number
  /** Whether a subsequent page exists. */
  hasNext: boolean
  /** Base pathname (e.g. "/settings/activity”). */
  basePath: string
  /** Existing query params (excluding "page”). */
  initialParams: Record<string, string>
}

/* -------------------------------------------------------------------------- */
/*                         H E L P E R   F U N C T I O N S                    */
/* -------------------------------------------------------------------------- */

/** Merge params and stringify into a link. */
function buildLink(
  basePath: string,
  init: Record<string, string>,
  overrides: Record<string, any>,
) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/**
 * Build a compact list of page indexes to display.
 *
 * Rules:
 * • Always include page 1.
 * • Show the previous page when it exists.
 * • Show the current page (except when it is page 1, already included).
 * • Show the next page **only** when the server indicates another page exists (`hasNext`).
 * • Insert a single ellipsis (represented by ‑1) only when the current page is > 3
 *   *and* more pages follow; this avoids an ellipsis at the end for small datasets
 *   while still hinting at more pages for larger sets without knowing the total.
 */
function getPages(current: number, hasNext: boolean): number[] {
  const pages: number[] = []

  // First page is always present.
  pages.push(1)

  // Previous page when applicable.
  if (current - 1 > 1) {
    pages.push(current - 1)
  }

  // Current page (skip duplicate when current === 1).
  if (current !== 1) {
    pages.push(current)
  }

  // Next page when the server says another page exists.
  if (hasNext) {
    pages.push(current + 1)
  }

  // Middle ellipsis, never trailing.
  if (hasNext && current > 3) {
    pages.push(-1)
  }

  // Ensure ascending order and uniqueness.
  return [...new Set(pages)].sort((a, b) => a - b)
}

/* -------------------------------------------------------------------------- */
/*                              P A G I N A T I O N                           */
/* -------------------------------------------------------------------------- */

export function TablePagination({
  page,
  hasNext,
  basePath,
  initialParams,
}: TablePaginationProps) {
  if (page === 1 && !hasNext) return null

  const pages = React.useMemo(() => getPages(page, hasNext), [page, hasNext])

  function jumpToPage() {
    const input = prompt('Go to page:')
    if (!input) return
    const num = Number(input)
    if (Number.isNaN(num) || num < 1) return
    window.location.href = buildLink(basePath, initialParams, { page: num })
  }

  const link = (p: number) => buildLink(basePath, initialParams, { page: p })

  return (
    <div className='flex flex-col items-center justify-between gap-2 py-4 sm:flex-row'>
      {/* Left spacer (for symmetry) */}
      <span className='hidden text-sm text-muted-foreground sm:inline' />

      <div className='flex items-center gap-2'>
        {/* Previous */}
        <Button
          asChild
          variant='outline'
          size='sm'
          disabled={page <= 1}
          aria-disabled={page <= 1}
        >
          <Link href={page <= 1 ? '#' : link(page - 1)}>Previous</Link>
        </Button>

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
              asChild
              variant={p === page ? 'default' : 'outline'}
              size='sm'
              className='h-8 w-8 p-0'
            >
              <Link href={link(p)}>{p}</Link>
            </Button>
          ),
        )}

        {/* Next */}
        <Button
          asChild
          variant='outline'
          size='sm'
          disabled={!hasNext}
          aria-disabled={!hasNext}
        >
          <Link href={hasNext ? link(page + 1) : '#'}>Next</Link>
        </Button>
      </div>

      {/* Right spacer */}
      <span className='hidden text-sm text-muted-foreground sm:inline' />
    </div>
  )
}
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TablePaginationProps {
  page: number
  hasNext: boolean
  buildLink: (params: Record<string, any>) => string
}

/**
 * Renders Previous / Next buttons only when relevant, eliminating phantom navigation.
 */
export function TablePagination({ page, hasNext, buildLink }: TablePaginationProps) {
  if (page === 1 && !hasNext) return null

  return (
    <div className='flex items-center justify-between'>
      {page > 1 ? (
        <Button asChild variant='outline' size='sm'>
          <Link href={buildLink({ page: page - 1 })}>Previous</Link>
        </Button>
      ) : (
        <span />
      )}

      <span className='text-sm'>Page {page}</span>

      {hasNext ? (
        <Button asChild variant='outline' size='sm'>
          <Link href={buildLink({ page: page + 1 })}>Next</Link>
        </Button>
      ) : (
        <span />
      )}
    </div>
  )
}
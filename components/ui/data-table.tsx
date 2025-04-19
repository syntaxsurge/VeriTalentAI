import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface Column<T extends Record<string, any>> {
  key: keyof T
  header: string
  /** enable sortable header */
  sortable?: boolean
  /** optional class overrides for this column */
  className?: string
  /** custom cell renderer */
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[]
  rows: T[]
  /** current sort key */
  sort?: string
  /** asc | desc */
  dir?: 'asc' | 'desc'
  /** util to build href preserving existing params */
  buildLink?: (params: Record<string, any>) => string
}

/**
 * Generic, server‑friendly table component that handles header links for sorting and
 * flexible cell rendering while keeping markup accessible for large datasets.
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  sort,
  dir = 'desc',
  buildLink,
}: DataTableProps<T>) {
  return (
    <table className='w-full caption-bottom text-sm'>
      <thead className='[&_th]:text-muted-foreground border-b'>
        <tr>
          {columns.map((col) => {
            const sortable = col.sortable && buildLink
            const active = sortable && sort === col.key
            const nextDir = dir === 'asc' ? 'desc' : 'asc'
            const indicator = active ? (dir === 'asc' ? '▲' : '▼') : ''
            return (
              <th key={String(col.key)} className={cn('py-2 text-left', col.className)}>
                {sortable ? (
                  <Link
                    href={buildLink!({
                      sort: col.key,
                      dir: active ? nextDir : 'asc',
                      page: 1,
                    })}
                    className='flex items-center gap-1'
                  >
                    {col.header} {indicator}
                  </Link>
                ) : (
                  col.header
                )}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody className='divide-y'>
        {rows.map((row, idx) => (
          <tr key={idx} className='hover:bg-muted/30'>
            {columns.map((col) => (
              <td key={String(col.key)} className={cn('py-2 pr-4', col.className)}>
                {col.render ? col.render(row[col.key], row) : (row[col.key] as any)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
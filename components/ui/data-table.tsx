import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  type LucideIcon,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface Column<T extends Record<string, any>> {
  key: keyof T
  header: string
  /** Enable sortable header */
  sortable?: boolean
  /** Optional class overrides for this column */
  className?: string
  /** Custom cell renderer */
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[]
  rows: T[]
  /** Current sort key */
  sort?: string
  /** asc | desc */
  dir?: 'asc' | 'desc'
  /** Util to build href preserving existing params */
  buildLink?: (params: Record<string, any>) => string
}

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

/**
 * Generic, server‑friendly table component.
 * Adds modern chevron indicators to sortable headers:
 *   • Double‑chevron (⇅) for unsorted sortable columns
 *   • Up or down chevron for active sort direction.
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
            const isSortable = col.sortable && buildLink
            const isActive = isSortable && sort === col.key
            const nextDir = dir === 'asc' ? 'desc' : 'asc'

            /* Choose icon: ⇅ default, ↑ asc, ↓ desc */
            let IconComponent: LucideIcon = ChevronsUpDown
            if (isActive) {
              IconComponent = dir === 'asc' ? ChevronUp : ChevronDown
            }

            const headerContent = (
              <span className='flex items-center gap-1'>
                {col.header}
                {isSortable && (
                  <IconComponent
                    className={cn(
                      'h-3 w-3 flex-shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                    aria-hidden='true'
                  />
                )}
              </span>
            )

            return (
              <th
                key={String(col.key)}
                className={cn(
                  'py-2 pr-4 text-left font-semibold',
                  isSortable && 'group cursor-pointer select-none',
                  col.className,
                )}
                /* Accessibility: indicate current sort */
                aria-sort={
                  isSortable
                    ? isActive
                      ? (dir === 'asc' ? 'ascending' : 'descending')
                      : 'none'
                    : undefined
                }
              >
                {isSortable ? (
                  <Link
                    href={buildLink!({
                      sort: col.key,
                      dir: isActive ? nextDir : 'asc',
                      page: 1,
                    })}
                    className='inline-flex items-center gap-1 hover:underline'
                  >
                    {headerContent}
                  </Link>
                ) : (
                  headerContent
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
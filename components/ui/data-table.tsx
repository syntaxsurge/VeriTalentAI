"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/* -------------------------------------------------------------------------- */
/*                                 P U B L I C T Y P E S                      */
/* -------------------------------------------------------------------------- */

export interface Column<T extends Record<string, any>> {
  key: keyof T
  header: string | React.ReactNode
  render?: (value: T[keyof T], row: T) => React.ReactNode
  enableHiding?: boolean
  sortable?: boolean
  className?: string
}

export interface BulkAction<T extends Record<string, any>> {
  label: string
  icon: LucideIcon
  onClick: (selectedRows: T[]) => void | Promise<void>
  /** optional colour accent */
  variant?: "default" | "destructive" | "outline"
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[]
  rows: T[]
  filterKey?: keyof T
  /** optional bulk actions shown when rows are selected */
  bulkActions?: BulkAction<T>[]
}

/* -------------------------------------------------------------------------- */
/*                               H E L P E R S                                */
/* -------------------------------------------------------------------------- */

function SortableHeader({
  column,
  title,
}: {
  column: any
  title: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() =>
        column.toggleSorting(column.getIsSorted() === "asc", false)
      }
    >
      <span>{title}</span>
      <ArrowUpDown className="ml-1 h-4 w-4" />
    </Button>
  )
}

const checkboxOutline =
  "border-foreground/50 data-[state=unchecked]:bg-background data-[state=unchecked]:border-foreground/50"

function buildColumnDefs<T extends Record<string, any>>(
  cols: Column<T>[],
): ColumnDef<T>[] {
  return cols.map((col) => {
    const headerLabel =
      typeof col.header === "string" ? col.header : String(col.key)

    return {
      accessorKey: col.key as string,
      header: col.sortable
        ? ({ column }) => (
            <SortableHeader column={column} title={col.header} />
          )
        : col.header,
      cell: col.render
        ? ({ row }) => col.render(row.original[col.key], row.original)
        : undefined,
      enableSorting: !!col.sortable,
      enableHiding: col.enableHiding !== false,
      meta: { className: col.className, label: headerLabel } as any,
    } as ColumnDef<T>
  })
}

/* -------------------------------------------------------------------------- */
/*                                   T A B L E                                */
/* -------------------------------------------------------------------------- */

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  filterKey,
  bulkActions = [],
}: DataTableProps<T>) {
  /* -------------------- table state -------------------- */
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columnDefs = React.useMemo<ColumnDef<T>[]>(() => {
    /* selection checkbox column */
    const selectCol: ColumnDef<T> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          className={checkboxOutline}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          className={checkboxOutline}
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }
    return [selectCol, ...buildColumnDefs(columns)]
  }, [columns])

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: { columnVisibility, columnFilters, rowSelection, sorting },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  /* Pre‑compute filter column to avoid optional‑call error */
  const filterColumn = React.useMemo(() => {
    return filterKey ? table.getColumn(filterKey as string) : undefined
  }, [table, filterKey])

  /* ------------------------- render ------------------------- */
  return (
    <div className="w-full">
      {/* toolbar */}
      {(filterKey ||
        table.getAllColumns().some((c) => c.getCanHide()) ||
        bulkActions.length > 0) && (
        <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
          {/* filter input */}
          {filterKey && (
            <Input
              placeholder={`Filter ${String(filterKey)}…`}
              value={(filterColumn?.getFilterValue() as string | undefined) ?? ""}
              onChange={(e) => filterColumn?.setFilterValue(e.target.value)}
              className="max-w-sm sm:mr-auto"
            />
          )}

          {/* bulk actions – always visible */}
          {bulkActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="sm:ml-2">
                  Bulk&nbsp;Selection{" "}
                  {selectedCount > 0 && `(${selectedCount})`}{" "}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {selectedCount === 0 && (
                  <>
                    <DropdownMenuLabel className="text-muted-foreground">
                      No rows selected
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}

                {bulkActions.map((a) => (
                  <DropdownMenuItem
                    key={a.label}
                    onClick={() =>
                      a.onClick(selectedRows.map((r) => r.original))
                    }
                    disabled={selectedCount === 0}
                    className={cn(
                      "cursor-pointer",
                      a.variant === "destructive" &&
                        "text-destructive text-rose-600 dark:text-rose-400 font-medium",
                      selectedCount === 0 && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <a.icon className="mr-2 h-4 w-4" />
                    {a.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* column toggle */}
          {table.getAllColumns().some((c) => c.getCanHide()) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="sm:ml-2">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((c) => c.getCanHide())
                  .map((c) => {
                    const label = (c.columnDef.meta as any)?.label ?? c.id
                    return (
                      <DropdownMenuCheckboxItem
                        key={c.id}
                        className="capitalize"
                        checked={c.getIsVisible()}
                        onCheckedChange={(v) => c.toggleVisibility(!!v)}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const cls = (header.column.columnDef.meta as any)?.className
                  return (
                    <TableHead key={header.id} className={cn(cls)}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnDefs.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* footer */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedCount} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
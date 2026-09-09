'use client'

import * as React from 'react'
import { DataGrid } from 'indas-ui/datagrid'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  width?: string
  render: (row: T) => React.ReactNode
  /** Return a sortable value to make the column header clickable. */
  sortValue?: (row: T) => string | number
}

export interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  title?: React.ReactNode
  /** Comma-separated column keys the grid keeps visible when space is tight. */
  mainColumns?: string
  selectedKey?: string
  onSelect?: (row: T) => void
  /** Rendered inside the grid's own toolbar, left of the view toggles. */
  toolbar?: React.ReactNode
  loading?: boolean
  pageSize?: number
  /** Accepted for call-site compatibility; the grid searches its own columns. */
  searchText?: (row: T) => string
  searchPlaceholder?: string
}

/* Take the column type straight from the grid, so this file never pins its
   own copy of @tanstack/react-table against the one indas-ui bundles. */
type GridColumn<T> = Parameters<typeof DataGrid<T>>[0]['columns'][number]

function parseWidth(width?: string) {
  if (!width) return undefined
  const n = Number.parseInt(width, 10)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Every grid renders through indas-ui's DataGrid with the feature set the Indas
 * Estimo screens use: search, per-column filter row, column visibility,
 * resizing, reordering, export and pagination, all inside the grid's own
 * toolbar rather than bolted on above it.
 *
 * Pages describe cells with the small `Column` shape above; the mapping to the
 * grid's column definitions lives here alone.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  title,
  mainColumns,
  selectedKey,
  onSelect,
  toolbar,
  loading,
  pageSize = 25,
}: DataTableProps<T>) {
  const gridColumns = React.useMemo<GridColumn<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        header: col.header,
        size: parseWidth(col.width),
        enableSorting: Boolean(col.sortValue),
        // Sorting and the grid's own search both read this accessor.
        accessorFn: (row: T) => (col.sortValue ? col.sortValue(row) : ''),
        cell: ({ row }) => (
          <div className={cn('text-sm', col.align === 'right' ? 'text-right' : 'text-left')}>
            {col.render(row.original)}
          </div>
        ),
      })),
    [columns],
  )

  return (
    <DataGrid
      data={rows}
      columns={gridColumns}
      getRowId={rowKey}
      title={title}
      loading={loading}
      hideHeader={!title}
      mainColumns={mainColumns}
      preToggleActions={toolbar}
      selectedRowIds={selectedKey ? [selectedKey] : undefined}
      onRowClick={onSelect}
      enableRowClickSelection={Boolean(onSelect)}
      rowSelectionMode="single"
      singleSelectionStyle="highlight"
      enableSorting
      enableSearch
      enableFiltering
      enableFilterRow
      enableColumnVisibility
      enableColumnResizing
      enableColumnReordering
      enableExport
      enablePagination
      paginationPageSize={pageSize}
      stickyHeader
      compactMode
    />
  )
}

/** Two-line cell: a bold primary value with a quiet secondary line under it. */
export function StackedCell({
  top,
  bottom,
  mono,
}: {
  top: React.ReactNode
  bottom?: React.ReactNode
  mono?: boolean
}) {
  return (
    <span className="block leading-tight">
      <span className={cn('font-semibold', mono && 'font-mono')}>{top}</span>
      {bottom ? <span className="block text-xs font-normal text-fg-muted">{bottom}</span> : null}
    </span>
  )
}

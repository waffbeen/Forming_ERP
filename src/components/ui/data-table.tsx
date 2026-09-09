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
  /** Single click: selects the row. */
  onSelect?: (row: T) => void
  /** Double click: opens the row, the way the ERP grids behave elsewhere. */
  onOpen?: (row: T) => void
  /** Rendered inside the grid's own toolbar, left of the view toggles. */
  toolbar?: React.ReactNode
  loading?: boolean
  pageSize?: number
  /**
   * Totals shown in a row under the grid, keyed by column id. Aggregations run
   * over the rows the grid is currently showing, so filtering the grid also
   * narrows the summary.
   */
  summary?: SummaryColumns<T>
  /** Accepted for call-site compatibility; the grid searches its own columns. */
  searchText?: (row: T) => string
  searchPlaceholder?: string
}

/* Take the column type straight from the grid, so this file never pins its
   own copy of @tanstack/react-table against the one indas-ui bundles. */
type GridColumn<T> = Parameters<typeof DataGrid<T>>[0]['columns'][number]

type SummaryConfigOf<T> = NonNullable<Parameters<typeof DataGrid<T>>[0]['summaryConfig']>
export type SummaryColumns<T> = Extract<SummaryConfigOf<T>, { columns: unknown }>['columns']

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
  onOpen,
  toolbar,
  loading,
  pageSize = 25,
  summary,
}: DataTableProps<T>) {
/* The grid exposes a row click but not a double click, so the second click on
     the same row within the usual double-click window is treated as one. */
  const lastClick = React.useRef<{ key: string; at: number } | null>(null)

  const handleRowClick = React.useCallback(
    (row: T) => {
      const key = rowKey(row)
      const now = Date.now()
      const previous = lastClick.current
      lastClick.current = { key, at: now }

      if (onOpen && previous && previous.key === key && now - previous.at < 400) {
        lastClick.current = null
        onOpen(row)
        return
      }
      onSelect?.(row)
    },
    [onOpen, onSelect, rowKey],
  )

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
      onRowClick={onSelect || onOpen ? handleRowClick : undefined}
      enableRowClickSelection={Boolean(onSelect || onOpen)}
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
      enableSummary={Boolean(summary)}
      summaryConfig={summary ? { columns: summary, position: 'bottom' } : undefined}
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

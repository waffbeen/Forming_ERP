'use client'

import * as React from 'react'
import { Plus, Upload } from 'lucide-react'
import { PageHeader } from './page-header'
import { Button, Column, DataTable } from '@/components/ui'

export interface MasterPageProps<T> {
  title: string
  /** Singular noun used on the "New" button, e.g. "customer". */
  entityName: string
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  /** Column keys the grid keeps visible when space is tight. */
  mainColumns?: string
  /** The create modal for this master. MasterPage owns its open state. */
  createModal?: (props: { isOpen: boolean; onClose: () => void }) => React.ReactNode
}

/**
 * Every master screen is the same shape: a centred title, the actions on their
 * own row, then one full-width grid.
 *
 * A single click selects a row; a double click opens it in the same form used
 * to create one, with its values filled in.
 */
export function MasterPage<T>({
  title,
  entityName,
  rows,
  columns,
  rowKey,
  mainColumns,
  createModal,
}: MasterPageProps<T>) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editRow, setEditRow] = React.useState<T | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="Masters"
        title={title}
        actions={
          <>
            <Button icon={Upload}>Import</Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={createModal ? () => setCreateOpen(true) : undefined}
              disabled={!createModal}
            >
              New {entityName}
            </Button>
          </>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={rowKey}
        title={title}
        mainColumns={mainColumns}
        onOpen={createModal ? (row) => setEditRow(row) : undefined}
      />

      {createModal?.({ isOpen: createOpen, onClose: () => setCreateOpen(false) })}

      {/* Same form, opened on a row rather than on the New button. */}
      {editRow ? createModal?.({ isOpen: true, onClose: () => setEditRow(null) }) : null}
    </>
  )
}

'use client'

import * as React from 'react'
import { Plus, Upload } from 'lucide-react'
import { PageHeader } from './page-header'
import { Button, Column, DataTable, StatsCard, StatsGrid } from '@/components/ui'
import type { StatsCardProps } from '@/components/ui'

export interface MasterPageProps<T> {
  title: string
  /** Singular noun used on the "New" button, e.g. "customer". */
  entityName: string
  stats?: StatsCardProps[]
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
 * own row, a few counts, then one grid. Adding a master is a matter of
 * describing its columns.
 */
export function MasterPage<T>({
  title,
  entityName,
  stats,
  rows,
  columns,
  rowKey,
  mainColumns,
  createModal,
}: MasterPageProps<T>) {
  const [createOpen, setCreateOpen] = React.useState(false)

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

      {stats?.length ? (
        <StatsGrid>
          {stats.map((s) => (
            <StatsCard key={s.label} {...s} />
          ))}
        </StatsGrid>
      ) : null}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={rowKey}
        title={title}
        mainColumns={mainColumns}
      />

      {createModal?.({ isOpen: createOpen, onClose: () => setCreateOpen(false) })}
    </>
  )
}

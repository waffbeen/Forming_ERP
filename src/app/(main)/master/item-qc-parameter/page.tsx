'use client'

import * as React from 'react'
import { FlaskConical, Pencil, Plus } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, DerivedField, FormGrid, Panel, PanelBody, PanelHeader,
  StackedCell, Tabs,
} from '@/components/ui'
import { QcParameterModal } from '@/components/modals'
import { CATEGORIES, ITEMS, QC_PARAMETERS, qcParametersFor, samplePlanFor } from '@/data'
import type { QcFieldType, QcParameter } from '@/types/procurement'

/* Item QC parameter master.

   The inspection format, per item category. This is the screen the RM QC
   inspection is built from: every characteristic an inspector is asked for at
   the receiving bay is a row here, and an item whose category has no rows is
   not inspected at all — it auto-approves on receipt.

   A format is inherited down the category tree, so the list for PVC reels shows
   what PVC adds and what it takes from Raw material above it. Inherited rows are
   marked, because editing one changes every category under it. */

const FIELD_LABEL: Record<QcFieldType, string> = {
  NUMERIC: 'Numeric',
  COMBO: 'Choice',
  CHECKBOX: 'Yes / no',
  TEXT: 'Recorded',
}

const FIELD_TONE: Record<QcFieldType, 'primary' | 'info' | 'warning' | 'muted'> = {
  NUMERIC: 'primary',
  COMBO: 'info',
  CHECKBOX: 'warning',
  TEXT: 'muted',
}

/** Categories an item can actually be filed under. */
const ITEM_CATEGORIES = CATEGORIES.filter((c) => c.appliesTo === 'ITEM' && c.status === 'ACTIVE')

/** How a characteristic's limits read on one line. */
function limitsOf(p: QcParameter) {
  if (p.fieldType === 'COMBO') return `${p.acceptanceOptions?.[0] ?? '—'} passes`
  if (p.fieldType === 'CHECKBOX') return 'Yes passes'
  if (p.fieldType === 'TEXT') return 'Not judged'
  if (p.tolerancePctOfOrder !== null) return `Ordered value ± ${p.tolerancePctOfOrder} %`
  const unit = p.uom ? ` ${p.uom}` : ''
  return `${p.lowerLimit ?? '—'} to ${p.upperLimit ?? '—'}${unit}`
}

export default function ItemQcParameterPage() {
  const [categoryId, setCategoryId] = React.useState('CT2')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<QcParameter | null>(null)

  const category = ITEM_CATEGORIES.find((c) => c.categoryId === categoryId) ?? ITEM_CATEGORIES[0]

  /* One representative item is enough to resolve the whole inherited format,
     since inheritance runs on the category rather than on the item. */
  const sampleItem = ITEMS.find((i) => i.categoryId === category.categoryId)
  const rows = sampleItem
    ? qcParametersFor(sampleItem.itemId)
    : QC_PARAMETERS.filter((p) => p.categoryId === category.categoryId)

  const plan = sampleItem ? samplePlanFor(sampleItem.itemId) : null
  const own = rows.filter((p) => p.categoryId === category.categoryId)
  const inherited = rows.filter((p) => p.categoryId !== category.categoryId)
  const items = ITEMS.filter((i) => i.categoryId === category.categoryId)

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (p: QcParameter) => {
    setEditing(p)
    setModalOpen(true)
  }

  const columns: Column<QcParameter>[] = [
    {
      key: 'characteristic',
      header: 'Characteristic',
      sortValue: (r) => r.characteristic,
      render: (r) => <StackedCell top={r.characteristic} bottom={r.specification} />,
    },
    {
      key: 'type',
      header: 'Answered',
      sortValue: (r) => r.fieldType,
      render: (r) => <Badge tone={FIELD_TONE[r.fieldType]}>{FIELD_LABEL[r.fieldType]}</Badge>,
    },
    { key: 'limits', header: 'Passes when', render: (r) => <span className="font-mono text-xs">{limitsOf(r)}</span> },
    {
      key: 'method',
      header: 'Method',
      render: (r) => <StackedCell top={r.method} bottom={r.measuringEquipment} />,
    },
    {
      key: 'from',
      header: 'From',
      sortValue: (r) => r.categoryId,
      render: (r) =>
        r.categoryId === category.categoryId ? (
          <Badge tone="success">This format</Badge>
        ) : (
          <Badge tone="muted">
            {CATEGORIES.find((c) => c.categoryId === r.categoryId)?.categoryName ?? r.categoryId}
          </Badge>
        ),
    },
  ]

  /* Memoised: a fresh object on every render would rebuild the grid's columns. */
  const actions = React.useMemo(
    () => ({
      onEdit: (row: QcParameter) => {
        setEditing(row)
        setModalOpen(true)
      },
      showEdit: true,
      mode: 'buttons' as const,
      primaryActions: ['edit' as const],
      labels: { edit: 'Edit characteristic' },
    }),
    [],
  )

  return (
    <>
      <PageHeader
        eyebrow="Masters · Quality"
        title="Item QC Parameters"
        actions={
          <Button variant="primary" icon={Plus} onClick={openNew}>
            New characteristic
          </Button>
        }
      />

      <div className="mb-3">
        <Tabs
          tabs={ITEM_CATEGORIES.map((c) => ({
            id: c.categoryId,
            label: c.categoryName,
            count: ITEMS.some((i) => i.categoryId === c.categoryId)
              ? qcParametersFor(ITEMS.find((i) => i.categoryId === c.categoryId)!.itemId).length
              : QC_PARAMETERS.filter((p) => p.categoryId === c.categoryId).length,
          }))}
          activeId={category.categoryId}
          onChange={setCategoryId}
        />
      </div>

      <Panel>
        <PanelHeader
          title={`${category.categoryName} format`}
          description={category.description}
          action={
            rows.length === 0 ? (
              <Badge tone="warning">Not inspected</Badge>
            ) : (
              <Badge tone="success">
                {rows.length} {rows.length === 1 ? 'characteristic' : 'characteristics'}
              </Badge>
            )
          }
        />
        <PanelBody>
          <FormGrid cols={3}>
            <DerivedField label="Sample size" value={plan?.sampleSize ?? 'No plan set'} />
            <DerivedField
              label="Samples drawn"
              value={plan ? `${plan.sampleCount} per batch` : '—'}
              emphasis={Boolean(plan)}
            />
            <DerivedField
              label="Items on this format"
              value={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
            />
          </FormGrid>
          {items.length > 0 ? (
            <p className="mt-2 font-mono text-xs text-fg-subtle">
              {items.map((i) => i.itemCode).join(' · ')}
            </p>
          ) : null}
        </PanelBody>
      </Panel>

      <DataTable
        title={`Characteristics · ${own.length} own, ${inherited.length} inherited`}
        rows={rows}
        columns={columns}
        rowKey={(r) => r.parameterId}
        onOpen={openEdit}
        actions={actions}
      />

      {rows.length === 0 ? (
        <Note>
          Nothing is configured against {category.categoryName}, so items in it are not inspected: a receipt
          auto-approves in full and goes straight to the store. Add a characteristic here to bring them onto the RM QC
          screen.
        </Note>
      ) : null}

      <Note>
        The RM QC inspection is built from these rows, so a characteristic added here is asked for at the next receipt.
        A format set on a parent category is inherited by everything under it — which is why the reel checks on Raw
        material also appear on the PVC and PET formats.
      </Note>

      <QcParameterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categoryId={category.categoryId}
        parameter={editing}
      />
    </>
  )
}

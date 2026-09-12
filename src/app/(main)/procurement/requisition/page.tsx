'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs,
} from '@/components/ui'
import { DetailModal, RequisitionModal } from '@/components/modals'
import { ITEMS, PURCHASE_REQUISITIONS, USERS, itemsBelowReorder } from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { PrStatus, PurchaseRequisition } from '@/types/procurement'

const STATUS_TONE: Record<PrStatus, 'muted' | 'warning' | 'success' | 'error' | 'info' | 'primary'> = {
  DRAFT: 'muted',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  ORDERED: 'info',
  CLOSED: 'primary',
}

const STATUS_LABEL: Record<PrStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ORDERED: 'Ordered',
  CLOSED: 'Closed',
}

const TABS = [
  { id: 'ALL', label: 'All', count: PURCHASE_REQUISITIONS.length },
  { id: 'SUBMITTED', label: 'Awaiting approval', count: PURCHASE_REQUISITIONS.filter((p) => p.prStatus === 'SUBMITTED').length },
  { id: 'ORDERED', label: 'Ordered' },
  { id: 'DRAFT', label: 'Draft' },
]

const userName = (id: string | null) =>
  id ? (USERS.find((u) => u.userId === id)?.userName ?? '—') : '—'

const itemName = (id: string) => ITEMS.find((i) => i.itemId === id)?.itemName ?? id
const itemCode = (id: string) => ITEMS.find((i) => i.itemId === id)?.itemCode ?? id
const itemUom = (id: string) => ITEMS.find((i) => i.itemId === id)?.uom ?? ''

export default function RequisitionPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(PURCHASE_REQUISITIONS[0].prId)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? PURCHASE_REQUISITIONS : PURCHASE_REQUISITIONS.filter((p) => p.prStatus === tab)),
    [tab],
  )
  const selected = rows.find((p) => p.prId === selectedId) ?? rows[0] ?? PURCHASE_REQUISITIONS[0]

  const awaiting = PURCHASE_REQUISITIONS.filter((p) => p.prStatus === 'SUBMITTED')
  const ordered = PURCHASE_REQUISITIONS.filter((p) => p.prStatus === 'ORDERED')
  const belowReorder = itemsBelowReorder()

  const columns: Column<PurchaseRequisition>[] = [
    { key: 'pr', header: 'PR No.', sortValue: (r) => r.prNumber, render: (r) => <StackedCell top={r.prNumber} bottom={formatDate(r.prDate)} mono /> },
    { key: 'dept', header: 'Department', sortValue: (r) => r.department, render: (r) => r.department },
    { key: 'raised', header: 'Raised by', sortValue: (r) => r.raisedByUserId, render: (r) => userName(r.raisedByUserId) },
    { key: 'lines', header: 'Lines', align: 'right', sortValue: (r) => r.lines.length, render: (r) => <span className="font-mono">{r.lines.length}</span> },
    {
      key: 'items',
      header: 'Items',
      render: (r) => (
        <span className="font-mono text-xs">{r.lines.map((l) => itemCode(l.itemId)).join(', ')}</span>
      ),
    },
    {
      key: 'required',
      header: 'Required by',
      sortValue: (r) => r.lines[0]?.requiredBy ?? '',
      render: (r) => <span className="font-mono">{formatDate(r.lines[0]?.requiredBy ?? r.prDate)}</span>,
    },
    { key: 'approver', header: 'Approved by', render: (r) => (r.approvedByUserId ? userName(r.approvedByUserId) : <span className="text-fg-subtle">Pending</span>) },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.prStatus,
      render: (r) => <Badge tone={STATUS_TONE[r.prStatus]}>{STATUS_LABEL[r.prStatus]}</Badge>,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Procurement"
        title="Purchase Requisitions"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            New requisition
          </Button>
        }
      />

      <>
        <DataTable
          title="Requisition queue"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.prId}
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          selectedKey={selected.prId}
          onSelect={(r) => setSelectedId(r.prId)}
          onOpen={(r) => { setSelectedId(r.prId); setDetailOpen(true) }}
        />

        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={selected.prNumber}
          subtitle={`${selected.department} · ${formatDate(selected.prDate)}`}
          badge={{ label: STATUS_LABEL[selected.prStatus], tone: STATUS_TONE[selected.prStatus] }}
        >
          <SpecList
            rows={[
              { label: 'Raised by', value: `${userName(selected.raisedByUserId)} · ${selected.department}`, mono: false },
              { label: 'Raised on', value: formatDate(selected.prDate) },
              {
                label: 'Approved',
                value: selected.approvedOn
                  ? `${userName(selected.approvedByUserId)} · ${formatDate(selected.approvedOn)}`
                  : 'Not yet approved',
                mono: false,
              },
            ]}
          />
          <Divider />
          <ul className="space-y-2.5">
            {selected.lines.map((line) => (
              <li key={line.lineId} className="rounded-md border border-bd-default px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{itemName(line.itemId)}</span>
                  <span className="shrink-0 font-mono text-sm font-semibold">
                    {formatNumber(line.quantity)} {itemUom(line.itemId)}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-xs text-fg-muted">
                  {itemCode(line.itemId)} · required {formatDate(line.requiredBy)}
                  {line.forJobCardNo ? ` · ${line.forJobCardNo}` : ''}
                </p>
                {line.remarks ? <p className="mt-1 text-xs text-fg-subtle">{line.remarks}</p> : null}
              </li>
            ))}
          </ul>
        </DetailModal>
      </>

      <RequisitionModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

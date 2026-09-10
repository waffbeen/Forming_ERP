'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs,
} from '@/components/ui'
import { DetailModal, PurchaseOrderModal } from '@/components/modals'
import { GRNS, ITEMS, PURCHASE_ORDERS, SUPPLIERS } from '@/data'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import type { PoStatus, PurchaseOrder } from '@/types/procurement'

const STATUS_TONE: Record<PoStatus, 'muted' | 'warning' | 'success' | 'error' | 'info'> = {
  OPEN: 'warning',
  PART_RECEIVED: 'info',
  RECEIVED: 'success',
  CLOSED: 'muted',
  CANCELLED: 'error',
}

const STATUS_LABEL: Record<PoStatus, string> = {
  OPEN: 'Open',
  PART_RECEIVED: 'Part received',
  RECEIVED: 'Received',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

const TABS = [
  { id: 'ALL', label: 'All', count: PURCHASE_ORDERS.length },
  { id: 'OPEN', label: 'Open' },
  { id: 'PART_RECEIVED', label: 'Part received' },
  { id: 'RECEIVED', label: 'Received' },
]

const supplierName = (id: string) => SUPPLIERS.find((s) => s.supplierId === id)?.supplierName ?? id
const itemOf = (id: string) => ITEMS.find((i) => i.itemId === id)

/** Line value before tax. */
const lineValue = (qty: number, rate: number) => qty * rate

function poValue(po: PurchaseOrder) {
  const net = po.lines.reduce((s, l) => s + lineValue(l.orderedQty, l.ratePerUom), 0)
  return net * (1 + po.gstPercent / 100)
}

export default function PurchaseOrderPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(PURCHASE_ORDERS[0].poId)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? PURCHASE_ORDERS : PURCHASE_ORDERS.filter((p) => p.poStatus === tab)),
    [tab],
  )
  const selected = rows.find((p) => p.poId === selectedId) ?? rows[0] ?? PURCHASE_ORDERS[0]
  const receipts = GRNS.filter((g) => g.poNumber === selected.poNumber)

  const open = PURCHASE_ORDERS.filter((p) => p.poStatus === 'OPEN' || p.poStatus === 'PART_RECEIVED')
  const openValue = open.reduce((s, po) => s + poValue(po), 0)
  const pendingQty = open
    .flatMap((po) => po.lines)
    .reduce((s, l) => s + (l.orderedQty - l.receivedQty), 0)

  const columns: Column<PurchaseOrder>[] = [
    { key: 'po', header: 'PO No.', sortValue: (r) => r.poNumber, render: (r) => <StackedCell top={r.poNumber} bottom={formatDate(r.poDate)} mono /> },
    { key: 'supplier', header: 'Supplier', sortValue: (r) => supplierName(r.supplierId), render: (r) => supplierName(r.supplierId) },
    { key: 'pr', header: 'Against PR', render: (r) => (r.prNumber ? <span className="font-mono">{r.prNumber}</span> : <span className="text-fg-subtle">Direct</span>) },
    {
      key: 'items',
      header: 'Items',
      render: (r) => <span className="font-mono text-xs">{r.lines.map((l) => itemOf(l.itemId)?.itemCode).join(', ')}</span>,
    },
    {
      key: 'ordered',
      header: 'Ordered',
      align: 'right',
      sortValue: (r) => r.lines.reduce((s, l) => s + l.orderedQty, 0),
      render: (r) => <span className="font-mono">{formatNumber(r.lines.reduce((s, l) => s + l.orderedQty, 0))}</span>,
    },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      sortValue: (r) => r.lines.reduce((s, l) => s + l.receivedQty, 0),
      render: (r) => {
        const ord = r.lines.reduce((s, l) => s + l.orderedQty, 0)
        const rec = r.lines.reduce((s, l) => s + l.receivedQty, 0)
        return (
          <span className={rec < ord ? 'font-mono text-warning' : 'font-mono'}>
            {formatNumber(rec)}
            <span className="text-fg-muted"> / {formatNumber(ord)}</span>
          </span>
        )
      },
    },
    { key: 'value', header: 'Value incl. GST', align: 'right', sortValue: (r) => poValue(r), render: (r) => <span className="font-mono font-semibold">{formatCurrency(poValue(r), 0)}</span> },
    { key: 'expected', header: 'Expected', sortValue: (r) => r.expectedDate, render: (r) => <span className="font-mono">{formatDate(r.expectedDate)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.poStatus, render: (r) => <Badge tone={STATUS_TONE[r.poStatus]}>{STATUS_LABEL[r.poStatus]}</Badge> },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Procurement"
        title="Purchase Orders"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            New purchase order
          </Button>
        }
      />

      <>
        <DataTable
          title="Order book"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.poId}
          mainColumns="po,supplier,received,status"
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          selectedKey={selected.poId}
          onSelect={(r) => setSelectedId(r.poId)}
          onOpen={(r) => { setSelectedId(r.poId); setDetailOpen(true) }}
        />

        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={selected.poNumber}
          subtitle={supplierName(selected.supplierId)}
          badge={{ label: STATUS_LABEL[selected.poStatus], tone: STATUS_TONE[selected.poStatus] }}
        >
          <SpecList
            rows={[
              { label: 'Supplier', value: supplierName(selected.supplierId), mono: false },
              { label: 'Against PR', value: selected.prNumber ?? 'Direct order' },
              { label: 'Expected', value: formatDate(selected.expectedDate) },
              { label: 'GST', value: `${selected.gstPercent} %` },
            ]}
          />
          <Divider />
          <ul className="space-y-2.5">
            {selected.lines.map((line) => {
              const item = itemOf(line.itemId)
              const pending = line.orderedQty - line.receivedQty
              return (
                <li key={line.lineId} className="rounded-md border border-bd-default px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{item?.itemName ?? line.itemId}</span>
                    <span className="shrink-0 font-mono text-sm font-semibold">
                      {formatCurrency(lineValue(line.orderedQty, line.ratePerUom), 0)}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-fg-muted">
                    {formatNumber(line.orderedQty)} {item?.uom} @ {formatCurrency(line.ratePerUom, 0)}
                    {line.thicknessMicrons ? ` · ${line.thicknessMicrons} µm · ${line.deckleWidthMm} mm deckle` : ''}
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    received {formatNumber(line.receivedQty)}
                    {pending > 0 ? (
                      <span className="text-warning"> · {formatNumber(pending)} pending</span>
                    ) : (
                      <span className="text-success"> · complete</span>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>

          {receipts.length ? (
            <>
              <Divider />
              <p className="label-caps mb-1.5">Receipts against this order</p>
              <ul className="space-y-1">
                {receipts.map((g) => (
                  <li key={g.grnId} className="flex items-center justify-between font-mono text-xs">
                    <span>{g.grnNumber}</span>
                    <span className="text-fg-muted">{formatDate(g.grnDate)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </DetailModal>
      </>

      <PurchaseOrderModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

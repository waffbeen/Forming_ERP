'use client'

import * as React from 'react'
import { AlertTriangle, CheckCircle2, Clock, PackagePlus, Plus } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, Panel, PanelBody, PanelHeader,
  SpecList, StackedCell, StatsCard, StatsGrid, Tabs,
} from '@/components/ui'
import { GrnModal } from '@/components/modals'
import { BINS, GRNS, ITEMS, SUPPLIERS, USERS } from '@/data'
import { PLANT } from '@/config/plant'
import { formatDate, formatNumber } from '@/lib/utils'
import type { GoodsReceiptNote, GrnLineStatus } from '@/types/procurement'

const QC_TONE: Record<GrnLineStatus, 'muted' | 'warning' | 'success' | 'error'> = {
  PENDING_QC: 'muted',
  APPROVED: 'success',
  QUARANTINE: 'warning',
  REJECTED: 'error',
}

const QC_LABEL: Record<GrnLineStatus, string> = {
  PENDING_QC: 'Pending IQC',
  APPROVED: 'Approved',
  QUARANTINE: 'Quarantine',
  REJECTED: 'Rejected',
}

const TABS = [
  { id: 'ALL', label: 'All', count: GRNS.length },
  { id: 'PENDING_QC', label: 'Pending IQC' },
  { id: 'QUARANTINE', label: 'Held' },
  { id: 'REJECTED', label: 'Rejected' },
]

const supplierName = (id: string) => SUPPLIERS.find((s) => s.supplierId === id)?.supplierName ?? id
const itemOf = (id: string) => ITEMS.find((i) => i.itemId === id)
const binCode = (id: string | null) => (id ? (BINS.find((b) => b.binId === id)?.binCode ?? '—') : '—')
const userName = (id: string | null) => (id ? (USERS.find((u) => u.userId === id)?.userName ?? '—') : '—')

/** A GRN takes the worst outcome of its lines, since that is what holds it up. */
function grnStatus(grn: GoodsReceiptNote): GrnLineStatus {
  const order: GrnLineStatus[] = ['REJECTED', 'QUARANTINE', 'PENDING_QC', 'APPROVED']
  return order.find((s) => grn.lines.some((l) => l.qcStatus === s)) ?? 'APPROVED'
}

export default function GrnPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(GRNS[0].grnId)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? GRNS : GRNS.filter((g) => g.lines.some((l) => l.qcStatus === tab))),
    [tab],
  )
  const selected = rows.find((g) => g.grnId === selectedId) ?? rows[0] ?? GRNS[0]

  const allLines = GRNS.flatMap((g) => g.lines)
  const pending = allLines.filter((l) => l.qcStatus === 'PENDING_QC')
  const approved = allLines.filter((l) => l.qcStatus === 'APPROVED')
  const rejected = allLines.filter((l) => l.qcStatus === 'REJECTED')
  const receivedKg = approved.reduce((s, l) => s + l.receivedQty, 0)

  const columns: Column<GoodsReceiptNote>[] = [
    { key: 'grn', header: 'GRN No.', sortValue: (r) => r.grnNumber, render: (r) => <StackedCell top={r.grnNumber} bottom={formatDate(r.grnDate)} mono /> },
    { key: 'po', header: 'Against PO', sortValue: (r) => r.poNumber, render: (r) => <span className="font-mono">{r.poNumber}</span> },
    { key: 'supplier', header: 'Supplier', sortValue: (r) => supplierName(r.supplierId), render: (r) => supplierName(r.supplierId) },
    { key: 'challan', header: 'Challan', render: (r) => <span className="font-mono text-xs">{r.supplierChallanNo}</span> },
    { key: 'lines', header: 'Lines', align: 'right', sortValue: (r) => r.lines.length, render: (r) => <span className="font-mono">{r.lines.length}</span> },
    {
      key: 'qty',
      header: 'Received',
      align: 'right',
      sortValue: (r) => r.lines.reduce((s, l) => s + l.receivedQty, 0),
      render: (r) => <span className="font-mono">{formatNumber(r.lines.reduce((s, l) => s + l.receivedQty, 0))}</span>,
    },
    { key: 'inspector', header: 'Inspected by', render: (r) => (r.inspectedByUserId ? userName(r.inspectedByUserId) : <span className="text-fg-subtle">Not yet</span>) },
    { key: 'qc', header: 'IQC', sortValue: (r) => grnStatus(r), render: (r) => <Badge tone={QC_TONE[grnStatus(r)]}>{QC_LABEL[grnStatus(r)]}</Badge> },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Procurement"
        title="Goods Receipt"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            New GRN
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard label="Receipts booked" value={String(GRNS.length)} note={`${allLines.length} lines in total`} icon={PackagePlus} />
        <StatsCard label="Awaiting IQC" value={String(pending.length)} note="Cannot enter stock until inspected" noteTone="warn" icon={Clock} />
        <StatsCard label="Approved into stock" value={formatNumber(receivedKg)} unit="units" note={`${approved.length} lines cleared`} noteTone="good" icon={CheckCircle2} />
        <StatsCard label="Rejected" value={String(rejected.length)} note={`Below the ${PLANT.minMicrons} µm floor`} noteTone="bad" icon={AlertTriangle} />
      </StatsGrid>

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <DataTable
          title="Receipt register"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.grnId}
          mainColumns="grn,po,supplier,qc"
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          selectedKey={selected.grnId}
          onSelect={(r) => setSelectedId(r.grnId)}
        />

        <Panel>
          <PanelHeader
            title="Receipt lines"
            description={<span className="font-mono">{selected.grnNumber}</span>}
            action={<Badge tone={QC_TONE[grnStatus(selected)]}>{QC_LABEL[grnStatus(selected)]}</Badge>}
          />
          <PanelBody>
            <SpecList
              rows={[
                { label: 'Supplier', value: supplierName(selected.supplierId), mono: false },
                { label: 'Against PO', value: selected.poNumber },
                { label: 'Challan', value: selected.supplierChallanNo },
                { label: 'Invoice', value: selected.supplierInvoiceNo || 'Not received' },
                { label: 'Received by', value: userName(selected.receivedByUserId), mono: false },
                {
                  label: 'Inspected by',
                  value: selected.inspectedByUserId ? userName(selected.inspectedByUserId) : 'Awaiting IQC',
                  mono: false,
                },
              ]}
            />
            <Divider />
            <ul className="space-y-2.5">
              {selected.lines.map((line) => {
                const item = itemOf(line.itemId)
                const shortfall = line.challanQty - line.receivedQty
                return (
                  <li key={line.lineId} className="rounded-md border border-bd-default px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{item?.itemName ?? line.itemId}</span>
                      <Badge tone={QC_TONE[line.qcStatus]}>{QC_LABEL[line.qcStatus]}</Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-fg-muted">
                      challan {formatNumber(line.challanQty)} · weighed {formatNumber(line.receivedQty)} {item?.uom}
                      {shortfall !== 0 ? <span className="text-warning"> · {formatNumber(Math.abs(shortfall))} short</span> : null}
                    </p>
                    {line.reelId ? (
                      <p className="mt-0.5 font-mono text-xs">
                        {line.reelId} · {line.thicknessMicrons} µm · bin {binCode(line.binId)}
                      </p>
                    ) : null}
                    {line.qcRemarks ? <p className="mt-1 text-xs text-fg-subtle">{line.qcRemarks}</p> : null}
                  </li>
                )
              })}
            </ul>
            <Divider />
            <Note>
              Only a line IQC has approved creates a stock movement, so nothing reaches a bin without a receipt and an
              inspection behind it.
            </Note>
          </PanelBody>
        </Panel>
      </div>

      <GrnModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

'use client'

import * as React from 'react'
import { ClipboardCheck, Plus } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs,
} from '@/components/ui'
import { DetailModal, GrnModal, RmQcModal } from '@/components/modals'
import { BINS, GRNS, ITEMS, SUPPLIERS, USERS, qcReport, rmQcTabsOfGrn } from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { GoodsReceiptNote, GrnLineStatus, RmQcTab } from '@/types/procurement'

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

/**
 * Which QC screen this receipt opens on. Anything still to be inspected takes
 * priority, since that is the one that needs somebody; otherwise it opens
 * read-only on whichever outcome its lines landed on.
 */
function qcTabOf(grn: GoodsReceiptNote): RmQcTab {
  const tabs = rmQcTabsOfGrn(grn)
  return (
    (['PENDING', 'REJECTED', 'HOLD', 'PROCESSED'] as RmQcTab[]).find((t) => tabs.includes(t)) ??
    'PROCESSED'
  )
}

/** Receipts QC never has to touch: no format configured against the item. */
function isAutoApproved(grn: GoodsReceiptNote) {
  return rmQcTabsOfGrn(grn).length === 0
}

/** A GRN takes the worst outcome of its lines, since that is what holds it up. */
function grnStatus(grn: GoodsReceiptNote): GrnLineStatus {
  const order: GrnLineStatus[] = ['REJECTED', 'QUARANTINE', 'PENDING_QC', 'APPROVED']
  return order.find((s) => grn.lines.some((l) => l.qcStatus === s)) ?? 'APPROVED'
}

export default function GrnPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(GRNS[0].grnId)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [qcOpen, setQcOpen] = React.useState(false)

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
    {
      key: 'report',
      header: 'QC report',
      render: (r) => {
        const numbers = [...new Set(r.lines.map((l) => l.qcNumber).filter(Boolean))]
        if (isAutoApproved(r)) return <span className="text-xs text-fg-subtle">No format, auto-approved</span>
        if (numbers.length === 0) return <span className="text-xs text-fg-subtle">Not inspected</span>
        return <span className="font-mono text-xs">{numbers.join(', ')}</span>
      },
    },
    {
      key: 'split',
      header: 'Approved / held / back',
      render: (r) => {
        const approved = r.lines.reduce((s, l) => s + l.approvedQty, 0)
        const held = r.lines.reduce((s, l) => s + l.holdQty, 0)
        const back = r.lines.reduce((s, l) => s + l.rejectedQty, 0)
        if (r.lines.every((l) => !l.isQcApproved)) return <span className="text-xs text-fg-subtle">Not inspected</span>
        return (
          <span className="font-mono text-xs">
            <span className="text-success">{formatNumber(approved, 1)}</span>
            {' / '}
            <span className={held > 0 ? 'text-warning' : undefined}>{formatNumber(held, 1)}</span>
            {' / '}
            <span className={back > 0 ? 'text-error' : undefined}>{formatNumber(back, 1)}</span>
          </span>
        )
      },
    },
  ]

  /* Memoised: a fresh object on every render would rebuild the grid's columns. */
  const actions = React.useMemo(
    () => ({
      onView: (row: GoodsReceiptNote) => {
        setSelectedId(row.grnId)
        setDetailOpen(true)
      },
      onEdit: (row: GoodsReceiptNote) => {
        setSelectedId(row.grnId)
        setQcOpen(true)
      },
      showView: true,
      // Nothing is configured against the item, so there is no QC to process.
      showEdit: (row: GoodsReceiptNote) => !isAutoApproved(row),
      mode: 'buttons' as const,
      primaryActions: ['view' as const, 'edit' as const],
      labels: { view: 'View receipt', edit: 'Process QC' },
    }),
    [],
  )

  return (
    <>
      <PageHeader
        eyebrow="Procurement"
        title="Goods Receipt"
        actions={
          <>
            <Button
              icon={ClipboardCheck}
              disabled={isAutoApproved(selected)}
              onClick={() => setQcOpen(true)}
            >
              {qcTabOf(selected) === 'PENDING' ? 'Process QC' : 'QC detail'}
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
              New GRN
            </Button>
          </>
        }
      />

      <>
        <DataTable
          title="Receipt register"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.grnId}
          mainColumns="grn,po,supplier,qc"
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          selectedKey={selected.grnId}
          onSelect={(r) => setSelectedId(r.grnId)}
          onOpen={(r) => { setSelectedId(r.grnId); setDetailOpen(true) }}
          actions={actions}
        />

        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={selected.grnNumber}
          subtitle={supplierName(selected.supplierId)}
          badge={{ label: QC_LABEL[grnStatus(selected)], tone: QC_TONE[grnStatus(selected)] }}
        >
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
                  {line.isQcApproved ? (
                    <p className="mt-0.5 font-mono text-xs">
                      <span className="text-success">{formatNumber(line.approvedQty, 1)} approved</span>
                      {line.holdQty > 0 ? (
                        <span className="text-warning"> · {formatNumber(line.holdQty, 1)} held</span>
                      ) : null}
                      {line.rejectedQty > 0 ? (
                        <span className="text-error"> · {formatNumber(line.rejectedQty, 1)} back to supplier</span>
                      ) : null}
                      {line.qcNumber ? (
                        <span className="text-fg-muted"> · {line.qcNumber}</span>
                      ) : (
                        <span className="text-fg-subtle"> · no QC format, auto-approved</span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-warning">Awaiting inspection, not stock yet</p>
                  )}
                  {line.qcNumber && qcReport(line.qcNumber)?.overallResult === 'FAIL' ? (
                    <p className="mt-0.5 text-xs text-error">
                      Inspection failed on{' '}
                      {qcReport(line.qcNumber)
                        ?.characteristics.filter((c) => c.result === 'FAIL').length}{' '}
                      characteristics
                    </p>
                  ) : null}
                  {line.qcRemarks ? <p className="mt-1 text-xs text-fg-subtle">{line.qcRemarks}</p> : null}
                </li>
              )
            })}
          </ul>
          <Divider />
          <Note>
            Only the quantity RM QC approved creates a stock movement, so nothing reaches a bin without a receipt and an
            inspection behind it. Held and rejected quantities never become stock at all.
          </Note>
        </DetailModal>
      </>

      <RmQcModal
        isOpen={qcOpen}
        onClose={() => setQcOpen(false)}
        grn={selected}
        tab={qcTabOf(selected)}
      />

      <GrnModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

'use client'

import * as React from 'react'
import { ClipboardCheck } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, StackedCell, Tabs,
} from '@/components/ui'
import { RmQcModal } from '@/components/modals'
import {
  GRNS, SUPPLIERS, USERS, grnsForRmQcTab, itemNeedsQc, pendingQcLines, rejectedQty, rmQcLinesOf,
} from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { GoodsReceiptNote, RmQcTab } from '@/types/procurement'

/* Raw material QC.

   Four questions, in the order the store asks them: what is waiting to be
   inspected, what went through, what is stuck, and what is going back. A
   receipt appears on every tab its lines land on, so a roll split between
   approved and returned is visible from both sides. */

const TAB_LABEL: Record<RmQcTab, string> = {
  PENDING: 'Pending inspection',
  PROCESSED: 'Approved',
  HOLD: 'On hold',
  REJECTED: 'Rejected',
}

const supplierName = (id: string) => SUPPLIERS.find((s) => s.supplierId === id)?.supplierName ?? id
const userName = (id: string | null) => (id ? (USERS.find((u) => u.userId === id)?.userName ?? '—') : '—')

export default function RmQcPage() {
  const [tab, setTab] = React.useState<RmQcTab>('PENDING')
  const [selectedId, setSelectedId] = React.useState<string>('')
  const [qcOpen, setQcOpen] = React.useState(false)

  const rows = React.useMemo(() => grnsForRmQcTab(tab), [tab])
  const selected = rows.find((g) => g.grnId === selectedId) ?? rows[0] ?? null

  const tabs = React.useMemo(
    () =>
      (Object.keys(TAB_LABEL) as RmQcTab[]).map((id) => ({
        id,
        label: TAB_LABEL[id],
        count: grnsForRmQcTab(id).length,
      })),
    [],
  )

  const pending = pendingQcLines()
  const pendingQty = pending.reduce((s, l) => s + l.receivedQty, 0)
  const approvedQty = GRNS.flatMap((g) => g.lines).reduce((s, l) => s + l.approvedQty, 0)

  /* Auto-approved lines never reach this screen, and it is worth saying so
     rather than leaving somebody hunting for a receipt that is already in
     stock. */
  const autoApproved = GRNS.flatMap((g) => g.lines).filter(
    (l) => l.isQcApproved && !l.qcNumber && !itemNeedsQc(l.itemId),
  )

  const open = React.useCallback((grn: GoodsReceiptNote) => {
    setSelectedId(grn.grnId)
    setQcOpen(true)
  }, [])

  /* Memoised: a fresh object on every render would rebuild the grid's columns. */
  const actions = React.useMemo(
    () => ({
      onEdit: open,
      showEdit: true,
      mode: 'buttons' as const,
      primaryActions: ['edit' as const],
      labels: { edit: tab === 'PENDING' ? 'Process QC' : 'Edit QC' },
    }),
    [tab],
  )

  const columns: Column<GoodsReceiptNote>[] = [
    {
      key: 'grn',
      header: 'Receipt',
      sortValue: (r) => r.grnNumber,
      render: (r) => <StackedCell top={r.grnNumber} bottom={formatDate(r.grnDate)} mono />,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      sortValue: (r) => supplierName(r.supplierId),
      render: (r) => <StackedCell top={supplierName(r.supplierId)} bottom={r.supplierChallanNo} />,
    },
    { key: 'po', header: 'Against PO', render: (r) => <span className="font-mono">{r.poNumber}</span> },
    {
      key: 'batches',
      header: 'Batches',
      align: 'right',
      sortValue: (r) => rmQcLinesOf(r, tab).length,
      render: (r) => <span className="font-mono">{rmQcLinesOf(r, tab).length}</span>,
    },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      sortValue: (r) => rmQcLinesOf(r, tab).reduce((s, l) => s + l.receivedQty, 0),
      render: (r) => (
        <span className="font-mono">
          {formatNumber(rmQcLinesOf(r, tab).reduce((s, l) => s + l.receivedQty, 0), 1)}
        </span>
      ),
    },
    {
      key: 'split',
      header: 'Approved / held / back',
      render: (r) => {
        const lines = rmQcLinesOf(r, tab)
        const approved = lines.reduce((s, l) => s + l.approvedQty, 0)
        const held = lines.reduce((s, l) => s + l.holdQty, 0)
        const back = lines.reduce((s, l) => s + l.rejectedQty, 0)
        if (tab === 'PENDING') return <span className="text-fg-subtle">Not inspected</span>
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
    {
      key: 'qc',
      header: 'QC report',
      render: (r) => {
        const numbers = [...new Set(rmQcLinesOf(r, tab).map((l) => l.qcNumber).filter(Boolean))]
        if (numbers.length === 0) return <Badge tone="muted">Not inspected</Badge>
        return <span className="font-mono text-xs">{numbers.join(', ')}</span>
      },
    },
    { key: 'inspector', header: 'Inspected by', render: (r) => userName(r.inspectedByUserId) },
  ]


  return (
    <>
      <PageHeader
        eyebrow="Quality"
        title="Raw Material QC"
        actions={
          <Button
            variant="primary"
            icon={ClipboardCheck}
            disabled={!selected}
            onClick={() => selected && open(selected)}
          >
            {tab === 'PENDING' ? 'Process QC' : 'Open QC'}
          </Button>
        }
      />

      <DataTable
        title="Receipts by QC status"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.grnId}
        toolbar={<Tabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as RmQcTab)} />}
        selectedKey={selected?.grnId}
        onSelect={(r) => setSelectedId(r.grnId)}
        onOpen={open}
        actions={actions}
      />

      {selected ? (
        <Note>
          {selected.grnNumber} is selected. Process QC from the button above, the action on its row, or by opening the
          row.
        </Note>
      ) : null}

      {tab === 'PENDING' && rows.length === 0 ? (
        <Note>Nothing is waiting on the inspection table.</Note>
      ) : null}

      {autoApproved.length > 0 ? (
        <Note>
          {autoApproved.length} received lines are not listed here at all: no inspection format is configured against
          their item category, so they auto-approved at receipt and went straight to the store. Configure a QC parameter
          against the category to bring them onto this screen.
        </Note>
      ) : null}

      <Note>
        Nothing reaches a bin, or a job card, until it has been inspected here. A held or rejected quantity never
        becomes stock, so it cannot be issued to a job card even by mistake. Sending a
        signed-off receipt back to pending undoes the stock it created.
      </Note>

      {selected ? (
        <RmQcModal isOpen={qcOpen} onClose={() => setQcOpen(false)} grn={selected} tab={tab} />
      ) : null}
    </>
  )
}

'use client'

import * as React from 'react'
import { ClipboardCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell,
} from '@/components/ui'
import { DetailModal, SortingEntryModal } from '@/components/modals'
import { CUTTING_LOGS, JOB_CARDS, SORTING_LOGS } from '@/data'
import { formatNumber, formatPercent } from '@/lib/utils'
import type { SortingLog } from '@/types'

export default function SortingPage() {
  const [selectedId, setSelectedId] = React.useState(SORTING_LOGS[0].sortingLogId)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const selected = SORTING_LOGS.find((s) => s.sortingLogId === selectedId) ?? SORTING_LOGS[0]
  const job = JOB_CARDS.find((j) => j.jobCardNo === selected.jobCardNo)
  const cut = CUTTING_LOGS.find((c) => c.jobCardNo === selected.jobCardNo)

  const reasons = Object.entries(selected.rejectionByReason).sort((a, b) => b[1] - a[1])

  const columns: Column<SortingLog>[] = [
    {
      key: 'job',
      sortValue: (r) => r.jobCardNo,
      header: 'Job card',
      render: (r) => <StackedCell top={r.jobCardNo} bottom={r.sorter} mono />,
    },
    {
      key: 'input',
      sortValue: (r) => r.inputPiecesQty,
      header: 'Off the press',
      align: 'right',
      render: (r) => <span className="font-mono">{formatNumber(r.inputPiecesQty)}</span>,
    },
    {
      key: 'sorted',
      sortValue: (r) => r.sortedPiecesQty,
      header: 'Sorted',
      align: 'right',
      render: (r) => <span className="font-mono">{formatNumber(r.sortedPiecesQty)}</span>,
    },
    {
      key: 'rejected',
      sortValue: (r) => r.rejectedPiecesQty,
      header: 'Rejected',
      align: 'right',
      render: (r) => <span className="font-mono">{formatNumber(r.rejectedPiecesQty)}</span>,
    },
    {
      key: 'good',
      sortValue: (r) => r.goodPiecesQty,
      header: 'Good to packing',
      align: 'right',
      render: (r) => <span className="font-mono">{formatNumber(r.goodPiecesQty)}</span>,
    },
    {
      key: 'pending',
      sortValue: (r) => r.pendingPiecesQty,
      header: 'Queued',
      align: 'right',
      render: (r) =>
        r.pendingPiecesQty > 0 ? (
          <span className="font-mono">{formatNumber(r.pendingPiecesQty)}</span>
        ) : (
          <span className="text-fg-subtle">—</span>
        ),
    },
    {
      key: 'state',
      header: 'Table',
      render: (r) =>
        r.completed ? <Badge tone="success">Sorted</Badge> : <Badge tone="warning">Running</Badge>,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Sorting Entry"
        actions={
          <Button variant="primary" icon={ClipboardCheck} onClick={() => setCreateOpen(true)}>
            Post sorting entry
          </Button>
        }
      />

      <DataTable
        title="Sorting table log"
        rows={SORTING_LOGS}
        columns={columns}
        rowKey={(r) => r.sortingLogId}
        searchText={(r) => `${r.jobCardNo} ${r.sorter}`}
        searchPlaceholder="Search job card or sorter"
        selectedKey={selectedId}
        onSelect={(r) => setSelectedId(r.sortingLogId)}
        onOpen={(r) => {
          setSelectedId(r.sortingLogId)
          setDetailOpen(true)
        }}
        summary={{
          job: { type: 'custom', customFn: (r) => `${r.length} jobs` },
          input: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.inputPiecesQty, 0)) },
          sorted: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.sortedPiecesQty, 0)) },
          rejected: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.rejectedPiecesQty, 0)) },
          good: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.goodPiecesQty, 0)) },
          pending: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.pendingPiecesQty, 0)) },
        }}
      />

      <DetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected.jobCardNo}
        subtitle={job?.customerName ?? ''}
        badge={
          selected.completed
            ? { label: 'Table cleared', tone: 'success' }
            : { label: 'Still sorting', tone: 'warning' }
        }
      >
        <SpecList
          rows={[
            { label: 'Customer', value: job?.customerName ?? '—', mono: false },
            { label: 'Sorted by', value: selected.sorter, mono: false },
            { label: 'Shift', value: selected.shift, mono: false },
            { label: 'Cutting operator', value: cut?.operator ?? '—', mono: false },
          ]}
        />
        <Divider />
        <SpecList
          rows={[
            { label: 'Pieces off the press', value: formatNumber(selected.inputPiecesQty) },
            { label: 'Pieces sorted', value: formatNumber(selected.sortedPiecesQty) },
            { label: 'Still queued at the table', value: formatNumber(selected.pendingPiecesQty) },
            { label: 'Rejected at the table', value: formatNumber(selected.rejectedPiecesQty) },
            { label: 'Good to packing', value: formatNumber(selected.goodPiecesQty), emphasis: true },
            {
              label: 'Rejection rate',
              value:
                selected.sortedPiecesQty > 0
                  ? formatPercent((selected.rejectedPiecesQty / selected.sortedPiecesQty) * 100, 2)
                  : '—',
            },
          ]}
        />
        {reasons.length > 0 ? (
          <>
            <Divider />
            <p className="label-caps mb-2">Rejections by reason</p>
            <SpecList
              rows={reasons.map(([reason, count]) => ({
                label: reason,
                value: formatNumber(count),
                mono: true,
              }))}
            />
          </>
        ) : null}
      </DetailModal>

      <SortingEntryModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

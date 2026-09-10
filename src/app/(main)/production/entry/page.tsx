'use client'

import * as React from 'react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Column, DataTable, Divider, SpecList, StackedCell, Tabs,
} from '@/components/ui'
import { DetailModal } from '@/components/modals'
import { EMPLOYEES, PRODUCTION_ENTRIES, USERS, WORK_ORDERS, remainingQty } from '@/data'
import { formatDate, formatNumber, formatPercent } from '@/lib/utils'
import type { EntryStatus, ProductionEntry } from '@/types/production'

const STATUS_TONE: Record<EntryStatus, 'primary' | 'warning' | 'success'> = {
  RUNNING: 'primary',
  PAUSED: 'warning',
  COMPLETED: 'success',
}

const STATUS_LABEL: Record<EntryStatus, string> = {
  RUNNING: 'Running',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
}

const TABS = [
  { id: 'ALL', label: 'All', count: PRODUCTION_ENTRIES.length },
  { id: 'RUNNING', label: 'Running' },
  { id: 'COMPLETED', label: 'Completed' },
]

const workOrderOf = (pwoNumber: string) => WORK_ORDERS.find((w) => w.pwoNumber === pwoNumber)

function operatorName(employeeId: string) {
  const employee = EMPLOYEES.find((e) => e.employeeId === employeeId)
  return USERS.find((u) => u.userId === employee?.userId)?.userName ?? employeeId
}

/** Run time against the plan; anything over 100 % ran long. */
function efficiencyOf(entry: ProductionEntry) {
  const planned = entry.runMinutes - entry.downtimeMinutes
  return planned > 0 ? entry.runMinutes / planned : 1
}

export default function ProductionEntryPage() {
  const [tab, setTab] = React.useState('ALL')
  const [selectedId, setSelectedId] = React.useState(PRODUCTION_ENTRIES[0]?.entryId ?? '')
  const [detailOpen, setDetailOpen] = React.useState(false)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? PRODUCTION_ENTRIES : PRODUCTION_ENTRIES.filter((e) => e.status === tab)),
    [tab],
  )
  const selected = rows.find((e) => e.entryId === selectedId) ?? rows[0] ?? PRODUCTION_ENTRIES[0]
  const selectedWo = selected ? workOrderOf(selected.pwoNumber) : undefined

  const produced = PRODUCTION_ENTRIES.reduce((s, e) => s + e.producedQty, 0)
  const rejected = PRODUCTION_ENTRIES.reduce((s, e) => s + e.rejectedQty, 0)
  const downtime = PRODUCTION_ENTRIES.reduce((s, e) => s + e.downtimeMinutes, 0)
  const running = PRODUCTION_ENTRIES.filter((e) => e.status === 'RUNNING')

  const columns: Column<ProductionEntry>[] = [
    { key: 'date', header: 'Date', sortValue: (r) => r.entryDate, render: (r) => <StackedCell top={formatDate(r.entryDate)} bottom={`Shift ${r.shift}`} mono /> },
    { key: 'pwo', header: 'Work order', sortValue: (r) => r.pwoNumber, render: (r) => <StackedCell top={r.pwoNumber} bottom={r.jobCardNo} mono /> },
    {
      key: 'process',
      header: 'Process',
      sortValue: (r) => r.processCode,
      render: (r) => {
        const wo = workOrderOf(r.pwoNumber)
        return <StackedCell top={wo?.processName ?? r.processCode} bottom={wo?.customerName} />
      },
    },
    { key: 'machine', header: 'Machine', sortValue: (r) => r.machineCode, render: (r) => <span className="font-mono font-semibold">{r.machineCode}</span> },
    { key: 'operator', header: 'Operator', render: (r) => operatorName(r.operatorEmployeeId) },
    {
      key: 'qty',
      header: 'Produced',
      align: 'right',
      sortValue: (r) => r.producedQty,
      render: (r) => {
        const wo = workOrderOf(r.pwoNumber)
        return (
          <span className="font-mono font-semibold">
            {formatNumber(r.producedQty)} <span className="font-normal text-fg-muted">{wo?.unit.toLowerCase()}</span>
          </span>
        )
      },
    },
    {
      key: 'rejected',
      header: 'Rejected',
      align: 'right',
      sortValue: (r) => r.rejectedQty,
      render: (r) => (r.rejectedQty > 0 ? <span className="font-mono text-warning">{formatNumber(r.rejectedQty)}</span> : <span className="text-fg-subtle">—</span>),
    },
    {
      key: 'remaining',
      header: 'Remaining',
      align: 'right',
      sortValue: (r) => {
        const wo = workOrderOf(r.pwoNumber)
        return wo ? remainingQty(wo) : 0
      },
      render: (r) => {
        const wo = workOrderOf(r.pwoNumber)
        const left = wo ? remainingQty(wo) : 0
        return left > 0 ? <span className="font-mono text-warning">{formatNumber(left)}</span> : <span className="font-mono text-success">0</span>
      },
    },
    {
      key: 'downtime',
      header: 'Downtime',
      align: 'right',
      sortValue: (r) => r.downtimeMinutes,
      render: (r) => (r.downtimeMinutes > 0 ? <span className="font-mono text-error">{r.downtimeMinutes} min</span> : <span className="text-fg-subtle">None</span>),
    },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
  ]

  return (
    <>
      <PageHeader eyebrow="Production" title="Production Entry" />

      <DataTable
        title="Shift entries"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.entryId}
        mainColumns="date,pwo,machine,qty"
        toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
        selectedKey={selected?.entryId}
        onSelect={(r) => setSelectedId(r.entryId)}
        onOpen={(r) => { setSelectedId(r.entryId); setDetailOpen(true) }}
        summary={{
          date: { type: 'custom', customFn: (r) => `${r.length} entries` },
          qty: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, e) => s + e.producedQty, 0)) },
          rejected: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, e) => s + e.rejectedQty, 0)) },
          downtime: { type: 'custom', customFn: (r) => `${r.reduce((s, e) => s + e.downtimeMinutes, 0)} min` },
        }}
      />

      {selected ? (
        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={selected.pwoNumber}
          subtitle={`${selectedWo?.customerName ?? ''} · ${formatDate(selected.entryDate)}`}
          badge={{ label: STATUS_LABEL[selected.status], tone: STATUS_TONE[selected.status] }}
        >
          <SpecList
            rows={[
              { label: 'Job card', value: selected.jobCardNo },
              { label: 'Process', value: selectedWo?.processName ?? selected.processCode, mono: false },
              { label: 'Machine', value: selected.machineCode },
              { label: 'Operator', value: operatorName(selected.operatorEmployeeId), mono: false },
              { label: 'Shift', value: selected.shift, mono: false },
            ]}
          />
          <Divider />
          <SpecList
            rows={[
              { label: 'Produced', value: `${formatNumber(selected.producedQty)} ${selectedWo?.unit.toLowerCase() ?? ''}`, emphasis: true },
              { label: 'Rejected', value: formatNumber(selected.rejectedQty) },
              { label: 'Work order target', value: formatNumber(selectedWo?.targetQty ?? 0) },
              { label: 'Remaining on the order', value: formatNumber(selectedWo ? remainingQty(selectedWo) : 0) },
            ]}
          />
          <Divider />
          <SpecList
            rows={[
              { label: 'Run time', value: `${formatNumber(selected.runMinutes / 60, 1)} hours` },
              { label: 'Downtime', value: selected.downtimeMinutes > 0 ? `${selected.downtimeMinutes} minutes` : 'None' },
              { label: 'Against plan', value: formatPercent(efficiencyOf(selected) * 100, 0) },
            ]}
          />
          {selected.downtimeReason ? (
            <>
              <Divider />
              <p className="label-caps mb-1">Downtime reason</p>
              <p className="text-sm">{selected.downtimeReason}</p>
            </>
          ) : null}
          <Divider />
          <Note>
            This is the common ledger across every process. Forming and cutting keep their own screens for reel
            weights, counter readings and the QC gates; what they produce rolls up here so remaining quantity on a work
            order is answerable in one place.
          </Note>
        </DetailModal>
      ) : null}
    </>
  )
}

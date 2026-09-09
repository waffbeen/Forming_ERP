'use client'

import * as React from 'react'
import { CheckCircle2, Clock, FileCog, Send } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, StatsCard, StatsGrid, Tabs,
} from '@/components/ui'
import { DetailModal } from '@/components/modals'
import { WORK_ORDERS, awaitingRelease, completionOf, remainingQty } from '@/data'
import { formatDate, formatNumber, formatPercent } from '@/lib/utils'
import type { ProductionWorkOrder, WorkflowStage, WorkOrderPriority } from '@/types/production'

const STAGE_LABEL: Record<WorkflowStage, string> = {
  CREATED: 'Created',
  RELEASED_FOR_SCHEDULE: 'Released',
  SCHEDULED: 'Scheduled',
  IN_PRODUCTION: 'In production',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
}

const STAGE_TONE: Record<WorkflowStage, 'muted' | 'warning' | 'info' | 'primary' | 'success'> = {
  CREATED: 'muted',
  RELEASED_FOR_SCHEDULE: 'warning',
  SCHEDULED: 'info',
  IN_PRODUCTION: 'primary',
  COMPLETED: 'success',
  CLOSED: 'muted',
}

const PRIORITY_TONE: Record<WorkOrderPriority, 'muted' | 'warning' | 'error'> = {
  NORMAL: 'muted',
  URGENT: 'warning',
  CRITICAL: 'error',
}

const TABS = [
  { id: 'ALL', label: 'All', count: WORK_ORDERS.length },
  { id: 'CREATED', label: 'Awaiting release', count: awaitingRelease().length },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'IN_PRODUCTION', label: 'In production' },
  { id: 'COMPLETED', label: 'Completed' },
]

export default function WorkOrderPage() {
  const [tab, setTab] = React.useState('ALL')
  const [selectedId, setSelectedId] = React.useState(WORK_ORDERS[0].pwoId)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? WORK_ORDERS : WORK_ORDERS.filter((w) => w.workflowStage === tab)),
    [tab],
  )
  const selected = rows.find((w) => w.pwoId === selectedId) ?? rows[0] ?? WORK_ORDERS[0]

  const released = WORK_ORDERS.filter((w) => w.isReleasedForSchedule)
  const running = WORK_ORDERS.filter((w) => w.workflowStage === 'IN_PRODUCTION')
  const completed = WORK_ORDERS.filter((w) => w.workflowStage === 'COMPLETED')

  const columns: Column<ProductionWorkOrder>[] = [
    { key: 'pwo', header: 'Work order', sortValue: (r) => r.pwoNumber, render: (r) => <StackedCell top={r.pwoNumber} bottom={r.jobCardNo} mono /> },
    { key: 'customer', header: 'Customer', sortValue: (r) => r.customerName, render: (r) => <StackedCell top={r.customerName} bottom={r.artworkCode} /> },
    {
      key: 'process',
      header: 'Process',
      sortValue: (r) => r.sequenceNo,
      render: (r) => (
        <StackedCell top={r.processName} bottom={`${r.processCode} · step ${r.sequenceNo}`} />
      ),
    },
    {
      key: 'target',
      header: 'Target',
      align: 'right',
      sortValue: (r) => r.targetQty,
      render: (r) => (
        <span className="font-mono">
          {formatNumber(r.targetQty)} <span className="text-fg-muted">{r.unit.toLowerCase()}</span>
        </span>
      ),
    },
    { key: 'produced', header: 'Produced', align: 'right', sortValue: (r) => r.producedQty, render: (r) => <span className="font-mono">{formatNumber(r.producedQty)}</span> },
    {
      key: 'remaining',
      header: 'Remaining',
      align: 'right',
      sortValue: (r) => remainingQty(r),
      render: (r) => {
        const left = remainingQty(r)
        return left > 0 ? (
          <span className="font-mono text-warning">{formatNumber(left)}</span>
        ) : (
          <span className="font-mono text-success">0</span>
        )
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '140px',
      sortValue: (r) => completionOf(r),
      render: (r) => {
        const pct = completionOf(r) * 100
        return (
          <span className="flex items-center gap-2">
            <span className="h-1.5 min-w-[60px] flex-1 rounded-sm bg-bd-subtle">
              <span
                className={pct >= 100 ? 'block h-full rounded-sm bg-success' : 'block h-full rounded-sm bg-primary'}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="font-mono text-xs text-fg-muted">{formatNumber(pct, 0)} %</span>
          </span>
        )
      },
    },
    { key: 'priority', header: 'Priority', sortValue: (r) => r.priority, render: (r) => <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority.charAt(0) + r.priority.slice(1).toLowerCase()}</Badge> },
    { key: 'delivery', header: 'Delivery', sortValue: (r) => r.deliveryDate, render: (r) => <span className="font-mono">{formatDate(r.deliveryDate)}</span> },
    {
      key: 'release',
      header: 'Released',
      sortValue: (r) => String(r.isReleasedForSchedule),
      render: (r) =>
        r.isReleasedForSchedule ? (
          <Badge tone="success">Released</Badge>
        ) : (
          <Badge tone="warning">Not released</Badge>
        ),
    },
    { key: 'stage', header: 'Stage', sortValue: (r) => r.workflowStage, render: (r) => <Badge tone={STAGE_TONE[r.workflowStage]}>{STAGE_LABEL[r.workflowStage]}</Badge> },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Work Orders"
        actions={
          <Button variant="primary" icon={Send} disabled={awaitingRelease().length === 0}>
            Release for schedule
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard label="Work orders" value={String(WORK_ORDERS.length)} note="One per machine-bound process step" icon={FileCog} />
        <StatsCard label="Awaiting release" value={String(awaitingRelease().length)} note="Scheduling cannot see these yet" noteTone="warn" icon={Clock} />
        <StatsCard label="Released" value={String(released.length)} note={`${running.length} on a machine now`} icon={Send} />
        <StatsCard label="Completed" value={String(completed.length)} note="Ready for the next step" noteTone="good" icon={CheckCircle2} />
      </StatsGrid>

      <DataTable
        title="Work order queue"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.pwoId}
        mainColumns="pwo,customer,process,stage"
        toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
        selectedKey={selected.pwoId}
        onSelect={(r) => setSelectedId(r.pwoId)}
        onOpen={(r) => { setSelectedId(r.pwoId); setDetailOpen(true) }}
        summary={{
          pwo: { type: 'custom', customFn: (r) => `${r.length} work orders` },
          target: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, w) => s + w.targetQty, 0)) },
          produced: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, w) => s + w.producedQty, 0)) },
          remaining: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, w) => s + remainingQty(w), 0)) },
        }}
      />

      <DetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected.pwoNumber}
        subtitle={`${selected.customerName} · ${selected.processName}`}
        badge={{ label: STAGE_LABEL[selected.workflowStage], tone: STAGE_TONE[selected.workflowStage] }}
      >
        <SpecList
          rows={[
            { label: 'Job card', value: selected.jobCardNo },
            { label: 'Sales order', value: selected.soNumber },
            { label: 'Artwork', value: selected.artworkCode },
            { label: 'Process step', value: `${selected.sequenceNo} · ${selected.processCode}` },
            { label: 'Machine type', value: selected.machineType, mono: false },
          ]}
        />
        <Divider />
        <SpecList
          rows={[
            { label: 'Target', value: `${formatNumber(selected.targetQty)} ${selected.unit.toLowerCase()}` },
            { label: 'Produced', value: `${formatNumber(selected.producedQty)} ${selected.unit.toLowerCase()}`, emphasis: true },
            { label: 'Remaining', value: `${formatNumber(remainingQty(selected))} ${selected.unit.toLowerCase()}` },
            { label: 'Completion', value: formatPercent(completionOf(selected) * 100, 0) },
          ]}
        />
        <Divider />
        <SpecList
          rows={[
            { label: 'Priority', value: selected.priority, mono: false },
            { label: 'Delivery', value: formatDate(selected.deliveryDate) },
            {
              label: 'Released for schedule',
              value: selected.releasedOn ? formatDate(selected.releasedOn) : 'Not yet released',
              mono: false,
            },
          ]}
        />
        <Divider />
        <Note>
          A work order is what scheduling, the floor and job close all work on. The job card is the order; the work
          orders are the steps it breaks into, which is what lets forming and punching sit on different machines in
          different shifts.
        </Note>
      </DetailModal>
    </>
  )
}

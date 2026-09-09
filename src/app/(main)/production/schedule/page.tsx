'use client'

import * as React from 'react'
import { CalendarClock, Clock, Cog, ListOrdered } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Column, DataTable, Divider, SpecList, StackedCell, StatsCard, StatsGrid, Tabs,
} from '@/components/ui'
import { DetailModal } from '@/components/modals'
import { MACHINES, SCHEDULE_SLOTS, WORK_ORDERS, awaitingSchedule } from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { ScheduleSlot } from '@/types/production'

const SHIFT_TONE = { A: 'primary', B: 'info', GENERAL: 'muted' } as const

const DATES = [...new Set(SCHEDULE_SLOTS.map((s) => s.scheduledDate))].sort()

const TABS = [
  { id: 'ALL', label: 'All dates', count: SCHEDULE_SLOTS.length },
  ...DATES.map((d) => ({ id: d, label: formatDate(d) })),
]

const workOrderOf = (pwoNumber: string) => WORK_ORDERS.find((w) => w.pwoNumber === pwoNumber)

/** A slot that has not started but whose date has passed is running late. */
function slotState(slot: ScheduleSlot) {
  if (slot.completedAt) return { label: 'Completed', tone: 'success' as const }
  if (slot.startedAt) return { label: 'Running', tone: 'primary' as const }
  return { label: 'Queued', tone: 'muted' as const }
}

export default function SchedulePage() {
  const [tab, setTab] = React.useState('ALL')
  const [selectedId, setSelectedId] = React.useState(SCHEDULE_SLOTS[0]?.slotId ?? '')
  const [detailOpen, setDetailOpen] = React.useState(false)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? SCHEDULE_SLOTS : SCHEDULE_SLOTS.filter((s) => s.scheduledDate === tab)),
    [tab],
  )
  const selected = rows.find((s) => s.slotId === selectedId) ?? rows[0] ?? SCHEDULE_SLOTS[0]
  const selectedWo = selected ? workOrderOf(selected.pwoNumber) : undefined

  const running = SCHEDULE_SLOTS.filter((s) => s.startedAt && !s.completedAt)
  const plannedMinutes = SCHEDULE_SLOTS.reduce((s, x) => s + x.plannedMinutes, 0)
  const machinesInUse = new Set(SCHEDULE_SLOTS.map((s) => s.machineCode)).size

  const columns: Column<ScheduleSlot>[] = [
    { key: 'date', header: 'Date', sortValue: (r) => `${r.scheduledDate}${r.shift}${r.sequenceNo}`, render: (r) => <StackedCell top={formatDate(r.scheduledDate)} bottom={`Shift ${r.shift}`} mono /> },
    { key: 'machine', header: 'Machine', sortValue: (r) => r.machineCode, render: (r) => <span className="font-mono font-semibold">{r.machineCode}</span> },
    {
      key: 'seq',
      header: 'Queue position',
      align: 'right',
      sortValue: (r) => r.sequenceNo,
      render: (r) => <span className="font-mono">{r.sequenceNo}</span>,
    },
    { key: 'pwo', header: 'Work order', sortValue: (r) => r.pwoNumber, render: (r) => <StackedCell top={r.pwoNumber} bottom={r.jobCardNo} mono /> },
    {
      key: 'job',
      header: 'Job',
      render: (r) => {
        const wo = workOrderOf(r.pwoNumber)
        return <StackedCell top={wo?.customerName ?? '—'} bottom={wo?.processName} />
      },
    },
    {
      key: 'qty',
      header: 'Planned qty',
      align: 'right',
      sortValue: (r) => r.plannedQty,
      render: (r) => {
        const wo = workOrderOf(r.pwoNumber)
        return (
          <span className="font-mono">
            {formatNumber(r.plannedQty)} <span className="text-fg-muted">{wo?.unit.toLowerCase()}</span>
          </span>
        )
      },
    },
    {
      key: 'mins',
      header: 'Planned run',
      align: 'right',
      sortValue: (r) => r.plannedMinutes,
      render: (r) => <span className="font-mono">{formatNumber(r.plannedMinutes / 60, 1)} h</span>,
    },
    { key: 'shift', header: 'Shift', sortValue: (r) => r.shift, render: (r) => <Badge tone={SHIFT_TONE[r.shift]}>Shift {r.shift}</Badge> },
    { key: 'state', header: 'State', sortValue: (r) => slotState(r).label, render: (r) => <Badge tone={slotState(r).tone}>{slotState(r).label}</Badge> },
  ]

  return (
    <>
      <PageHeader eyebrow="Production" title="Schedule" />

      <StatsGrid>
        <StatsCard label="Scheduled slots" value={String(SCHEDULE_SLOTS.length)} note={`Across ${DATES.length} days`} icon={CalendarClock} />
        <StatsCard label="Awaiting a slot" value={String(awaitingSchedule().length)} note="Released but not yet placed" noteTone="warn" icon={ListOrdered} />
        <StatsCard label="Running now" value={String(running.length)} note="Started, not finished" icon={Clock} />
        <StatsCard label="Machine hours planned" value={formatNumber(plannedMinutes / 60, 1)} note={`Across ${machinesInUse} of ${MACHINES.length} machines`} icon={Cog} />
      </StatsGrid>

      <DataTable
        title="Machine schedule"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.slotId}
        mainColumns="date,machine,pwo,state"
        toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
        selectedKey={selected?.slotId}
        onSelect={(r) => setSelectedId(r.slotId)}
        onOpen={(r) => { setSelectedId(r.slotId); setDetailOpen(true) }}
        summary={{
          date: { type: 'custom', customFn: (r) => `${r.length} slots` },
          qty: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.plannedQty, 0)) },
          mins: { type: 'custom', customFn: (r) => `${formatNumber(r.reduce((s, x) => s + x.plannedMinutes, 0) / 60, 1)} h` },
        }}
      />

      {selected ? (
        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={`${selected.machineCode} · position ${selected.sequenceNo}`}
          subtitle={`${formatDate(selected.scheduledDate)} · Shift ${selected.shift}`}
          badge={{ label: slotState(selected).label, tone: slotState(selected).tone }}
        >
          <SpecList
            rows={[
              { label: 'Work order', value: selected.pwoNumber },
              { label: 'Job card', value: selected.jobCardNo },
              { label: 'Customer', value: selectedWo?.customerName ?? '—', mono: false },
              { label: 'Process', value: selectedWo?.processName ?? '—', mono: false },
            ]}
          />
          <Divider />
          <SpecList
            rows={[
              { label: 'Planned quantity', value: `${formatNumber(selected.plannedQty)} ${selectedWo?.unit.toLowerCase() ?? ''}`, emphasis: true },
              { label: 'Planned run time', value: `${formatNumber(selected.plannedMinutes / 60, 1)} hours` },
              { label: 'Started', value: selected.startedAt ?? 'Not started' },
              { label: 'Completed', value: selected.completedAt ?? 'Not finished' },
            ]}
          />
          <Divider />
          <Note>
            Queue position is per machine, per date, per shift, so two work orders cannot hold the same slot. Changing
            a position re-sequences the rest of that shift rather than overwriting it.
          </Note>
        </DetailModal>
      ) : null}
    </>
  )
}

'use client'

import { Lock, Route, Timer, Wrench } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Badge, Chip, Column, StackedCell } from '@/components/ui'
import { ProcessModal } from '@/components/modals'
import { PROCESSES } from '@/data'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import type { Process, ProcessStage } from '@/types/masters'

const STAGE_TONE: Record<ProcessStage, 'primary' | 'info' | 'success' | 'warning' | 'muted'> = {
  FORMING: 'primary',
  PUNCHING: 'info',
  PACKING: 'success',
  QC: 'warning',
  DISPATCH: 'muted',
  RECYCLING: 'muted',
}

const CHARGE_LABEL = {
  PER_PIECE: '₹ / piece',
  PER_SHEET: '₹ / sheet',
  PER_HOUR: '₹ / hour',
} as const

const columns: Column<Process>[] = [
  { key: 'seq', header: 'Seq', align: 'right', sortValue: (r) => r.sequenceNo, render: (r) => <span className="font-mono text-fg-muted">{r.sequenceNo}</span> },
  {
    key: 'name',
    header: 'Process',
    sortValue: (r) => r.processName,
    render: (r) => <StackedCell top={r.processName} bottom={r.processCode} />,
  },
  { key: 'stage', header: 'Stage', sortValue: (r) => r.stage, render: (r) => <Badge tone={STAGE_TONE[r.stage]}>{r.stage.charAt(0) + r.stage.slice(1).toLowerCase()}</Badge> },
  { key: 'dept', header: 'Department', sortValue: (r) => r.department, render: (r) => r.department },
  {
    key: 'units',
    header: 'Unit conversion',
    render: (r) => (
      <span className="font-mono">
        {r.startUnit} <span className="text-fg-subtle">→</span> {r.endUnit}
      </span>
    ),
  },
  { key: 'charges', header: 'Type of charges', sortValue: (r) => r.typeOfCharges, render: (r) => CHARGE_LABEL[r.typeOfCharges] },
  {
    key: 'rate',
    header: 'Rate',
    align: 'right',
    sortValue: (r) => r.rate,
    render: (r) => (r.rate > 0 ? <span className="font-mono font-semibold">{formatCurrency(r.rate, r.rate < 10 ? 2 : 0)}</span> : <span className="text-fg-subtle">—</span>),
  },
  { key: 'min', header: 'Min. charges', align: 'right', sortValue: (r) => r.minimumCharges, render: (r) => <span className="font-mono">{r.minimumCharges > 0 ? formatCurrency(r.minimumCharges, 0) : '—'}</span> },
  { key: 'setup', header: 'Setup', align: 'right', sortValue: (r) => r.setupCharges, render: (r) => <span className="font-mono">{r.setupCharges > 0 ? formatCurrency(r.setupCharges, 0) : '—'}</span> },
  { key: 'time', header: 'Std time', align: 'right', sortValue: (r) => r.standardTimeMins, render: (r) => <span className="font-mono">{r.standardTimeMins} min</span> },
  { key: 'waste', header: 'Waste', align: 'right', sortValue: (r) => r.processWastePercent, render: (r) => <span className="font-mono">{r.processWastePercent > 0 ? formatPercent(r.processWastePercent) : '—'}</span> },
  {
    key: 'gates',
    header: 'Gates',
    render: (r) => (
      <span className="flex gap-1">
        {r.toolRequired ? <Chip>Tool</Chip> : null}
        {r.requiresLineClearance ? <Chip>Clearance</Chip> : null}
        {r.requiresFpa ? <Chip>FPA</Chip> : null}
        {!r.toolRequired && !r.requiresLineClearance && !r.requiresFpa ? (
          <span className="text-fg-subtle">None</span>
        ) : null}
      </span>
    ),
  },
]

export default function ProcessMasterPage() {
  const gated = PROCESSES.filter((p) => p.requiresLineClearance)
  const totalMins = PROCESSES.reduce((s, p) => s + p.standardTimeMins, 0)
  const conversionPerPc = PROCESSES.filter((p) => p.typeOfCharges === 'PER_PIECE').reduce((s, p) => s + p.rate, 0)

  return (
    <MasterPage
      title="Processes"
      entityName="process"
      stats={[
        { label: 'Process steps', value: String(PROCESSES.length), note: 'Sequenced end to end', icon: Route },
        { label: 'QC-gated steps', value: String(gated.length), note: 'Cannot start without clearance', noteTone: 'warn', icon: Lock },
        { label: 'Standard route time', value: formatNumber(totalMins / 60, 1), unit: 'hours', note: 'For a typical job', icon: Timer },
        { label: 'Conversion cost', value: formatNumber(conversionPerPc, 2), unit: '₹ / pc', note: 'Piece-rated steps combined', icon: Wrench },
      ]}
      rows={PROCESSES}
      columns={columns}
      rowKey={(r) => r.processId}
      createModal={(props) => <ProcessModal {...props} />}
    />
  )
}

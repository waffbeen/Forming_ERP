'use client'

import { Cog, Flame, Scissors, Wrench } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { MachineModal } from '@/components/modals'
import { MACHINES } from '@/data'
import { PLANT } from '@/config/plant'
import type { Machine } from '@/types'

const columns: Column<Machine>[] = [
  { key: 'code', sortValue: (r) => r.machineCode, header: 'Machine', render: (r) => <StackedCell top={r.machineCode} bottom={r.machineName} mono /> },
  {
    key: 'type', sortValue: (r) => r.type,
    header: 'Stage',
    render: (r) => (
      <Badge tone={r.type === 'FORMING' ? 'primary' : 'info'}>{r.type === 'FORMING' ? 'Forming' : 'Punching'}</Badge>
    ),
  },
  {
    key: 'bed',
    header: 'Bed size',
    align: 'right',
    render: (r) => (
      <span className="font-mono">
        {r.bedLengthMm} × {r.bedWidthMm} mm
      </span>
    ),
  },
  {
    key: 'stroke', sortValue: (r) => r.sheetsPerStroke,
    header: 'Sheets / stroke',
    align: 'right',
    render: (r) =>
      r.type === 'PUNCHING' ? (
        <span className="font-mono">
          {r.sheetsPerStroke} <span className="text-fg-muted">(6 + 6)</span>
        </span>
      ) : (
        <span className="font-mono">{r.sheetsPerStroke}</span>
      ),
  },
  { key: 'spm', sortValue: (r) => r.strokesPerMin, header: 'Strokes / min', align: 'right', render: (r) => <span className="font-mono">{r.strokesPerMin}</span> },
  {
    key: 'throughput',
    header: 'Sheets / hour',
    align: 'right',
    render: (r) => <span className="font-mono font-semibold">{r.strokesPerMin * r.sheetsPerStroke * 60}</span>,
  },
  {
    key: 'status', sortValue: (r) => r.status,
    header: 'Status',
    render: (r) => (
      <Badge tone={r.status === 'RUNNING' ? 'success' : r.status === 'IDLE' ? 'muted' : 'warning'}>
        {r.status === 'RUNNING' ? 'Running' : r.status === 'IDLE' ? 'Idle' : 'Maintenance'}
      </Badge>
    ),
  },
]

export default function MachineMasterPage() {
  const forming = MACHINES.filter((m) => m.type === 'FORMING')
  const punching = MACHINES.filter((m) => m.type === 'PUNCHING')

  return (
    <MasterPage
      title="Machines"
      entityName="machine"
      stats={[
        { label: 'Machines', value: String(MACHINES.length), note: 'Across both stages', icon: Cog },
        { label: 'Forming lines', value: String(forming.length), note: `All on a ${PLANT.bedLengthMm} × ${PLANT.bedWidthMm} mm bed`, icon: Flame },
        { label: 'Punching presses', value: String(punching.length), note: `${PLANT.sheetsPerStroke} sheets per stroke`, icon: Scissors },
        {
          label: 'Under maintenance',
          value: String(MACHINES.filter((m) => m.status === 'MAINTENANCE').length),
          note: 'TF-03 deep draw line',
          noteTone: 'warn',
          icon: Wrench,
        },
      ]}
      rows={MACHINES}
      columns={columns}
      rowKey={(r) => r.machineId}
      createModal={(props) => <MachineModal {...props} />}
    />
  )
}

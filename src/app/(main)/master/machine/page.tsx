'use client'

import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { MachineModal } from '@/components/modals'
import { MACHINES } from '@/data'
import type { Machine } from '@/types'

const columns: Column<Machine>[] = [
  { key: 'code', sortValue: (r) => r.machineCode, header: 'Machine', render: (r) => <StackedCell top={r.machineCode} bottom={r.machineName} mono /> },
  {
    key: 'type', sortValue: (r) => r.type,
    header: 'Stage',
    render: (r) => (
      <Badge tone={r.type === 'FORMING' ? 'primary' : 'info'}>{r.type === 'FORMING' ? 'Forming' : 'Cutting'}</Badge>
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
      r.type === 'CUTTING' ? (
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
  const cutting = MACHINES.filter((m) => m.type === 'CUTTING')

  return (
    <MasterPage
      title="Machines"
      entityName="machine"
      rows={MACHINES}
      columns={columns}
      rowKey={(r) => r.machineId}
      createModal={(props) => <MachineModal {...props} />}
    />
  )
}

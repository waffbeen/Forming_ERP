'use client'

import { AlertTriangle, Boxes, Warehouse as WarehouseIcon, Weight } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { BinModal } from '@/components/modals'
import { BINS, WAREHOUSES } from '@/data'
import { formatNumber, formatPercent } from '@/lib/utils'
import type { Bin, BinType } from '@/types/masters'

const BIN_LABEL: Record<BinType, string> = {
  QC_APPROVED: 'QC approved',
  QUARANTINE: 'Quarantine',
  REJECTED: 'Rejected',
  FINISHED_GOODS: 'Finished goods',
  SCRAP: 'Scrap',
  GENERAL: 'General',
}

const BIN_TONE = {
  QC_APPROVED: 'success',
  QUARANTINE: 'warning',
  REJECTED: 'error',
  FINISHED_GOODS: 'primary',
  SCRAP: 'info',
  GENERAL: 'muted',
} as const

const columns: Column<Bin>[] = [
  { key: 'code', header: 'Bin', sortValue: (r) => r.binCode, render: (r) => <StackedCell top={r.binCode} bottom={r.binName} mono /> },
  {
    key: 'warehouse',
    header: 'Warehouse',
    sortValue: (r) => r.warehouseId,
    render: (r) => WAREHOUSES.find((w) => w.warehouseId === r.warehouseId)?.warehouseName ?? '—',
  },
  { key: 'type', header: 'Bin type', sortValue: (r) => r.binType, render: (r) => <Badge tone={BIN_TONE[r.binType]}>{BIN_LABEL[r.binType]}</Badge> },
  { key: 'capacity', header: 'Capacity', align: 'right', sortValue: (r) => r.capacityKg, render: (r) => <span className="font-mono text-fg-muted">{formatNumber(r.capacityKg)} kg</span> },
  { key: 'occupied', header: 'Occupied', align: 'right', sortValue: (r) => r.occupiedKg, render: (r) => <span className="font-mono font-semibold">{formatNumber(r.occupiedKg, 1)} kg</span> },
  {
    key: 'fill',
    header: 'Utilisation',
    width: '150px',
    sortValue: (r) => r.occupiedKg / r.capacityKg,
    render: (r) => {
      const pct = Math.min((r.occupiedKg / r.capacityKg) * 100, 100)
      const tight = pct >= 85
      return (
        <span className="flex items-center gap-2">
          <span className="h-1.5 min-w-[60px] flex-1 rounded-sm bg-bd-subtle">
            <span
              className={tight ? 'block h-full rounded-sm bg-warning' : 'block h-full rounded-sm bg-primary'}
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="font-mono text-xs text-fg-muted">{formatNumber(pct, 0)} %</span>
        </span>
      )
    },
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => r.status,
    render: (r) => (r.status === 'ACTIVE' ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>),
  },
]

export default function WarehouseMasterPage() {
  const totalCapacity = BINS.reduce((s, b) => s + b.capacityKg, 0)
  const totalOccupied = BINS.reduce((s, b) => s + b.occupiedKg, 0)
  const nearFull = BINS.filter((b) => b.occupiedKg / b.capacityKg >= 0.85)
  const segregation = BINS.filter((b) =>
    ['QC_APPROVED', 'QUARANTINE', 'REJECTED'].includes(b.binType),
  )

  return (
    <MasterPage
      title="Warehouse & Bins"
      entityName="bin"
      stats={[
        { label: 'Warehouses', value: String(WAREHOUSES.length), note: `${BINS.length} bins in total`, icon: WarehouseIcon },
        { label: 'Stock held', value: formatNumber(totalOccupied, 0), unit: 'kg', note: `${formatPercent((totalOccupied / totalCapacity) * 100, 0)} of capacity`, icon: Weight },
        { label: 'Segregation bins', value: String(segregation.length), note: 'Approved, hold and rejected', icon: Boxes },
        { label: 'Near capacity', value: String(nearFull.length), note: nearFull[0]?.binCode ?? 'None above 85 %', noteTone: nearFull.length ? 'warn' : 'good', icon: AlertTriangle },
      ]}
      rows={BINS}
      columns={columns}
      rowKey={(r) => r.binId}
      createModal={(props) => <BinModal {...props} />}
    />
  )
}

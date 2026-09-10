'use client'

import { MasterPage } from '@/components/layout'
import { Chip, Column, StackedCell } from '@/components/ui'
import { MaterialModal } from '@/components/modals'
import { MATERIALS } from '@/data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { MaterialGrade } from '@/types'

const columns: Column<MaterialGrade>[] = [
  { key: 'type', sortValue: (r) => r.materialType, header: 'Polymer', render: (r) => <StackedCell top={r.materialType} bottom={r.grade} /> },
  {
    key: 'density', sortValue: (r) => r.densityGCm3,
    header: 'Density',
    align: 'right',
    render: (r) => <span className="font-mono">{formatNumber(r.densityGCm3, 2)} g/cm³</span>,
  },
  {
    key: 'range',
    header: 'Thickness range',
    align: 'right',
    render: (r) => (
      <span className="font-mono">
        {r.minMicrons} – {r.maxMicrons} µm
      </span>
    ),
  },
  { key: 'rate', sortValue: (r) => r.ratePerKg, header: 'Rate / kg', align: 'right', render: (r) => <span className="font-mono">{formatCurrency(r.ratePerKg, 0)}</span> },
  {
    key: 'scrap', sortValue: (r) => r.scrapRatePerKg,
    header: 'Scrap rate / kg',
    align: 'right',
    render: (r) => <span className="font-mono">{formatCurrency(r.scrapRatePerKg, 0)}</span>,
  },
  {
    key: 'recovery',
    header: 'Recovery',
    align: 'right',
    render: (r) => <span className="font-mono">{formatNumber((r.scrapRatePerKg / r.ratePerKg) * 100, 0)} %</span>,
  },
  {
    key: 'colours',
    header: 'Colours sourced',
    render: (r) => (
      <span className="flex gap-1">
        {r.colours.map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </span>
    ),
  },
]

export default function MaterialMasterPage() {
  const avgRate = MATERIALS.reduce((s, m) => s + m.ratePerKg, 0) / MATERIALS.length

  return (
    <MasterPage
      title="Material Grades"
      entityName="grade"
      rows={MATERIALS}
      columns={columns}
      rowKey={(r) => r.materialId}
      createModal={(props) => <MaterialModal {...props} />}
    />
  )
}

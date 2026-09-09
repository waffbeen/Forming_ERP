'use client'

import * as React from 'react'
import { Factory, Recycle, Truck, Weight } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Column, DataTable, Panel, PanelBody, PanelHeader, SpecList,
  StackedCell, StatsCard, StatsGrid,
} from '@/components/ui'
import { MATERIALS, SCRAP_ENTRIES } from '@/data'
import { formatCurrency, formatDate, formatKg, formatNumber, formatPercent } from '@/lib/utils'
import type { MaterialType, ScrapEntry } from '@/types'

export default function RecyclingPage() {
  const totalKg = SCRAP_ENTRIES.reduce((s, e) => s + e.totalKg, 0)
  const skeletonKg = SCRAP_ENTRIES.reduce((s, e) => s + e.skeletonKg, 0)
  const rejectKg = SCRAP_ENTRIES.reduce((s, e) => s + e.rejectKg, 0)
  const inHouseKg = SCRAP_ENTRIES.filter((e) => e.route === 'IN_HOUSE').reduce((s, e) => s + e.totalKg, 0)

  const recoveryValue = SCRAP_ENTRIES.reduce((sum, e) => {
    const rate = MATERIALS.find((m) => m.materialType === e.materialType)?.scrapRatePerKg ?? 0
    return sum + e.totalKg * rate
  }, 0)

  /** Scrap split by polymer, because each grade is recycled and priced separately. */
  const byMaterial = React.useMemo(() => {
    const map = new Map<MaterialType, number>()
    SCRAP_ENTRIES.forEach((e) => map.set(e.materialType, (map.get(e.materialType) ?? 0) + e.totalKg))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  const columns: Column<ScrapEntry>[] = [
    { key: 'note', sortValue: (r) => r.transferNote, header: 'Transfer note', render: (r) => <StackedCell top={r.transferNote} bottom={r.jobCardNo} mono /> },
    { key: 'mat', sortValue: (r) => r.materialType, header: 'Material', render: (r) => r.materialType },
    { key: 'skel', sortValue: (r) => r.skeletonKg, header: 'Skeleton kg', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.skeletonKg, 1)}</span> },
    { key: 'rej', sortValue: (r) => r.rejectKg, header: 'Reject kg', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.rejectKg, 1)}</span> },
    { key: 'total', sortValue: (r) => r.totalKg, header: 'Total kg', align: 'right', render: (r) => <span className="font-mono font-semibold">{formatNumber(r.totalKg, 1)}</span> },
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <Badge tone={r.route === 'IN_HOUSE' ? 'primary' : 'info'}>
          {r.route === 'IN_HOUSE' ? 'In-house grinder' : 'External recycler'}
        </Badge>
      ),
    },
    { key: 'date', sortValue: (r) => r.date, header: 'Date', render: (r) => <span className="font-mono">{formatDate(r.date)}</span> },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Fulfilment"
        title="Recycling"
      />

      <StatsGrid>
        <StatsCard label="Total to recycling" value={formatNumber(totalKg, 1)} unit="kg" note="Across five job cards" icon={Recycle} />
        <StatsCard
          label="Skeleton trim"
          value={formatNumber(skeletonKg, 1)}
          unit="kg"
          note={`${formatPercent((skeletonKg / totalKg) * 100)} of all scrap`}
          icon={Weight}
        />
        <StatsCard label="Rejected trays" value={formatNumber(rejectKg, 1)} unit="kg" note="Pulled at packing inspection" noteTone="warn" icon={Weight} />
        <StatsCard
          label="Recovery value"
          value={formatNumber(recoveryValue, 0)}
          unit="₹"
          note="Credited back against job costing"
          noteTone="good"
          icon={Truck}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <DataTable
          title="Scrap transfer register"
          rows={SCRAP_ENTRIES}
          columns={columns}
          rowKey={(r) => r.scrapId}
          searchText={(r) => `${r.transferNote} ${r.jobCardNo} ${r.materialType}`}
          searchPlaceholder="Search transfer note, job card or material"
        />

        <div className="flex flex-col gap-3.5">
          <Panel>
            <PanelHeader title="By polymer" />
            <PanelBody>
              <ul className="space-y-2.5">
                {byMaterial.map(([material, kg]) => {
                  const rate = MATERIALS.find((m) => m.materialType === material)?.scrapRatePerKg ?? 0
                  return (
                    <li key={material}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="font-medium">{material}</span>
                        <span className="font-mono text-fg-muted">
                          {formatKg(kg)} · {formatCurrency(kg * rate, 0)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-sm bg-bd-subtle">
                        <div
                          className="h-full rounded-sm bg-primary"
                          style={{ width: `${(kg / totalKg) * 100}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Routing" action={<Factory className="h-4 w-4 text-fg-muted" />} />
            <PanelBody>
              <SpecList
                rows={[
                  { label: 'In-house grinder', value: formatKg(inHouseKg), emphasis: true },
                  { label: 'External recycler', value: formatKg(totalKg - inHouseKg) },
                  { label: 'Landfill', value: '0.0 kg' },
                ]}
              />
            </PanelBody>
        </Panel>
        </div>
      </div>
    </>
  )
}

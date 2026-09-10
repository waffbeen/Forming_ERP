'use client'

import { PageHeader } from '@/components/layout'
import {
  Badge, Column, DataTable, Divider, Panel, PanelBody, PanelHeader, SpecList, StackedCell,
} from '@/components/ui'
import { StageStrip } from '@/components/forming'
import { QcStatusBadge } from '@/lib/shared-ui'
import {
  FORMING_LOGS, JOB_CARDS, MACHINES, CUTTING_LOGS, REELS, SALES_ORDERS, SCRAP_ENTRIES,
  orderValue,
} from '@/data'
import { PLANT } from '@/config/plant'
import { formatKg, formatNumber } from '@/lib/utils'
import type { JobCard } from '@/types'

export default function DashboardPage() {
  const openValue = SALES_ORDERS.reduce((s, o) => s + orderValue(o), 0)
  const sheetsToday = FORMING_LOGS.reduce((s, f) => s + f.outputFormedSheets, 0)
  const piecesToday = CUTTING_LOGS.reduce((s, p) => s + p.goodPiecesOutput, 0)
  const consumedKg = FORMING_LOGS.reduce((s, f) => s + f.consumedWeightKg, 0)
  const scrapKg = SCRAP_ENTRIES.reduce((s, e) => s + e.totalKg, 0)
  const blocked = JOB_CARDS.filter((j) => Object.values(j.stages).includes('BLOCKED'))
  const quarantined = REELS.filter((r) => r.qcStatus !== 'APPROVED')

  const columns: Column<JobCard>[] = [
    { key: 'jc', header: 'Job card', render: (r) => <StackedCell top={r.jobCardNo} bottom={r.customerName} mono /> },
    { key: 'artwork', header: 'Artwork', render: (r) => <span className="font-mono">{r.artworkCode}</span> },
    { key: 'target', header: 'Target pcs', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.targetPiecesQty)}</span> },
    { key: 'machine', header: 'Machine', render: (r) => `${r.formingMachineCode} / ${r.cuttingMachineCode}` },
    { key: 'stage', header: 'Stage', render: (r) => <StageStrip stages={r.stages} /> },
  ]

  return (
    <>
      <PageHeader
        eyebrow={`${PLANT.unitName} · ${PLANT.location}`}
        title="Plant Dashboard"
      />

      <>
        <DataTable
          title="Job cards on the floor"
          rows={JOB_CARDS} columns={columns} rowKey={(r) => r.jobCardId}
        />

        <div className="flex flex-col gap-3.5">
          <Panel>
            <PanelHeader title="Machine status" />
            <PanelBody>
              <ul className="space-y-2">
                {MACHINES.map((m) => (
                  <li key={m.machineId} className="flex items-center gap-2.5 text-sm">
                    <span className="font-mono font-semibold">{m.machineCode}</span>
                    <span className="truncate text-fg-muted">{m.machineName}</span>
                    <span className="ml-auto shrink-0">
                      <Badge
                        tone={m.status === 'RUNNING' ? 'success' : m.status === 'IDLE' ? 'muted' : 'warning'}
                      >
                        {m.status === 'RUNNING' ? 'Running' : m.status === 'IDLE' ? 'Idle' : 'Maintenance'}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Reels needing attention"
              action={<Badge tone="warning">{quarantined.length}</Badge>}
            />
            <PanelBody>
              <ul className="space-y-2">
                {quarantined.map((r) => (
                  <li key={r.reelId} className="flex items-center gap-2.5 text-sm">
                    <span className="font-mono font-semibold">{r.reelId}</span>
                    <span className="text-fg-muted">
                      {r.materialType} · <span className="font-mono">{r.thicknessMicrons} µm</span>
                    </span>
                    <span className="ml-auto shrink-0">
                      <QcStatusBadge status={r.qcStatus} />
                    </span>
                  </li>
                ))}
              </ul>
              <Divider />
              <SpecList
                rows={[
                  { label: 'Approved stock on hand', value: formatKg(REELS.filter((r) => r.qcStatus === 'APPROVED').reduce((s, r) => s + r.netWeightKg, 0)) },
                  { label: 'Held in quarantine', value: formatKg(quarantined.reduce((s, r) => s + r.grossWeightKg, 0)) },
                ]}
              />
            </PanelBody>
        </Panel>
        </div>
      </>
    </>
  )
}

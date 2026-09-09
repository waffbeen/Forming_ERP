'use client'

import * as React from 'react'
import { Flame, Gauge, Save, Weight } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, Panel, PanelBody, PanelHeader,
  SpecList, StackedCell, StatsCard, StatsGrid,
} from '@/components/ui'
import { FormingEntryModal } from '@/components/modals'
import { SignatureGate, ZoneTemperatures } from '@/components/forming'
import { FORMING_LOGS, JOB_CARDS, REELS, ZONE_TEMPERATURES } from '@/data'
import { FORMING_TEMPERATURE_C } from '@/config/plant'
import { formatKg, formatNumber } from '@/lib/utils'
import type { FormingLog } from '@/types'

export default function FormingPage() {
  const [selectedId, setSelectedId] = React.useState(FORMING_LOGS[0].formingLogId)
  const [createOpen, setCreateOpen] = React.useState(false)
  const selected = FORMING_LOGS.find((f) => f.formingLogId === selectedId) ?? FORMING_LOGS[0]
  const job = JOB_CARDS.find((j) => j.jobCardNo === selected.jobCardNo)
  const reel = REELS.find((r) => r.reelId === selected.reelId)

  const blocked = FORMING_LOGS.find((f) => !f.lineClearanceSigned) ?? FORMING_LOGS[0]
  const blockedJob = JOB_CARDS.find((j) => j.jobCardNo === blocked.jobCardNo)

  const sheetsToday = FORMING_LOGS.reduce((s, f) => s + f.outputFormedSheets, 0)
  const consumedToday = FORMING_LOGS.reduce((s, f) => s + f.consumedWeightKg, 0)
  const returnedToday = FORMING_LOGS.reduce((s, f) => s + f.returnedReelWeightKg, 0)

  const columns: Column<FormingLog>[] = [
    { key: 'job', sortValue: (r) => r.jobCardNo, header: 'Job card', render: (r) => <StackedCell top={r.jobCardNo} bottom={r.operator} mono /> },
    { key: 'reel', sortValue: (r) => r.reelId, header: 'Reel', render: (r) => <span className="font-mono">{r.reelId}</span> },
    {
      key: 'counter',
      header: 'Counter start → end',
      render: (r) =>
        r.outputFormedSheets > 0 ? (
          <span className="font-mono">
            {formatNumber(r.startCounterReading)} → {formatNumber(r.endCounterReading)}
          </span>
        ) : (
          <span className="text-fg-subtle">Not started</span>
        ),
    },
    { key: 'sheets', sortValue: (r) => r.outputFormedSheets, header: 'Formed sheets', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.outputFormedSheets)}</span> },
    { key: 'consumed', sortValue: (r) => r.consumedWeightKg, header: 'Consumed', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.consumedWeightKg, 1)}</span> },
    { key: 'returned', sortValue: (r) => r.returnedReelWeightKg, header: 'Returned', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.returnedReelWeightKg, 1)}</span> },
    {
      key: 'gate',
      header: 'Gate',
      render: (r) =>
        r.lineClearanceSigned && r.firstPieceQc === 'APPROVED' ? (
          <Badge tone="success">Running</Badge>
        ) : (
          <Badge tone="error">Locked</Badge>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Forming Entry"
        actions={
          <Button variant="primary" icon={Save} onClick={() => setCreateOpen(true)}>
            Post forming entry
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard label="Runs today" value={String(FORMING_LOGS.length)} note="Across TF-01 and TF-02" icon={Flame} />
        <StatsCard label="Formed sheets" value={formatNumber(sheetsToday)} note="Counted off machine strokes" icon={Gauge} />
        <StatsCard label="Reel consumed" value={formatNumber(consumedToday, 1)} unit="kg" note="Issued less returned" icon={Weight} />
        <StatsCard
          label="Returned to store"
          value={formatNumber(returnedToday, 1)}
          unit="kg"
          note="Balance credited back to reel stock"
          noteTone="good"
          icon={Weight}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3.5">
          <DataTable
            title="Forming run log"
            rows={FORMING_LOGS}
            columns={columns}
            rowKey={(r) => r.formingLogId}
            searchText={(r) => `${r.jobCardNo} ${r.reelId} ${r.operator}`}
            searchPlaceholder="Search job card, reel or operator"
            selectedKey={selectedId}
            onSelect={(r) => setSelectedId(r.formingLogId)}
          />

          <Panel>
            <PanelHeader
              title="Machine gate"
            />
            <PanelBody>
              <SignatureGate
                machineLabel={`${blockedJob?.formingMachineCode ?? 'TF-02'} forming`}
                jobLabel={`${blocked.jobCardNo} · ${blockedJob?.materialType ?? 'PVC'} ${blockedJob?.thicknessMicrons ?? 500} µm`}
                lines={[
                  {
                    id: 'residual',
                    label: 'Previous job material removed',
                    hint: 'Bed, die cavity and reel path cleared',
                    signedBy: 'Sunita R.',
                    signedAt: '09:14',
                  },
                  { id: 'clearance', label: 'QC line clearance signature', hint: 'Required before machine unlock' },
                  { id: 'first-piece', label: 'First piece approval', hint: 'Depth, thickness and clarity on sample 1' },
                ]}
              />
            </PanelBody>
        </Panel>
        </div>

        <Panel>
          <PanelHeader
            title="Run detail"
            description={<span className="font-mono">{selected.jobCardNo}</span>}
            action={<Badge tone={selected.firstPieceQc === 'APPROVED' ? 'success' : 'warning'}>First piece {selected.firstPieceQc.toLowerCase()}</Badge>}
          />
          <PanelBody>
            <SpecList
              rows={[
                { label: 'Customer', value: job?.customerName ?? '—', mono: false },
                { label: 'Artwork', value: job?.artworkCode ?? '—' },
                { label: 'Operator', value: selected.operator, mono: false },
                { label: 'Shift', value: selected.shift, mono: false },
              ]}
            />
            <Divider />
            <SpecList
              rows={[
                { label: 'Reel issued', value: selected.reelId },
                { label: 'Supplier', value: reel?.supplier ?? '—', mono: false },
                { label: 'Deckle', value: `${reel?.deckleWidthMm ?? 620} mm` },
                { label: 'Issued weight', value: formatKg(selected.issuedWeightKg) },
                { label: 'Returned weight', value: formatKg(selected.returnedReelWeightKg) },
                { label: 'Consumed', value: formatKg(selected.consumedWeightKg), emphasis: true },
              ]}
            />
            <Divider />
            <SpecList
              rows={[
                { label: 'Start counter', value: formatNumber(selected.startCounterReading) },
                { label: 'End counter', value: formatNumber(selected.endCounterReading) },
                {
                  label: 'Formed sheets',
                  value: formatNumber(selected.outputFormedSheets),
                  emphasis: true,
                },
                {
                  label: 'Grams per sheet',
                  value:
                    selected.outputFormedSheets > 0
                      ? `${formatNumber((selected.consumedWeightKg * 1000) / selected.outputFormedSheets, 1)} g`
                      : '—',
                },
              ]}
            />
            {selected.outputFormedSheets > 0 ? (
              <>
                <Divider />
                <ZoneTemperatures
                  readings={ZONE_TEMPERATURES}
                  min={FORMING_TEMPERATURE_C.PET.min}
                  max={FORMING_TEMPERATURE_C.PET.max}
                />
              </>
            ) : null}
          </PanelBody>
        </Panel>
      </div>

      <FormingEntryModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

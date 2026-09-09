'use client'

import * as React from 'react'
import { Flame, Printer, Scissors, Lock, Plus, Weight } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button, Column, DataTable, Divider, SpecList, StackedCell, StatsCard, StatsGrid, Tabs,
} from '@/components/ui'
import { DetailModal, JobCardModal } from '@/components/modals'
import { NestingDiagram, StageStrip } from '@/components/forming'
import { ARTWORKS, FORMING_LOGS, JOB_CARDS, MACHINES } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateNesting } from '@/lib/layout-calc'
import { formatKg, formatMicrons, formatNumber, formatPercent } from '@/lib/utils'
import type { JobCard } from '@/types'

const TABS = [
  { id: 'ACTIVE', label: 'Active', count: JOB_CARDS.length },
  { id: 'PLANNED', label: 'Planned' },
  { id: 'COMPLETED', label: 'Completed' },
]

export default function JobCardPage() {
  const [tab, setTab] = React.useState('ACTIVE')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(JOB_CARDS[0].jobCardId)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const selected = JOB_CARDS.find((j) => j.jobCardId === selectedId) ?? JOB_CARDS[0]
  const artwork = ARTWORKS.find((a) => a.artworkCode === selected.artworkCode)
  const formingLog = FORMING_LOGS.find((f) => f.jobCardNo === selected.jobCardNo)
  const punchMachine = MACHINES.find((m) => m.machineCode === selected.punchingMachineCode)

  const nesting = artwork
    ? calculateNesting({
        openLengthMm: artwork.openLengthMm,
        openWidthMm: artwork.openWidthMm,
        deckleWidthMm: DECKLE_MM,
        bedPitchMm: PLANT.bedLengthMm,
      })
    : null

  const issuedTodayKg = FORMING_LOGS.reduce((sum, f) => sum + f.issuedWeightKg, 0)
  const returnedTodayKg = FORMING_LOGS.reduce((sum, f) => sum + f.returnedReelWeightKg, 0)

  const columns: Column<JobCard>[] = [
    {
      key: 'jc', sortValue: (r) => r.jobCardNo,
      header: 'Job card',
      render: (r) => <StackedCell top={r.jobCardNo} bottom={r.soNumber} mono />,
    },
    { key: 'artwork', sortValue: (r) => r.artworkCode, header: 'Artwork', render: (r) => <span className="font-mono">{r.artworkCode}</span> },
    {
      key: 'material',
      header: 'Material',
      render: (r) => (
        <>
          {r.materialType} <span className="font-mono">{formatMicrons(r.thicknessMicrons)}</span>
        </>
      ),
    },
    { key: 'target', sortValue: (r) => r.targetPiecesQty, header: 'Target pcs', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.targetPiecesQty)}</span> },
    { key: 'sheets', sortValue: (r) => r.requiredSheetsQty, header: 'Sheets', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.requiredSheetsQty)}</span> },
    { key: 'kg', sortValue: (r) => r.estReelWeightKg, header: 'Reel kg', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.estReelWeightKg, 1)}</span> },
    { key: 'machine', sortValue: (r) => r.formingMachineCode, header: 'Machine', render: (r) => `${r.formingMachineCode} / ${r.punchingMachineCode}` },
    { key: 'stage', header: 'Stage', render: (r) => <StageStrip stages={r.stages} /> },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Job Cards"
        actions={
          <>
            <Button icon={Printer}>Print card</Button>
            <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
              Release Job Card
            </Button>
          </>
        }
      />

      <StatsGrid>
        <StatsCard
          label="In forming"
          value={String(JOB_CARDS.filter((j) => j.stages.FORMING === 'ACTIVE').length)}
          note="Machines TF-01, TF-02"
          icon={Flame}
        />
        <StatsCard
          label="In punching"
          value={String(JOB_CARDS.filter((j) => j.stages.PUNCHING === 'ACTIVE').length)}
          note={`${PLANT.sheetsPerStroke} sheets per stroke, double-sided`}
          icon={Scissors}
        />
        <StatsCard
          label="Held at line clearance"
          value={String(JOB_CARDS.filter((j) => Object.values(j.stages).includes('BLOCKED')).length)}
          note="JC-2609-118 blocked"
          noteTone="bad"
          icon={Lock}
        />
        <StatsCard
          label="Reel kg issued"
          value={formatNumber(issuedTodayKg, 1)}
          unit="kg"
          note={`${formatKg(returnedTodayKg)} returned to store`}
          noteTone="good"
          icon={Weight}
        />
      </StatsGrid>

      <>
        <DataTable
          title="Job card queue"
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          mainColumns="jc,artwork,target,stage"
          rows={JOB_CARDS}
          columns={columns}
          rowKey={(r) => r.jobCardId}
          searchText={(r) => `${r.jobCardNo} ${r.soNumber} ${r.artworkCode} ${r.customerName}`}
          searchPlaceholder="Search job card, SO, artwork or customer"
          selectedKey={selectedId}
          onSelect={(r) => setSelectedId(r.jobCardId)}
          onOpen={(r) => { setSelectedId(r.jobCardId); setDetailOpen(true) }}
        />

        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={selected.jobCardNo}
          subtitle={selected.customerName}
        >
          {artwork && nesting ? (
            <>
              <NestingDiagram
                openLengthMm={artwork.openLengthMm}
                openWidthMm={artwork.openWidthMm}
                deckleWidthMm={DECKLE_MM}
                bedPitchMm={PLANT.bedLengthMm}
                skeletonKg={selected.estTrimWasteKg}
              />
              <Divider />
              <SpecList
                rows={[
                  { label: 'Customer', value: selected.customerName, mono: false },
                  {
                    label: 'Reel issued',
                    value: selected.reelId
                      ? `${selected.reelId} · ${formatKg(formingLog?.issuedWeightKg ?? 0)}`
                      : 'Not yet issued',
                  },
                  { label: 'Forming machine', value: `${selected.formingMachineCode} · ${PLANT.bedLengthMm} × ${PLANT.bedWidthMm} bed` },
                  {
                    label: 'Punching machine',
                    value: `${selected.punchingMachineCode} · ${punchMachine?.sheetsPerStroke ?? PLANT.sheetsPerStroke} sheets/stroke`,
                  },
                  { label: 'Sheet utilisation', value: formatPercent(nesting.utilisation * 100), emphasis: true },
                  { label: 'Estimated skeleton', value: formatKg(selected.estTrimWasteKg) },
                ]}
              />
            </>
          ) : (
            <p className="text-sm text-fg-subtle">This job card has no approved artwork yet.</p>
          )}
        </DetailModal>
      </>

      <JobCardModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

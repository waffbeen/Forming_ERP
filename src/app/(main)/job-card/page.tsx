'use client'

import * as React from 'react'
import { Printer, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs,
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
  const cutMachine = MACHINES.find((m) => m.machineCode === selected.cuttingMachineCode)

  const nesting = artwork
    ? calculateNesting({
        openLengthMm: artwork.openLengthMm,
        openWidthMm: artwork.openWidthMm,
        deckleWidthMm: DECKLE_MM,
        bedPitchMm: PLANT.bedLengthMm,
      })
    : null

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
    { key: 'machine', sortValue: (r) => r.formingMachineCode, header: 'Machine', render: (r) => `${r.formingMachineCode} / ${r.cuttingMachineCode}` },
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

      <>
        <DataTable
          title="Job card queue"
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          rows={JOB_CARDS}
          columns={columns}
          rowKey={(r) => r.jobCardId}
          searchText={(r) => `${r.jobCardNo} ${r.soNumber} ${r.artworkCode} ${r.customerName}`}
          searchPlaceholder="Search job card, SO, artwork or customer"
          selectedKey={selectedId}
          onSelect={(r) => setSelectedId(r.jobCardId)}
          onOpen={(r) => { setSelectedId(r.jobCardId); setDetailOpen(true) }}
          summary={{
            jc: { type: 'custom', customFn: (r) => `${r.length} job cards` },
            material: {
              type: 'custom',
              customFn: (r) => {
                const held = r.filter((j) => Object.values(j.stages).includes('BLOCKED')).length
                return held > 0 ? `${held} held at line clearance` : 'None held'
              },
            },
            target: { type: 'custom', customFn: (r) => formatNumber(r.reduce((sum, j) => sum + j.targetPiecesQty, 0)) },
            sheets: { type: 'custom', customFn: (r) => formatNumber(r.reduce((sum, j) => sum + j.requiredSheetsQty, 0)) },
            kg: { type: 'custom', customFn: (r) => formatNumber(r.reduce((sum, j) => sum + j.estReelWeightKg, 0), 1) },
            stage: {
              type: 'custom',
              customFn: (r) => {
                const forming = r.filter((j) => j.stages.FORMING === 'ACTIVE').length
                const cutting = r.filter((j) => j.stages.CUTTING === 'ACTIVE').length
                return `${forming} forming · ${cutting} cutting`
              },
            },
          }}
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
                    label: 'Cutting machine',
                    value: `${selected.cuttingMachineCode} · ${cutMachine?.sheetsPerStroke ?? PLANT.sheetsPerStroke} sheets/stroke`,
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

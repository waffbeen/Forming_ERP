'use client'

import * as React from 'react'
import { Save } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, StatsCard, StatsGrid,
} from '@/components/ui'
import { DetailModal } from '@/components/modals'
import { ProductionRunModal, ReconciliationBar, OpenRuns } from '@/components/forming'
import { JOB_CARDS, CUTTING_LOGS } from '@/data'
import { reconcileJob } from '@/lib/reconcile'
import { formatKg, formatNumber, formatPercent } from '@/lib/utils'
import { listDrafts, type RunDraft } from '@/lib/run-drafts'
import type { CuttingLog } from '@/types'

export default function CuttingPage() {
  const [selectedId, setSelectedId] = React.useState(CUTTING_LOGS[0].cuttingLogId)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [resumeJob, setResumeJob] = React.useState<string | undefined>(undefined)
  const [resumeMachine, setResumeMachine] = React.useState<string | undefined>(undefined)
  const [openRuns, setOpenRuns] = React.useState<RunDraft[]>([])

  /* Runs left open live in the browser, so they are read after mount and again
     whenever the screen closes and may have kept one. */
  React.useEffect(() => {
    if (!createOpen) setOpenRuns(listDrafts('CUTTING'))
  }, [createOpen])
  const selected = CUTTING_LOGS.find((p) => p.cuttingLogId === selectedId) ?? CUTTING_LOGS[0]
  const job = JOB_CARDS.find((j) => j.jobCardNo === selected.jobCardNo)

  const recon = reconcileJob(selected.jobCardNo)
  const consumedKg = recon?.consumedKg ?? 0
  const skeletonKg = recon?.skeletonKg ?? 0
  const totalPieces = recon?.piecesAccounted ?? 0
  const gramsPerPiece = recon?.gramsPerPiece ?? 0
  const rejectKg = recon?.rejectKg ?? 0
  const goodKg = recon?.goodKg ?? 0

  const piecesToday = CUTTING_LOGS.reduce((s, p) => s + p.goodPiecesOutput, 0)
  const rejectsToday = CUTTING_LOGS.reduce((s, p) => s + p.rejectedPiecesQty, 0)
  const skeletonToday = CUTTING_LOGS.reduce((s, p) => s + p.skeletonScrapWeightKg, 0)
  const sheetsToday = CUTTING_LOGS.reduce((s, p) => s + p.inputFormedSheets, 0)

  const columns: Column<CuttingLog>[] = [
    { key: 'job', sortValue: (r) => r.jobCardNo, header: 'Job card', render: (r) => <StackedCell top={r.jobCardNo} bottom={r.operator} mono /> },
    { key: 'input', sortValue: (r) => r.inputFormedSheets, header: 'Sheets in', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.inputFormedSheets)}</span> },
    { key: 'stroke', header: 'Per stroke', align: 'right', render: (r) => <span className="font-mono">{r.sheetsPerStroke}</span> },
    { key: 'good', sortValue: (r) => r.goodPiecesOutput, header: 'Good pcs', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.goodPiecesOutput)}</span> },
    { key: 'rej', sortValue: (r) => r.rejectedPiecesQty, header: 'Rejects', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.rejectedPiecesQty)}</span> },
    { key: 'skel', sortValue: (r) => r.skeletonScrapWeightKg, header: 'Skeleton kg', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.skeletonScrapWeightKg, 1)}</span> },
    {
      key: 'gate',
      header: 'Gate',
      render: (r) => (r.lineClearanceSigned ? <Badge tone="success">Cleared</Badge> : <Badge tone="error">Locked</Badge>),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Cutting Entry"
        actions={
          <>
            <Button
              variant="primary"
              icon={Save}
              onClick={() => {
                setResumeJob('')
                setResumeMachine(undefined)
                setCreateOpen(true)
              }}
            >
              Post cutting entry
            </Button>
          </>
        }
      />

      <OpenRuns
        runs={openRuns}
        onResume={(jobCardNo, machineCode) => {
          setResumeJob(jobCardNo)
          setResumeMachine(machineCode)
          setCreateOpen(true)
        }}
      />

      <>
        <DataTable
          title="Cutting run log"
          rows={CUTTING_LOGS}
          columns={columns}
          rowKey={(r) => r.cuttingLogId}
          searchText={(r) => `${r.jobCardNo} ${r.operator}`}
          searchPlaceholder="Search job card or operator"
          selectedKey={selectedId}
          onSelect={(r) => setSelectedId(r.cuttingLogId)}
          onOpen={(r) => { setSelectedId(r.cuttingLogId); setDetailOpen(true) }}
        />

        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={selected.jobCardNo}
          subtitle={job?.customerName ?? ''}
        >
          {consumedKg > 0 ? (
            <>
              <ReconciliationBar goodKg={goodKg} skeletonKg={skeletonKg} rejectKg={rejectKg} />
              <Divider />
              <SpecList
                rows={[
                  { label: 'Customer', value: job?.customerName ?? '—', mono: false },
                  { label: 'Reel consumed at forming', value: formatKg(consumedKg) },
                  { label: 'Sheets fed', value: formatNumber(selected.inputFormedSheets) },
                  {
                    label: 'Pieces off the die',
                    value: `${formatNumber(totalPieces)} (${formatNumber(selected.inputFormedSheets)} × ${
                      job ? Math.round(totalPieces / selected.inputFormedSheets) : 12
                    } ups)`,
                  },
                  { label: 'Good pieces', value: formatNumber(selected.goodPiecesOutput), emphasis: true },
                  { label: 'Rejected pieces', value: formatNumber(selected.rejectedPiecesQty) },
                  { label: 'Weight per tray', value: `${formatNumber(gramsPerPiece, 2)} g` },
                  { label: 'Skeleton scrap', value: formatKg(skeletonKg) },
                ]}
              />
              <Divider />
            </>
          ) : (
            <p className="text-sm text-fg-subtle">
              This job has not been cut yet. Its line clearance is still unsigned.
            </p>
          )}
        </DetailModal>
      </>

      <ProductionRunModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        section="CUTTING"
        resumeJobCardNo={resumeJob}
        resumeMachineCode={resumeMachine}
      />
    </>
  )
}

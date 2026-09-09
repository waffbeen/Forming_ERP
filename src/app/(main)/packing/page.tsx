'use client'

import * as React from 'react'
import {
  ArrowRight, Boxes, Download, FileText, Lock, PackageCheck, Recycle, Truck, Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { DetailModal } from '@/components/modals'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, StatsCard, StatsGrid, Tabs,
} from '@/components/ui'
import { ReconciliationBar } from '@/components/forming'
import { COAS, FORMING_LOGS, JOB_CARDS, PACKING_RECORDS, SCRAP_ENTRIES } from '@/data'
import { reconcileJob } from '@/lib/reconcile'
import { formatCurrency, formatKg, formatNumber, formatPercent } from '@/lib/utils'
import type { PackingRecord } from '@/types'

const TABS = [
  { id: 'READY', label: 'Ready to dispatch', count: PACKING_RECORDS.filter((p) => p.fgReport === 'PASSED').length },
  { id: 'PACKING', label: 'In packing' },
  { id: 'DISPATCHED', label: 'Dispatched' },
]

export default function PackingPage() {
  const [tab, setTab] = React.useState('READY')
  const [selectedId, setSelectedId] = React.useState(PACKING_RECORDS[0].packingId)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const selected = PACKING_RECORDS.find((p) => p.packingId === selectedId) ?? PACKING_RECORDS[0]
  const job = JOB_CARDS.find((j) => j.jobCardNo === selected.jobCardNo)
  const formingLog = FORMING_LOGS.find((f) => f.jobCardNo === selected.jobCardNo)
  const scrap = SCRAP_ENTRIES.find((s) => s.jobCardNo === selected.jobCardNo)
  const coa = COAS.find((c) => c.jobCardNo === selected.jobCardNo)

  const recon = reconcileJob(selected.jobCardNo)
  const consumedKg = recon?.consumedKg ?? 0
  const skeletonKg = recon?.skeletonKg ?? 0
  const totalPieces = recon?.piecesAccounted ?? selected.goodPiecesQty + selected.rejectedPiecesQty
  const gramsPerPiece = recon?.gramsPerPiece ?? 0
  const rejectKg = recon?.rejectKg ?? 0
  const goodKg = recon?.goodKg ?? 0

  const packedToday = PACKING_RECORDS.reduce((s, p) => s + p.goodPiecesQty, 0)
  const rejectsToday = PACKING_RECORDS.reduce((s, p) => s + p.rejectedPiecesQty, 0)
  const cartonsToday = PACKING_RECORDS.reduce((s, p) => s + p.cartons, 0)
  const recycledToday = SCRAP_ENTRIES.reduce((s, e) => s + e.totalKg, 0)

  const coaReleased = Boolean(coa?.releasedOn)
  const invoiceValue = job ? selected.goodPiecesQty * 2.13 : 0

  const columns: Column<PackingRecord>[] = [
    { key: 'job', sortValue: (r) => r.jobCardNo, header: 'Job card', render: (r) => <StackedCell top={r.jobCardNo} bottom={r.customerName} mono /> },
    { key: 'good', sortValue: (r) => r.goodPiecesQty, header: 'Good', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.goodPiecesQty)}</span> },
    { key: 'rej', sortValue: (r) => r.rejectedPiecesQty, header: 'Rejects', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.rejectedPiecesQty)}</span> },
    { key: 'per', header: 'Pcs / carton', align: 'right', render: (r) => <span className="font-mono">{r.piecesPerCarton}</span> },
    {
      key: 'cartons', sortValue: (r) => r.cartons,
      header: 'Cartons',
      align: 'right',
      render: (r) => (
        <span className="font-mono">
          {formatNumber(r.cartons)}
          {r.loosePieces > 0 ? <span className="text-fg-muted"> + {r.loosePieces}</span> : null}
        </span>
      ),
    },
    {
      key: 'fg', sortValue: (r) => r.fgReport,
      header: 'FG report',
      render: (r) => (
        <Badge tone={r.fgReport === 'PASSED' ? 'success' : r.fgReport === 'INSPECTING' ? 'warning' : 'error'}>
          {r.fgReport === 'PASSED' ? 'Passed' : r.fgReport === 'INSPECTING' ? 'Inspecting' : 'Failed'}
        </Badge>
      ),
    },
  ]

  const documents = [
    { icon: FileText, title: 'Tax invoice', sub: `INV-2609-0442 · ${formatCurrency(invoiceValue, 0)}`, ready: true },
    { icon: Truck, title: 'Delivery note', sub: `DN-2609-0431 · ${selected.cartons} cartons`, ready: true },
    {
      icon: PackageCheck,
      title: 'Certificate of Analysis',
      sub: coaReleased ? `${coa?.coaNumber} released` : 'Awaiting lab thickness sign-off',
      ready: coaReleased,
    },
    {
      icon: Recycle,
      title: 'Recycling transfer note',
      sub: scrap ? `${scrap.transferNote} · ${formatKg(scrap.totalKg)}` : 'No scrap booked',
      ready: Boolean(scrap),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Fulfilment"
        title="Packing & Dispatch"
        actions={
          <>
            <Button icon={Download}>Export</Button>
            <Button variant="primary" icon={ArrowRight} disabled={!coaReleased}>
              Raise Dispatch
            </Button>
          </>
        }
      />

      <StatsGrid>
        <StatsCard label="Good pieces packed" value={formatNumber(packedToday)} note="Sorted, counted and inspected" icon={PackageCheck} />
        <StatsCard
          label="Rejects at packing"
          value={formatNumber(rejectsToday)}
          note={`${formatPercent((rejectsToday / (packedToday + rejectsToday)) * 100, 2)} of packed output`}
          noteTone="warn"
          icon={Trash2}
        />
        <StatsCard label="To recycling" value={formatNumber(recycledToday, 1)} unit="kg" note="Skeleton plus rejects" icon={Recycle} />
        <StatsCard label="Cartons ready" value={formatNumber(cartonsToday)} note="Across four job cards" icon={Boxes} />
      </StatsGrid>

      <div className="mb-3">
        <Tabs tabs={TABS} activeId={tab} onChange={setTab} />
      </div>

      <>
        <div className="flex flex-col gap-3.5">
          <DetailModal
            isOpen={detailOpen}
            onClose={() => setDetailOpen(false)}
            title={selected.jobCardNo}
            subtitle={selected.customerName}
          >
            <ReconciliationBar goodKg={goodKg} skeletonKg={skeletonKg} rejectKg={rejectKg} />
            <Divider />
            <SpecList
              rows={[
                { label: 'Reel issued to floor', value: formatKg(formingLog?.issuedWeightKg ?? 0) },
                { label: 'Returned to store', value: formatKg(formingLog?.returnedReelWeightKg ?? 0) },
                { label: 'Consumed', value: formatKg(consumedKg), emphasis: true },
                {
                  label: 'Sheets formed to punched',
                  value: `${formatNumber(formingLog?.outputFormedSheets ?? 0)} → ${formatNumber(totalPieces)} pcs`,
                },
                { label: 'Weight per tray', value: `${formatNumber(gramsPerPiece, 2)} g` },
                {
                  label: 'Unaccounted variance',
                  value: <span className="text-success">{formatKg(consumedKg - goodKg - skeletonKg - rejectKg, 2)}</span>,
                },
              ]}
            />

            <Divider />
            <p className="label-caps mb-2">Dispatch documents</p>
            <ul className="space-y-1.5">
            {documents.map((doc) => {
            const Icon = doc.icon
            return (
            <li
            key={doc.title}
            className="flex items-center gap-2.5 rounded-md border border-bd-default px-3 py-2.5"
            >
            <Icon className="h-4 w-4 shrink-0 text-fg-muted" />
            <span className="text-sm font-medium">
            {doc.title}
            <span className="block font-mono text-xs font-normal text-fg-muted">{doc.sub}</span>
            </span>
            <span className="ml-auto">
            {doc.ready ? <Badge tone="success">Generated</Badge> : <Badge tone="warning">Pending</Badge>}
            </span>
            </li>
            )
            })}
            </ul>

            <Divider />

            {coaReleased ? null : (
            <>
            <div className="flex items-start gap-3 rounded-md border border-error/35 bg-error-subtle p-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-error" />
            <div>
            <h5 className="text-sm font-semibold text-error">Dispatch held</h5>
            <p className="mt-0.5 text-xs text-fg-muted">
            The gate pass releases only once the COA is signed against the finished-goods inspection report.
            </p>
            </div>
            </div>
            <Button variant="primary" disabled className="mt-3 w-full justify-center">
            Release gate pass
            </Button>
            </>
            )}
          </DetailModal>

          <DataTable
            title="Packing queue"
            rows={PACKING_RECORDS}
            columns={columns}
            rowKey={(r) => r.packingId}
            mainColumns="job,good,rej,fg"
            selectedKey={selectedId}
            onSelect={(r) => setSelectedId(r.packingId)}
          onOpen={(r) => { setSelectedId(r.packingId); setDetailOpen(true) }}
          />
        </div>

      </>
    </>
  )
}

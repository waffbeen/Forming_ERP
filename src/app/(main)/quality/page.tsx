'use client'

import * as React from 'react'
import { AlertTriangle, ClipboardCheck, FileCheck2, History, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Panel, PanelBody, PanelHeader,
  SpecList, StatsCard, StatsGrid, Tabs,
} from '@/components/ui'
import { DefectChecklist, MicronMeter, SignatureGate } from '@/components/forming'
import { QcStatusBadge } from '@/lib/shared-ui'
import {
  COAS, FORMING_DEFECT_CHECKS, IN_PROCESS_CHECKS, JOB_CARDS, CUTTING_DEFECT_CHECKS, REELS,
} from '@/data'
import {
  DOCUMENTS, FORMING_DEFECTS, LINE_CLEARANCE_AREAS, PLANT, CUTTING_DEFECTS,
} from '@/config/plant'
import { formatMicrons, formatNumber } from '@/lib/utils'
import type { Coa, InProcessCheck, Reel } from '@/types'

const TABS = [
  { id: 'CLEARANCE', label: 'Line clearance', count: 2 },
  { id: 'IQC', label: 'Incoming (IQC)' },
  { id: 'INPROCESS', label: 'In-process defects' },
  { id: 'THICKNESS', label: 'Thickness log' },
  { id: 'COA', label: 'FG & COA' },
]

const SPEC_MICRONS = 300

export default function QualityPage() {
  const [tab, setTab] = React.useState('CLEARANCE')

  const blockedJob = JOB_CARDS.find((j) => j.stages.FORMING === 'BLOCKED') ?? JOB_CARDS[3]
  const quarantined = REELS.filter((r) => r.qcStatus === 'QUARANTINE')
  const rejected = REELS.filter((r) => r.qcStatus === 'REJECTED')

  const reelColumns: Column<Reel>[] = [
    { key: 'reel', header: 'Reel', render: (r) => <span className="font-mono">{r.reelId}</span> },
    { key: 'grn', header: 'GRN', render: (r) => <span className="font-mono">{r.grnNumber}</span> },
    { key: 'mat', header: 'Material', render: (r) => r.materialType },
    {
      key: 'thk',
      header: 'Thickness',
      align: 'right',
      render: (r) => (
        <span className={r.thicknessMicrons < PLANT.minMicrons ? 'font-mono text-error' : 'font-mono'}>
          {formatMicrons(r.thicknessMicrons)}
        </span>
      ),
    },
    { key: 'wt', header: 'Weight', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.grossWeightKg, 1)}</span> },
    { key: 'sup', header: 'Supplier', render: (r) => r.supplier },
    { key: 'bin', header: 'Bin', render: (r) => <QcStatusBadge status={r.qcStatus} /> },
  ]

  const checkColumns: Column<InProcessCheck>[] = [
    { key: 'time', header: 'Time', render: (r) => <span className="font-mono">{r.time}</span> },
    { key: 'insp', header: 'Inspector', render: (r) => r.inspector },
    { key: 'thk', header: 'Thickness', align: 'right', render: (r) => <span className="font-mono">{formatMicrons(r.thicknessMicrons)}</span> },
    {
      key: 'meter',
      header: `${Math.round(SPEC_MICRONS * 0.95)} to ${Math.round(SPEC_MICRONS * 1.05)} µm`,
      width: '160px',
      render: (r) => <MicronMeter reading={r.thicknessMicrons} specMicrons={SPEC_MICRONS} />,
    },
    { key: 'vis', header: 'Visual clarity', render: (r) => r.visualClarity },
    {
      key: 'res',
      header: 'Result',
      render: (r) => (
        <Badge tone={r.result === 'PASSED' ? 'success' : 'error'}>
          {r.result === 'PASSED' ? 'Within spec' : 'Out of spec'}
        </Badge>
      ),
    },
  ]

  const coaColumns: Column<Coa>[] = [
    { key: 'coa', header: 'COA', render: (r) => <span className="font-mono">{r.coaNumber}</span> },
    { key: 'job', header: 'Job card', render: (r) => <span className="font-mono">{r.jobCardNo}</span> },
    { key: 'cust', header: 'Customer', render: (r) => r.customerName },
    { key: 'thk', header: 'Avg thickness', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.avgThicknessMicrons, 1)} µm</span> },
    { key: 'depth', header: 'Depth', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.depthMm, 1)} mm</span> },
    { key: 'checks', header: 'Hourly checks', render: (r) => <span className="font-mono">{r.hourlyChecksMatched}</span> },
    {
      key: 'lock',
      header: 'Record',
      render: (r) =>
        r.gdpAuditLock ? <Badge tone="success">Sealed</Badge> : <Badge tone="warning">Open for sign-off</Badge>,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Quality & Compliance"
        title="Quality Control"
        actions={<Button icon={History}>Audit trail</Button>}
      />

      <StatsGrid>
        <StatsCard
          label="Reels in quarantine"
          value={String(quarantined.length)}
          note="IQC thickness pending"
          noteTone="warn"
          icon={ShieldAlert}
        />
        <StatsCard label="Hourly checks today" value={`${IN_PROCESS_CHECKS.length}`} unit="/ 8" note="No missed slots" noteTone="good" icon={ClipboardCheck} />
        <StatsCard label="Reels rejected at IQC" value={String(rejected.length)} note="Below the 180 µm floor" noteTone="bad" icon={AlertTriangle} />
        <StatsCard
          label="COA released this month"
          value={String(COAS.filter((c) => c.releasedOn).length)}
          note="Zero non-conformances raised"
          noteTone="good"
          icon={FileCheck2}
        />
      </StatsGrid>

      <div className="mb-3">
        <Tabs tabs={TABS} activeId={tab} onChange={setTab} />
      </div>

      {tab === 'CLEARANCE' ? (
        <>
          <Panel>
            <PanelHeader title="Machine gate" />
            <PanelBody>
              <SignatureGate
                machineLabel={`${blockedJob.formingMachineCode} forming`}
                jobLabel={`${DOCUMENTS.productionForming} · ${blockedJob.jobCardNo} · ${blockedJob.materialType} ${blockedJob.thicknessMicrons} µm · ${blockedJob.customerName}`}
                areas={LINE_CLEARANCE_AREAS}
                declaration="I have personally checked the above areas and the records of the previous product, to prevent any product mix."
                lines={[
                  {
                    id: 'operator',
                    label: 'Machine operator',
                    hint: 'Confirms all six areas are physically cleared',
                    signedBy: 'Anil Kadam',
                    signedAt: '09:14',
                  },
                  {
                    id: 'supervisor',
                    label: 'Production / QC supervisor',
                    hint: 'Verifies the clearance and releases the machine',
                  },
                  { id: 'fpa', label: 'First piece approval (FPA)', hint: 'Operator produces it, QC executive verifies it' },
                ]}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Certificate of Analysis" description={<span className="font-mono">{COAS[0].coaNumber}</span>} action={<Badge tone="success">Released</Badge>} />
            <PanelBody>
              <SpecList
                rows={[
                  { label: 'Job card', value: COAS[0].jobCardNo },
                  { label: 'Customer', value: COAS[0].customerName, mono: false },
                  { label: 'Average thickness', value: `${formatNumber(COAS[0].avgThicknessMicrons, 1)} µm` },
                  { label: 'Depth of draw', value: `${formatNumber(COAS[0].depthMm, 1)} mm` },
                  { label: 'Visual clarity', value: 'Pass, no haze or crazing', mono: false },
                  { label: 'Migration test', value: 'Conforms, food grade', mono: false },
                  { label: 'Hourly checks matched', value: COAS[0].hourlyChecksMatched },
                  { label: 'Record lock', value: 'Sealed 09 Sep, 17:42', emphasis: true, mono: false },
                ]}
              />
            </PanelBody>
        </Panel>
        </>
      ) : null}

      {tab === 'IQC' ? (
        <DataTable
          title="Incoming reel QC"
          rows={REELS}
          columns={reelColumns}
          rowKey={(r) => r.reelId}
          mainColumns="reel,mat,thk,bin"
        />
      ) : null}

      {tab === 'INPROCESS' ? (
        <div className="flex flex-col gap-3.5">
          <Panel>
            <PanelHeader
              title="Forming section, in-process checklist"
              description={
                <span className="font-mono">
                  {DOCUMENTS.qcForming} · JC-2609-124 · Vadilal Industries
                </span>
              }
              action={<Badge tone="warning">1 defect logged</Badge>}
            />
            <DefectChecklist
              defects={FORMING_DEFECTS}
              checks={FORMING_DEFECT_CHECKS}
              documentNo={DOCUMENTS.qcForming}
              section="Forming"
            />
          </Panel>

          <Panel>
            <PanelHeader
              title="Cutting section, in-process checklist"
              description={
                <span className="font-mono">
                  {DOCUMENTS.qcCutting} · JC-2609-124 · Vadilal Industries
                </span>
              }
              action={<Badge tone="warning">1 defect logged</Badge>}
            />
            <DefectChecklist
              defects={CUTTING_DEFECTS}
              checks={CUTTING_DEFECT_CHECKS}
              documentNo={DOCUMENTS.qcCutting}
              section="Cutting"
            />
        </Panel>
        </div>
      ) : null}

      {tab === 'THICKNESS' ? (
        <DataTable
          title={`In-process check log · ${IN_PROCESS_CHECKS[0].jobCardNo} · spec ${SPEC_MICRONS} µm ± 5 %`}
          rows={IN_PROCESS_CHECKS}
          columns={checkColumns}
          rowKey={(r) => r.checkId}
          mainColumns="time,insp,thk,res"
        />
      ) : null}

      {tab === 'COA' ? (
        <DataTable
          title="Finished goods and COA"
          rows={COAS}
          columns={coaColumns}
          rowKey={(r) => r.coaId}
          mainColumns="coa,job,cust,lock"
        />
      ) : null}
    </>
  )
}

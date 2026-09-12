'use client'

import * as React from 'react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Column, DataTable, Panel, PanelHeader, Tabs,
} from '@/components/ui'
import { DefectChecklist, MicronMeter } from '@/components/forming'
import { CUTTING_DEFECT_CHECKS, FORMING_DEFECT_CHECKS, IN_PROCESS_CHECKS } from '@/data'
import { CUTTING_DEFECTS, DOCUMENTS, FORMING_DEFECTS } from '@/config/plant'
import { formatMicrons } from '@/lib/utils'
import type { InProcessCheck } from '@/types'

/* In-process QC.

   What the floor QC executive fills in hourly while a run is going: the defect
   checklist per section and the thickness log against the job's spec. Both are
   the same person on the same run, so they share a screen — unlike line
   clearance, which is the supervisor's, or the incoming inspection, which
   happens at the receiving bay before any of this. */

const SPEC_MICRONS = 300

const SECTIONS = [
  { id: 'FORMING', label: 'Forming' },
  { id: 'CUTTING', label: 'Cutting' },
]

export default function InProcessQcPage() {
  const [section, setSection] = React.useState('FORMING')

  const formingDefects = FORMING_DEFECT_CHECKS.filter((c) =>
    Object.values(c.results).some((r) => r === 'DEFECT'),
  )
  const cuttingDefects = CUTTING_DEFECT_CHECKS.filter((c) =>
    Object.values(c.results).some((r) => r === 'DEFECT'),
  )
  const outOfSpec = IN_PROCESS_CHECKS.filter((c) => c.result !== 'PASSED')
  const done = FORMING_DEFECT_CHECKS.filter((c) => c.time !== '—').length

  const checkColumns: Column<InProcessCheck>[] = [
    { key: 'time', header: 'Time', render: (r) => <span className="font-mono">{r.time}</span> },
    { key: 'insp', header: 'Inspector', render: (r) => r.inspector },
    {
      key: 'thk',
      header: 'Thickness',
      align: 'right',
      render: (r) => <span className="font-mono">{formatMicrons(r.thicknessMicrons)}</span>,
    },
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

  return (
    <>
      <PageHeader eyebrow="Quality · Floor QC executive" title="In-Process Checks" />

      <div className="mb-3">
        <Tabs tabs={SECTIONS} activeId={section} onChange={setSection} />
      </div>

      {section === 'FORMING' ? (
        <Panel>
          <PanelHeader
            title="Forming section, in-process checklist"
            description={
              <span className="font-mono">{DOCUMENTS.qcForming} · JC-2609-124 · Vadilal Industries</span>
            }
            action={
              formingDefects.length > 0 ? (
                <Badge tone="warning">{formingDefects.length} defect logged</Badge>
              ) : (
                <Badge tone="success">Clean</Badge>
              )
            }
          />
          <DefectChecklist
            defects={FORMING_DEFECTS}
            checks={FORMING_DEFECT_CHECKS}
            documentNo={DOCUMENTS.qcForming}
            section="Forming"
          />
        </Panel>
      ) : (
        <Panel>
          <PanelHeader
            title="Cutting section, in-process checklist"
            description={
              <span className="font-mono">{DOCUMENTS.qcCutting} · JC-2609-124 · Vadilal Industries</span>
            }
            action={
              cuttingDefects.length > 0 ? (
                <Badge tone="warning">{cuttingDefects.length} defect logged</Badge>
              ) : (
                <Badge tone="success">Clean</Badge>
              )
            }
          />
          <DefectChecklist
            defects={CUTTING_DEFECTS}
            checks={CUTTING_DEFECT_CHECKS}
            documentNo={DOCUMENTS.qcCutting}
            section="Cutting"
          />
        </Panel>
      )}

      <DataTable
        title={`Thickness log · ${IN_PROCESS_CHECKS[0].jobCardNo} · spec ${SPEC_MICRONS} µm ± 5 %`}
        rows={IN_PROCESS_CHECKS}
        columns={checkColumns}
        rowKey={(r) => r.checkId}
      />

      <Note>
        The checklist and the thickness log are both filled in by the QC executive on the line, hour by hour, against
        the same run — so they sit together. A defect here stops the run; it does not wait for the finished goods check.
      </Note>
    </>
  )
}

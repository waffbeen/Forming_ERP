'use client'

import * as React from 'react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Column, DataTable, Panel, PanelBody, PanelHeader, StackedCell,
} from '@/components/ui'
import { SignatureGate } from '@/components/forming'
import { JOB_CARDS } from '@/data'
import { DOCUMENTS, LINE_CLEARANCE_AREAS } from '@/config/plant'
import { formatNumber } from '@/lib/utils'
import type { JobCard } from '@/types'

/* Line clearance.

   The machine gate, signed by the operator and released by the production or QC
   supervisor. It is the one QC step that happens before a run rather than
   during it, and it is nobody's job but the supervisor's — which is why it has
   its own screen rather than sharing one with the inspection formats. */

export default function LineClearancePage() {
  /* The job at the gate: blocked at forming is exactly what a supervisor is
     looking for when they open this screen. */
  const blockedJob = JOB_CARDS.find((j) => j.stages.FORMING === 'BLOCKED') ?? JOB_CARDS[3]

  const awaiting = JOB_CARDS.filter(
    (j) => j.stages.FORMING === 'BLOCKED' || j.stages.FORMING === 'PENDING',
  )
  const released = JOB_CARDS.filter((j) => j.stages.FORMING === 'ACTIVE' || j.stages.FORMING === 'DONE')

  const columns: Column<JobCard>[] = [
    {
      key: 'job',
      header: 'Job card',
      sortValue: (r) => r.jobCardNo,
      render: (r) => <StackedCell top={r.jobCardNo} bottom={r.customerName} mono />,
    },
    { key: 'machine', header: 'Machine', render: (r) => <span className="font-mono">{r.formingMachineCode}</span> },
    {
      key: 'spec',
      header: 'Material',
      render: (r) => (
        <span className="font-mono text-xs">
          {r.materialType} · {r.thicknessMicrons} µm
        </span>
      ),
    },
    {
      key: 'qty',
      header: 'Target',
      align: 'right',
      sortValue: (r) => r.targetPiecesQty,
      render: (r) => <span className="font-mono">{formatNumber(r.targetPiecesQty)}</span>,
    },
    { key: 'reel', header: 'Reel', render: (r) => <span className="font-mono">{r.reelId ?? '—'}</span> },
    {
      key: 'gate',
      header: 'Gate',
      render: (r) =>
        r.stages.FORMING === 'BLOCKED' ? (
          <Badge tone="error">Held at clearance</Badge>
        ) : r.stages.FORMING === 'PENDING' ? (
          <Badge tone="muted">Not at the machine yet</Badge>
        ) : (
          <Badge tone="success">Released</Badge>
        ),
    },
  ]

  return (
    <>
      <PageHeader eyebrow="Quality · Supervisor" title="Line Clearance" />

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

      <DataTable
        title="Jobs by gate status"
        rows={JOB_CARDS}
        columns={columns}
        rowKey={(r) => r.jobCardNo}
      />

      <Note>
        Clearance is signed by the operator and released by the supervisor; the first piece is produced by the operator
        and verified by a QC executive. Three different people, which is the point of the format.
      </Note>
    </>
  )
}

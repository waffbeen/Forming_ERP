'use client'

import * as React from 'react'
import { History, ClipboardCheck } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Panel, PanelBody, PanelHeader, SpecList, StackedCell,
} from '@/components/ui'
import { FgCoaModal } from '@/components/modals'
import { COAS } from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { Coa } from '@/types'

/* Finished goods and COA.

   The last QC step, and the only one the customer ever sees. It is the QA
   manager's screen: the floor's own inspectors cannot release their own work, so
   this is deliberately not on the in-process page. Once a certificate is
   released the record seals for audit. */

export default function FgCoaPage() {
  const [selectedId, setSelectedId] = React.useState(COAS[0].coaId)
  const [certifyOpen, setCertifyOpen] = React.useState(false)
  const selected = COAS.find((c) => c.coaId === selectedId) ?? COAS[0]

  const released = COAS.filter((c) => c.releasedOn)
  const open = COAS.filter((c) => !c.gdpAuditLock)

  const columns: Column<Coa>[] = [
    {
      key: 'coa',
      header: 'COA',
      sortValue: (r) => r.coaNumber,
      render: (r) => <StackedCell top={r.coaNumber} bottom={r.releasedOn ? formatDate(r.releasedOn) : 'Not released'} mono />,
    },
    { key: 'job', header: 'Job card', render: (r) => <span className="font-mono">{r.jobCardNo}</span> },
    { key: 'cust', header: 'Customer', sortValue: (r) => r.customerName, render: (r) => r.customerName },
    {
      key: 'thk',
      header: 'Avg thickness',
      align: 'right',
      sortValue: (r) => r.avgThicknessMicrons,
      render: (r) => <span className="font-mono">{formatNumber(r.avgThicknessMicrons, 1)} µm</span>,
    },
    {
      key: 'depth',
      header: 'Depth',
      align: 'right',
      sortValue: (r) => r.depthMm,
      render: (r) => <span className="font-mono">{formatNumber(r.depthMm, 1)} mm</span>,
    },
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
        eyebrow="Quality · QA manager"
        title="Finished Goods & COA"
        actions={
          <>
            <Button icon={History}>Audit trail</Button>
            <Button variant="primary" icon={ClipboardCheck} onClick={() => setCertifyOpen(true)}>
              Inspect &amp; certify a lot
            </Button>
          </>
        }
      />

      <DataTable
        title="Finished goods and COA"
        rows={COAS}
        columns={columns}
        rowKey={(r) => r.coaId}
        selectedKey={selected.coaId}
        onSelect={(r) => setSelectedId(r.coaId)}
      />

      <Panel>
        <PanelHeader
          title="Certificate of Analysis"
          description={<span className="font-mono">{selected.coaNumber}</span>}
          action={selected.releasedOn ? <Badge tone="success">Released</Badge> : <Badge tone="warning">Draft</Badge>}
        />
        <PanelBody>
          <SpecList
            rows={[
              { label: 'Job card', value: selected.jobCardNo },
              { label: 'Customer', value: selected.customerName, mono: false },
              { label: 'Average thickness', value: `${formatNumber(selected.avgThicknessMicrons, 1)} µm` },
              { label: 'Depth of draw', value: `${formatNumber(selected.depthMm, 1)} mm` },
              { label: 'Visual clarity', value: 'Pass, no haze or crazing', mono: false },
              { label: 'Migration test', value: 'Conforms, food grade', mono: false },
              { label: 'Hourly checks matched', value: selected.hourlyChecksMatched },
              {
                label: 'Record lock',
                value: selected.gdpAuditLock ? 'Sealed, cannot be edited' : 'Open for sign-off',
                emphasis: true,
                mono: false,
              },
            ]}
          />
        </PanelBody>
      </Panel>

      <Note>
        A certificate can only be released once the run's hourly checks all match, so this screen depends on the
        in-process log being complete rather than repeating it. Release is the QA manager's signature, not the line
        inspector's.
      </Note>

      <FgCoaModal isOpen={certifyOpen} onClose={() => setCertifyOpen(false)} />
    </>
  )
}

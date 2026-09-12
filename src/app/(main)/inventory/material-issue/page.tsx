'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Panel, PanelBody, PanelHeader, StackedCell, Tabs,
} from '@/components/ui'
import { MaterialIssueModal } from '@/components/modals'
import {
  BINS, ITEMS, JOB_CARDS, MATERIAL_ISSUES, USERS,
  issuableReels, jobsAwaitingIssue,
} from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { MaterialIssue } from '@/types/procurement'

/* Material issue.

   The register of everything the store has handed to the floor, and the list of
   job cards still waiting. A job card cannot be formed until it appears on the
   left of this screen rather than the right. */

const itemOf = (id: string) => ITEMS.find((i) => i.itemId === id)
const binCode = (id: string) => BINS.find((b) => b.binId === id)?.binCode ?? id
const userName = (id: string) => USERS.find((u) => u.userId === id)?.userName ?? id

const TABS = [
  { id: 'ALL', label: 'All issues' },
  { id: 'RAW_MATERIAL', label: 'Reels' },
  { id: 'PACKING', label: 'Packing' },
]

export default function MaterialIssuePage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [forJob, setForJob] = React.useState('')

  const rows = React.useMemo(
    () =>
      tab === 'ALL'
        ? MATERIAL_ISSUES
        : MATERIAL_ISSUES.filter((i) => itemOf(i.itemId)?.itemType === tab),
    [tab],
  )

  const waiting = jobsAwaitingIssue()
  const free = issuableReels()
  const issuedKg = MATERIAL_ISSUES.filter((i) => itemOf(i.itemId)?.itemType === 'RAW_MATERIAL').reduce(
    (s, i) => s + i.quantity,
    0,
  )

  const openFor = (jobCardNo: string) => {
    setForJob(jobCardNo)
    setCreateOpen(true)
  }

  const columns: Column<MaterialIssue>[] = [
    {
      key: 'issue',
      header: 'Issue no',
      sortValue: (r) => r.issueNo,
      render: (r) => <StackedCell top={r.issueNo} bottom={formatDate(r.issuedOn)} mono />,
    },
    {
      key: 'job',
      header: 'To job card',
      sortValue: (r) => r.jobCardNo,
      render: (r) => (
        <StackedCell
          top={r.jobCardNo}
          bottom={JOB_CARDS.find((j) => j.jobCardNo === r.jobCardNo)?.customerName ?? ''}
          mono
        />
      ),
    },
    {
      key: 'item',
      header: 'Material',
      render: (r) => (
        <StackedCell top={itemOf(r.itemId)?.itemName ?? r.itemId} bottom={r.reelId ?? 'no reel'} />
      ),
    },
    {
      key: 'qty',
      header: 'Issued',
      align: 'right',
      sortValue: (r) => r.quantity,
      render: (r) => (
        <span className="font-mono">
          {formatNumber(r.quantity, 1)} {itemOf(r.itemId)?.uom}
        </span>
      ),
    },
    { key: 'bin', header: 'From bin', render: (r) => <span className="font-mono">{binCode(r.binId)}</span> },
    {
      key: 'trace',
      header: 'Traceable to',
      render: (r) => (
        <StackedCell top={r.grnNumber} bottom={r.qcNumber ?? 'auto-approved, no QC format'} mono />
      ),
    },
    { key: 'to', header: 'Issued to', render: (r) => r.issuedToEmployee },
    { key: 'by', header: 'By', render: (r) => userName(r.issuedByUserId) },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Material Issue"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => openFor('')}>
            Issue material
          </Button>
        }
      />

      {waiting.length > 0 ? (
        <Panel>
          <PanelHeader title="Waiting on material" />
          <PanelBody>
            <ul className="space-y-2">
              {waiting.map((job) => (
                <li
                  key={job.jobCardNo}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-bd-default px-3 py-2.5"
                >
                  <div>
                    <span className="font-mono text-sm font-medium">{job.jobCardNo}</span>
                    <span className="ml-2 text-sm">{job.customerName}</span>
                    <p className="mt-0.5 font-mono text-xs text-fg-muted">
                      needs {job.materialType} · {job.thicknessMicrons} µm ·{' '}
                      {formatNumber(job.estReelWeightKg, 1)} kg · {job.formingMachineCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">No reel issued</Badge>
                    <Button variant="quiet" icon={Plus} onClick={() => openFor(job.jobCardNo)}>
                      Issue
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      ) : null}

      <DataTable
        title="Issue register"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.issueId}
        toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
      />

      {free.length === 0 ? (
        <Note>
          No approved reel is free to issue. Either everything received has already gone to a machine, or it is still
          sitting on the QC screen waiting to be inspected.
        </Note>
      ) : null}

      <Note>
        QC-approved material out to a job card is what lets forming start. Every issue names the receipt and the inspection behind the material, so a formed tray can be traced back to the
        roll and the readings that let it into the plant. Nothing held or rejected at QC can be issued at all.
      </Note>

      <MaterialIssueModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        jobCardNo={forJob}
      />
    </>
  )
}

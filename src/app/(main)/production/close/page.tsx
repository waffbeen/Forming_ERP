'use client'

import * as React from 'react'
import { Lock, TriangleAlert } from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs,
} from '@/components/ui'
import { DetailModal } from '@/components/modals'
import {
  JOB_CARDS, JOB_CLOSURES, USERS, WORK_ORDERS, openNcsFor, readyToClose, remainingQty,
} from '@/data'
import { formatDate, formatNumber, formatPercent } from '@/lib/utils'
import type { CloseReason, JobClosure } from '@/types/production'

const REASON_LABEL: Record<CloseReason, string> = {
  COMPLETED: 'Completed',
  SHORT_CLOSED: 'Short closed',
  CANCELLED: 'Cancelled',
}

const REASON_TONE: Record<CloseReason, 'success' | 'warning' | 'error'> = {
  COMPLETED: 'success',
  SHORT_CLOSED: 'warning',
  CANCELLED: 'error',
}

const TABS = [
  { id: 'READY', label: 'Ready to close', count: readyToClose().length },
  { id: 'CLOSED', label: 'Closed', count: JOB_CLOSURES.length },
]

const userName = (id: string) => USERS.find((u) => u.userId === id)?.userName ?? id

/** A job's work orders, and how far they have got. */
function ordersOf(jobCardNo: string) {
  return WORK_ORDERS.filter((w) => w.jobCardNo === jobCardNo)
}

type ReadyRow = ReturnType<typeof readyToClose>[number]

export default function JobClosePage() {
  const [tab, setTab] = React.useState('READY')
  const [selectedJob, setSelectedJob] = React.useState<string | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const ready = readyToClose()
  const openJobs = JOB_CARDS.filter(
    (j) => !JOB_CLOSURES.some((c) => c.jobCardNo === j.jobCardNo),
  )
  const shortClosed = JOB_CLOSURES.filter((c) => c.reason === 'SHORT_CLOSED')

  const readyColumns: Column<ReadyRow>[] = [
    { key: 'job', header: 'Job card', sortValue: (r) => r.jobCardNo, render: (r) => <StackedCell top={r.jobCardNo} bottom={r.soNumber} mono /> },
    { key: 'customer', header: 'Customer', sortValue: (r) => r.customerName, render: (r) => <StackedCell top={r.customerName} bottom={r.artworkCode} /> },
    {
      key: 'steps',
      header: 'Work orders',
      align: 'right',
      render: (r) => {
        const orders = ordersOf(r.jobCardNo)
        const done = orders.filter((w) => w.workflowStage === 'COMPLETED' || w.workflowStage === 'CLOSED').length
        return (
          <span className="font-mono">
            {done}
            <span className="text-fg-muted"> / {orders.length}</span>
          </span>
        )
      },
    },
    { key: 'ordered', header: 'Ordered', align: 'right', sortValue: (r) => r.targetPiecesQty, render: (r) => <span className="font-mono">{formatNumber(r.targetPiecesQty)}</span> },
    {
      key: 'produced',
      header: 'Produced',
      align: 'right',
      render: (r) => {
        const cutting = ordersOf(r.jobCardNo).find((w) => w.machineType === 'CUTTING')
        return <span className="font-mono font-semibold">{formatNumber(cutting?.producedQty ?? 0)}</span>
      },
    },
    {
      key: 'short',
      header: 'Shortfall',
      align: 'right',
      render: (r) => {
        const cutting = ordersOf(r.jobCardNo).find((w) => w.machineType === 'CUTTING')
        const short = Math.max(r.targetPiecesQty - (cutting?.producedQty ?? 0), 0)
        return short > 0 ? (
          <span className="font-mono text-warning">{formatNumber(short)}</span>
        ) : (
          <span className="font-mono text-success">0</span>
        )
      },
    },
    {
      key: 'state',
      header: 'State',
      render: () => <Badge tone="success">All steps complete</Badge>,
    },
  ]

  const closedColumns: Column<JobClosure>[] = [
    { key: 'job', header: 'Job card', sortValue: (r) => r.jobCardNo, render: (r) => <span className="font-mono font-semibold">{r.jobCardNo}</span> },
    { key: 'closed', header: 'Closed on', sortValue: (r) => r.closedOn, render: (r) => <span className="font-mono">{formatDate(r.closedOn)}</span> },
    { key: 'by', header: 'Closed by', render: (r) => userName(r.closedByUserId) },
    { key: 'ordered', header: 'Ordered', align: 'right', sortValue: (r) => r.orderedQty, render: (r) => <span className="font-mono">{formatNumber(r.orderedQty)}</span> },
    { key: 'produced', header: 'Produced', align: 'right', sortValue: (r) => r.producedQty, render: (r) => <span className="font-mono">{formatNumber(r.producedQty)}</span> },
    {
      key: 'short',
      header: 'Shortfall',
      align: 'right',
      sortValue: (r) => r.shortfallQty,
      render: (r) => (r.shortfallQty > 0 ? <span className="font-mono text-warning">{formatNumber(r.shortfallQty)}</span> : <span className="font-mono text-success">0</span>),
    },
    { key: 'reason', header: 'Reason', sortValue: (r) => r.reason, render: (r) => <Badge tone={REASON_TONE[r.reason]}>{REASON_LABEL[r.reason]}</Badge> },
    { key: 'remarks', header: 'Remarks', render: (r) => r.remarks },
  ]

  const job = selectedJob ? JOB_CARDS.find((j) => j.jobCardNo === selectedJob) : undefined
  const jobOrders = selectedJob ? ordersOf(selectedJob) : []
  const cuttingOrder = jobOrders.find((w) => w.machineType === 'CUTTING')
  const shortfall = job ? Math.max(job.targetPiecesQty - (cuttingOrder?.producedQty ?? 0), 0) : 0

  /* A job with a quality finding still open is not finished, whatever its work
     orders say. Sealing it would put the finding beyond reach of the CAPA it is
     waiting on, so the close is held until the register is clear. */
  const jobOpenNcs = selectedJob ? openNcsFor(selectedJob) : []
  const readyWithOpenNcs = ready.filter((r) => openNcsFor(r.jobCardNo).length > 0)
  const clearToClose = ready.length > 0 && readyWithOpenNcs.length < ready.length

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Job Close"
        actions={
          <Button variant="primary" icon={Lock} disabled={!clearToClose}>
            Close job
          </Button>
        }
      />

      {tab === 'READY' ? (
        <DataTable
          title="Jobs ready to close"
          rows={ready}
          columns={readyColumns}
          rowKey={(r) => r.jobCardNo}
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          selectedKey={selectedJob ?? undefined}
          onSelect={(r) => setSelectedJob(r.jobCardNo)}
          onOpen={(r) => { setSelectedJob(r.jobCardNo); setDetailOpen(true) }}
          summary={{
            job: { type: 'custom', customFn: (r) => `${r.length} jobs` },
            ordered: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.targetPiecesQty, 0)) },
          }}
        />
      ) : (
        <DataTable
          title="Closed jobs"
          rows={JOB_CLOSURES}
          columns={closedColumns}
          rowKey={(r) => r.closureId}
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          summary={{
            job: { type: 'custom', customFn: (r) => `${r.length} closed` },
            ordered: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.orderedQty, 0)) },
            produced: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.producedQty, 0)) },
            short: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, x) => s + x.shortfallQty, 0)) },
          }}
        />
      )}

      {job ? (
        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={job.jobCardNo}
          subtitle={job.customerName}
          badge={shortfall > 0 ? { label: 'Short of the order', tone: 'warning' } : { label: 'Order met', tone: 'success' }}
        >
          <SpecList
            rows={[
              { label: 'Sales order', value: job.soNumber },
              { label: 'Artwork', value: job.artworkCode },
              { label: 'Ordered', value: `${formatNumber(job.targetPiecesQty)} pieces` },
              { label: 'Produced', value: `${formatNumber(cuttingOrder?.producedQty ?? 0)} pieces`, emphasis: true },
              { label: 'Shortfall', value: formatNumber(shortfall) },
              {
                label: 'Against order',
                value: formatPercent(((cuttingOrder?.producedQty ?? 0) / job.targetPiecesQty) * 100, 1),
              },
            ]}
          />

          <Divider />
          <p className="label-caps mb-2">Work orders</p>
          <ul className="space-y-2">
            {jobOrders.map((wo) => (
              <li key={wo.pwoId} className="flex items-center gap-2.5 rounded-md border border-bd-default px-3 py-2">
                <span className="font-mono text-sm font-semibold">{wo.pwoNumber}</span>
                <span className="truncate text-sm text-fg-muted">{wo.processName}</span>
                <span className="ml-auto shrink-0 font-mono text-xs">
                  {formatNumber(wo.producedQty)} / {formatNumber(wo.targetQty)}
                  {remainingQty(wo) > 0 ? (
                    <span className="text-warning"> · {formatNumber(remainingQty(wo))} left</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          <Divider />
          <p className="label-caps mb-2">Quality register</p>
          {jobOpenNcs.length === 0 ? (
            <p className="rounded-md border border-bd-default px-3 py-2 text-sm text-fg-muted">
              Nothing open against this job. The close is not held by quality.
            </p>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-error/35 bg-error-subtle p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-error" />
              <div>
                <h5 className="text-sm font-semibold text-error">
                  {jobOpenNcs.length} non-conformance{jobOpenNcs.length > 1 ? 's' : ''} still open
                </h5>
                <ul className="mt-1 space-y-0.5 text-xs text-fg-muted">
                  {jobOpenNcs.map((nc) => (
                    <li key={nc.ncId}>
                      <span className="font-mono">{nc.ncNumber}</span> · {nc.parameter} · owned by {nc.responsible}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-xs text-fg-muted">
                  The job cannot be sealed until each is closed out with a cause and a corrective and preventive
                  action on the non-conformance register.
                </p>
              </div>
            </div>
          )}

          <Divider />
          <Note>
            Closing seals the job. Nothing can be logged against it afterwards, which is what stops a finished run
            quietly accumulating more output. A job short of its ordered quantity closes as short closed, with the
            shortfall on the record rather than hidden.
          </Note>
        </DetailModal>
      ) : null}
    </>
  )
}

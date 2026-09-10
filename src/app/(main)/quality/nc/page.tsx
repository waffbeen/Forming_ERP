'use client'

import * as React from 'react'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, BadgeTone, Button, Column, DataTable, StackedCell, Tabs,
} from '@/components/ui'
import { NcModal } from '@/components/modals'
import { NON_CONFORMANCES } from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { NcStatus, NonConformance } from '@/types/non-conformance'

/* The non-conformance register.

   Every QC gate in the plant raises into this one list: IQC, line clearance,
   first piece, the hourly checks, the sorting table and finished goods. On
   paper each of those was a remark on its own checklist, which is what made
   "show me what you found last quarter and what you did about it" an
   unanswerable question during an audit. */

const TABS: { id: NcStatus | 'ALL'; label: string }[] = [
  { id: 'OPEN', label: 'Open' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'ALL', label: 'All findings' },
]

const STATUS_TONE: Record<NcStatus, BadgeTone> = {
  OPEN: 'error',
  IN_PROGRESS: 'warning',
  CLOSED: 'success',
}

const STATUS_LABEL: Record<NcStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  CLOSED: 'Closed',
}

const SEVERITY_TONE: Record<NonConformance['severity'], BadgeTone> = {
  MINOR: 'muted',
  MAJOR: 'warning',
  CRITICAL: 'error',
}

/** How far the CAPA has got, which is the honest measure of a finding's age. */
function capaProgress(nc: NonConformance) {
  const done = [nc.disposition, nc.rootCause, nc.correctiveAction, nc.preventiveAction].filter(
    (v) => v && String(v).trim().length > 0,
  ).length
  return `${done} of 4`
}

export default function NonConformancePage() {
  const [tab, setTab] = React.useState<NcStatus | 'ALL'>('OPEN')
  const [raiseOpen, setRaiseOpen] = React.useState(false)
  const [closeTarget, setCloseTarget] = React.useState<NonConformance | null>(null)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? NON_CONFORMANCES : NON_CONFORMANCES.filter((n) => n.status === tab)),
    [tab],
  )

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.id === 'ALL' ? NON_CONFORMANCES.length : NON_CONFORMANCES.filter((n) => n.status === t.id).length,
  }))

  const open = NON_CONFORMANCES.filter((n) => n.status !== 'CLOSED')
  const critical = open.filter((n) => n.severity === 'CRITICAL')
  const overdue = open.filter((n) => n.targetDate < '2026-09-10')

  const columns: Column<NonConformance>[] = [
    {
      key: 'nc',
      header: 'Finding',
      sortValue: (r) => r.ncNumber,
      render: (r) => <StackedCell top={r.ncNumber} bottom={formatDate(r.raisedOn)} mono />,
    },
    {
      key: 'source',
      header: 'Caught at',
      sortValue: (r) => r.source,
      render: (r) => <StackedCell top={r.source} bottom={r.section.charAt(0) + r.section.slice(1).toLowerCase()} />,
    },
    {
      key: 'against',
      header: 'Against',
      render: (r) => <span className="font-mono">{r.jobCardNo || r.grnNumber || '—'}</span>,
    },
    { key: 'param', header: 'Parameter', sortValue: (r) => r.parameter, render: (r) => r.parameter },
    {
      key: 'qty',
      header: 'Affected',
      align: 'right',
      sortValue: (r) => r.qtyAffected,
      render: (r) => (
        <span className="font-mono">
          {formatNumber(r.qtyAffected, 1)} <span className="text-fg-subtle">{r.qtyUom}</span>
        </span>
      ),
    },
    {
      key: 'sev',
      header: 'Severity',
      sortValue: (r) => r.severity,
      render: (r) => <Badge tone={SEVERITY_TONE[r.severity]}>{r.severity.charAt(0) + r.severity.slice(1).toLowerCase()}</Badge>,
    },
    {
      key: 'capa',
      header: 'CAPA',
      align: 'right',
      render: (r) => (
        <span className={r.status === 'CLOSED' ? 'font-mono text-success' : 'font-mono text-fg-muted'}>
          {capaProgress(r)}
        </span>
      ),
    },
    { key: 'owner', header: 'Responsible', render: (r) => r.responsible },
    {
      key: 'target',
      header: 'Target',
      sortValue: (r) => r.targetDate,
      render: (r) => (
        <span className={r.status !== 'CLOSED' && r.targetDate < '2026-09-10' ? 'font-mono text-error' : 'font-mono'}>
          {formatDate(r.targetDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
    {
      key: 'act',
      header: 'Closed on',
      render: (r) =>
        r.status === 'CLOSED' ? (
          <span className="text-xs text-fg-subtle">{r.closedOn ? formatDate(r.closedOn) : '—'}</span>
        ) : (
          <span className="text-xs text-fg-subtle">Open</span>
        ),
    },
  ]

  /* Memoised: a fresh object on every render would rebuild the grid's columns. */
  const actions = React.useMemo(
    () => ({
      onEdit: (row: NonConformance) => setCloseTarget(row),
      // A closed non-conformance is a sealed record; it does not reopen here.
      showEdit: (row: NonConformance) => row.status !== 'CLOSED',
      mode: 'buttons' as const,
      primaryActions: ['edit' as const],
      labels: { edit: 'Close out' },
    }),
    [],
  )

  return (
    <>
      <PageHeader
        eyebrow="Quality & Compliance"
        title="Non-Conformance Register"
        actions={
          <Button variant="primary" icon={ShieldAlert} onClick={() => setRaiseOpen(true)}>
            Raise a finding
          </Button>
        }
      />

      <DataTable
        title="Findings"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.ncId}
        mainColumns="nc,source,param,status,act"
        actions={actions}
        toolbar={<Tabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as NcStatus | 'ALL')} />}
      />

      <NcModal isOpen={raiseOpen} onClose={() => setRaiseOpen(false)} />
      <NcModal
        isOpen={closeTarget !== null}
        onClose={() => setCloseTarget(null)}
        existing={closeTarget}
      />
    </>
  )
}

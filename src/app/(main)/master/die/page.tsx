'use client'

import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { DieModal } from '@/components/modals'
import { DIES } from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import type { Die } from '@/types'

/** A die within 10 % of its service interval needs booking into the tool room. */
function serviceState(die: Die) {
  const used = die.strokesSinceService / die.serviceDueAt
  if (used >= 0.98) return { tone: 'error' as const, label: 'Service overdue' }
  if (used >= 0.9) return { tone: 'warning' as const, label: 'Service due' }
  return { tone: 'success' as const, label: 'In service' }
}

const columns: Column<Die>[] = [
  { key: 'code', sortValue: (r) => r.dieCode, header: 'Die', render: (r) => <StackedCell top={r.dieCode} bottom={r.artworkCode} mono /> },
  {
    key: 'type', sortValue: (r) => r.type,
    header: 'Stage',
    render: (r) => (
      <Badge tone={r.type === 'FORMING' ? 'primary' : 'info'}>{r.type === 'FORMING' ? 'Forming' : 'Cutting'}</Badge>
    ),
  },
  { key: 'cav', sortValue: (r) => r.cavities, header: 'Cavities', align: 'right', render: (r) => <span className="font-mono">{r.cavities}</span> },
  {
    key: 'strokes', sortValue: (r) => r.strokesSinceService,
    header: 'Strokes since service',
    align: 'right',
    render: (r) => (
      <span className="font-mono">
        {formatNumber(r.strokesSinceService)} <span className="text-fg-muted">/ {formatNumber(r.serviceDueAt)}</span>
      </span>
    ),
  },
  {
    key: 'life',
    header: 'Interval used',
    width: '130px',
    render: (r) => {
      const pct = Math.min((r.strokesSinceService / r.serviceDueAt) * 100, 100)
      const state = serviceState(r)
      return (
        <span className="flex items-center gap-2">
          <span className="h-1.5 min-w-[60px] flex-1 rounded-sm bg-bd-subtle">
            <span
              className={
                state.tone === 'error' ? 'block h-full rounded-sm bg-error'
                : state.tone === 'warning' ? 'block h-full rounded-sm bg-warning'
                : 'block h-full rounded-sm bg-success'
              }
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="font-mono text-xs text-fg-muted">{Math.round(pct)} %</span>
        </span>
      )
    },
  },
  { key: 'serviced', sortValue: (r) => r.lastServicedOn, header: 'Last serviced', render: (r) => <span className="font-mono">{formatDate(r.lastServicedOn)}</span> },
  { key: 'loc', header: 'Location', render: (r) => r.location },
  { key: 'state', header: 'Status', render: (r) => <Badge tone={serviceState(r).tone}>{serviceState(r).label}</Badge> },
]

export default function DieMasterPage() {
  const overdue = DIES.filter((d) => d.strokesSinceService / d.serviceDueAt >= 0.98)
  const dueSoon = DIES.filter((d) => {
    const used = d.strokesSinceService / d.serviceDueAt
    return used >= 0.9 && used < 0.98
  })

  return (
    <MasterPage
      title="Dies & Tools"
      entityName="die"
      rows={DIES}
      columns={columns}
      rowKey={(r) => r.dieId}
      createModal={(props) => <DieModal {...props} />}
    />
  )
}

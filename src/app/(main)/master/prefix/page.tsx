'use client'

import { CalendarClock, Hash, ListOrdered, RotateCcw } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { PrefixModal } from '@/components/modals'
import { DOCUMENT_PREFIXES } from '@/data'
import { formatDocumentNumber } from '@/types/masters'
import { formatNumber } from '@/lib/utils'
import type { DocumentPrefix } from '@/types/masters'

const columns: Column<DocumentPrefix>[] = [
  {
    key: 'doc',
    header: 'Document',
    sortValue: (r) => r.documentName,
    render: (r) => <StackedCell top={r.documentName} bottom={r.documentKind.replace(/_/g, ' ').toLowerCase()} />,
  },
  { key: 'prefix', header: 'Prefix', sortValue: (r) => r.prefix, render: (r) => <span className="font-mono font-semibold">{r.prefix}</span> },
  { key: 'fy', header: 'Financial year', sortValue: (r) => r.financialYear, render: (r) => <span className="font-mono">{r.financialYear}</span> },
  { key: 'sep', header: 'Separator', render: (r) => <span className="font-mono">{r.separator || '—'}</span> },
  { key: 'pad', header: 'Padding', align: 'right', sortValue: (r) => r.padding, render: (r) => <span className="font-mono">{r.padding}</span> },
  {
    key: 'current',
    header: 'Current number',
    align: 'right',
    sortValue: (r) => r.currentNumber,
    render: (r) => <span className="font-mono">{formatNumber(r.currentNumber)}</span>,
  },
  {
    key: 'next',
    header: 'Next number issued',
    render: (r) => <span className="font-mono font-semibold text-primary">{formatDocumentNumber(r)}</span>,
  },
  {
    key: 'reset',
    header: 'Year reset',
    sortValue: (r) => String(r.resetsAnnually),
    render: (r) =>
      r.resetsAnnually ? <Badge tone="info">Resets 1 April</Badge> : <Badge tone="muted">Runs on</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => r.status,
    render: (r) => (r.status === 'ACTIVE' ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>),
  },
]

export default function PrefixMasterPage() {
  const resetting = DOCUMENT_PREFIXES.filter((p) => p.resetsAnnually)
  const issuedThisYear = DOCUMENT_PREFIXES.filter((p) => p.resetsAnnually).reduce(
    (s, p) => s + p.currentNumber,
    0,
  )

  return (
    <MasterPage
      title="Document Prefixes"
      entityName="prefix"
      stats={[
        { label: 'Numbering rules', value: String(DOCUMENT_PREFIXES.length), note: 'One per document type', icon: Hash },
        { label: 'Reset annually', value: String(resetting.length), note: 'Series restarts on 1 April', icon: RotateCcw },
        { label: 'Run continuously', value: String(DOCUMENT_PREFIXES.length - resetting.length), note: 'Artwork and product codes', icon: ListOrdered },
        { label: 'Issued this year', value: formatNumber(issuedThisYear), note: 'Across resetting series', icon: CalendarClock },
      ]}
      rows={DOCUMENT_PREFIXES}
      columns={columns}
      rowKey={(r) => r.prefixId}
      createModal={(props) => <PrefixModal {...props} />}
    />
  )
}

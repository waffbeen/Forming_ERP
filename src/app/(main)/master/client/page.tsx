'use client'

import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { CustomerModal } from '@/components/modals'
import { CUSTOMERS } from '@/data'
import type { Customer } from '@/types'

const SEGMENT_TONE = {
  Pharmaceutical: 'info',
  Food: 'success',
  Cosmetics: 'primary',
} as const

const columns: Column<Customer>[] = [
  { key: 'code', sortValue: (r) => r.customerCode, header: 'Code', render: (r) => <span className="font-mono">{r.customerCode}</span> },
  { key: 'name', sortValue: (r) => r.customerName, header: 'Customer', render: (r) => <StackedCell top={r.customerName} bottom={r.city} /> },
  { key: 'segment', sortValue: (r) => r.segment, header: 'Segment', render: (r) => <Badge tone={SEGMENT_TONE[r.segment]}>{r.segment}</Badge> },
  { key: 'gstin', header: 'GSTIN', render: (r) => <span className="font-mono">{r.gstin}</span> },
  { key: 'terms', header: 'Payment terms', render: (r) => r.paymentTerms },
  {
    key: 'artworks', sortValue: (r) => r.activeArtworks,
    header: 'Active artworks',
    align: 'right',
    render: (r) => <span className="font-mono">{r.activeArtworks}</span>,
  },
]

export default function ClientMasterPage() {
  const bySegment = (segment: Customer['segment']) => CUSTOMERS.filter((c) => c.segment === segment).length

  return (
    <MasterPage
      title="Clients"
      entityName="client"
      rows={CUSTOMERS}
      columns={columns}
      rowKey={(r) => r.customerId}
      createModal={(props) => <CustomerModal {...props} />}
    />
  )
}

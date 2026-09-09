'use client'

import { Award, Clock, Truck, XCircle } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Badge, Chip, Column, StackedCell } from '@/components/ui'
import { SupplierModal } from '@/components/modals'
import { SUPPLIERS } from '@/data'
import { formatNumber } from '@/lib/utils'
import type { Supplier } from '@/types/masters'

/** Below 90 % first-pass IQC the buyer should be having a conversation. */
function ratingTone(pct: number) {
  if (pct >= 95) return 'success' as const
  if (pct >= 90) return 'warning' as const
  return 'error' as const
}

const columns: Column<Supplier>[] = [
  { key: 'code', header: 'Code', sortValue: (r) => r.supplierCode, render: (r) => <span className="font-mono">{r.supplierCode}</span> },
  { key: 'name', header: 'Supplier', sortValue: (r) => r.supplierName, render: (r) => <StackedCell top={r.supplierName} bottom={r.city} /> },
  { key: 'contact', header: 'Contact', render: (r) => <StackedCell top={r.contactPerson} bottom={r.contactNo} /> },
  { key: 'gstin', header: 'GSTIN', render: (r) => <span className="font-mono">{r.gstin}</span> },
  {
    key: 'materials',
    header: 'Approved for',
    render: (r) =>
      r.materialsSupplied.length ? (
        <span className="flex gap-1">
          {r.materialsSupplied.map((m) => (
            <Chip key={m}>{m}</Chip>
          ))}
        </span>
      ) : (
        <span className="text-fg-subtle">Non-polymer</span>
      ),
  },
  { key: 'lead', header: 'Lead time', align: 'right', sortValue: (r) => r.leadTimeDays, render: (r) => <span className="font-mono">{r.leadTimeDays} days</span> },
  { key: 'terms', header: 'Payment terms', render: (r) => r.paymentTerms },
  {
    key: 'rating',
    header: 'IQC first pass',
    align: 'right',
    sortValue: (r) => r.qualityRatingPct,
    render: (r) => (
      <Badge tone={ratingTone(r.qualityRatingPct)}>{formatNumber(r.qualityRatingPct, 1)} %</Badge>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => r.status,
    render: (r) => (r.status === 'ACTIVE' ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>),
  },
]

export default function SupplierMasterPage() {
  const active = SUPPLIERS.filter((s) => s.status === 'ACTIVE')
  const polymer = active.filter((s) => s.materialsSupplied.length > 0)
  const underperforming = active.filter((s) => s.qualityRatingPct < 90)
  const avgLead = active.reduce((s, x) => s + x.leadTimeDays, 0) / active.length

  return (
    <MasterPage
      title="Suppliers"
      entityName="supplier"
      stats={[
        { label: 'Active suppliers', value: String(active.length), note: `${polymer.length} approved for polymer`, icon: Truck },
        { label: 'Average lead time', value: formatNumber(avgLead, 1), unit: 'days', note: 'Planning buffer for reel requisitions', icon: Clock },
        { label: 'Below 90 % first pass', value: String(underperforming.length), note: underperforming[0]?.supplierName ?? 'None', noteTone: underperforming.length ? 'bad' : 'good', icon: XCircle },
        { label: 'Best rated', value: formatNumber(Math.max(...active.map((s) => s.qualityRatingPct)), 1), unit: '%', note: 'Ambica Packaging', noteTone: 'good', icon: Award },
      ]}
      rows={SUPPLIERS}
      columns={columns}
      rowKey={(r) => r.supplierId}
      createModal={(props) => <SupplierModal {...props} />}
    />
  )
}

'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs, type BadgeTone,
} from '@/components/ui'
import { DetailModal, EnquiryModal } from '@/components/modals'
import { ESTIMATIONS, SALES_ENQUIRIES } from '@/data'
import { formatCurrency, formatDayMonth, formatNumber } from '@/lib/utils'
import type { EnquiryStatus, SalesEnquiry } from '@/types'

const STATUS_TONE: Record<EnquiryStatus, BadgeTone> = {
  OPEN: 'warning',
  ESTIMATED: 'info',
  CONVERTED: 'success',
  LOST: 'muted',
}

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  OPEN: 'Open',
  ESTIMATED: 'Estimated',
  CONVERTED: 'Converted',
  LOST: 'Lost',
}

const SOURCE_LABEL: Record<SalesEnquiry['source'], string> = {
  EMAIL: 'Email',
  PHONE: 'Phone',
  PLANT_VISIT: 'Plant visit',
  REFERRAL: 'Referral',
}

const countBy = (status: EnquiryStatus) => SALES_ENQUIRIES.filter((e) => e.status === status).length

const TABS = [
  { id: 'ALL', label: 'All', count: SALES_ENQUIRIES.length },
  { id: 'OPEN', label: 'Awaiting costing', count: countBy('OPEN') },
  { id: 'ESTIMATED', label: 'Estimated', count: countBy('ESTIMATED') },
  { id: 'CONVERTED', label: 'Converted', count: countBy('CONVERTED') },
]

export default function EnquiryPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(SALES_ENQUIRIES[0].enquiryId)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? SALES_ENQUIRIES : SALES_ENQUIRIES.filter((e) => e.status === tab)),
    [tab],
  )

  const selected =
    rows.find((e) => e.enquiryId === selectedId) ?? rows[0] ?? SALES_ENQUIRIES[0]

  /* Every offer already made against this enquiry, so the history of what was
     quoted sits with the thing that was asked for. */
  const offers = ESTIMATIONS.filter((e) => e.enquiryNo === selected.enquiryNo)

  const columns: Column<SalesEnquiry>[] = [
    {
      key: 'enq',
      sortValue: (r) => r.enquiryNo,
      header: 'Enquiry no.',
      render: (r) => <span className="font-mono">{r.enquiryNo}</span>,
    },
    {
      key: 'customer',
      sortValue: (r) => r.customerName,
      header: 'Customer',
      render: (r) => (
        <StackedCell
          top={r.customerName}
          bottom={r.customerId ? r.contactPerson : `Prospect · ${r.contactPerson}`}
        />
      ),
    },
    {
      key: 'product',
      sortValue: (r) => r.productDescription,
      header: 'Asking for',
      render: (r) => (
        <StackedCell top={r.productDescription} bottom={r.artworkCode ?? 'No artwork on file'} />
      ),
    },
    {
      key: 'spec',
      header: 'Material',
      render: (r) => (
        <>
          {r.materialType} · <span className="font-mono">{r.thicknessMicrons} µm</span>
        </>
      ),
    },
    {
      key: 'qty',
      sortValue: (r) => r.expectedQtyPcs,
      header: 'Quantity',
      align: 'right',
      render: (r) => <span className="font-mono">{formatNumber(r.expectedQtyPcs)}</span>,
    },
    {
      key: 'target',
      sortValue: (r) => r.targetRatePerPc ?? 0,
      header: 'Target rate',
      align: 'right',
      render: (r) =>
        r.targetRatePerPc !== null ? (
          <span className="font-mono">{formatCurrency(r.targetRatePerPc)}</span>
        ) : (
          <span className="text-fg-subtle">Not stated</span>
        ),
    },
    {
      key: 'required',
      sortValue: (r) => r.requiredBy,
      header: 'Required by',
      render: (r) => <span className="font-mono">{formatDayMonth(r.requiredBy)}</span>,
    },
    {
      key: 'status',
      sortValue: (r) => r.status,
      header: 'Status',
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Order to Cash"
        title="Sales Enquiries"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            New Enquiry
          </Button>
        }
      />

      <DataTable
        title="Enquiry register"
        toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
        rows={rows}
        columns={columns}
        rowKey={(r) => r.enquiryId}
        searchText={(r) => `${r.enquiryNo} ${r.customerName} ${r.productDescription} ${r.artworkCode ?? ''}`}
        searchPlaceholder="Search enquiry number, customer or product"
        selectedKey={selected.enquiryId}
        onSelect={(r) => setSelectedId(r.enquiryId)}
        onOpen={(r) => {
          setSelectedId(r.enquiryId)
          setDetailOpen(true)
        }}
        summary={{
          enq: { type: 'custom', customFn: (r) => `${r.length} enquiries` },
          qty: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, e) => s + e.expectedQtyPcs, 0)) },
        }}
      />

      <DetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected.enquiryNo}
        subtitle={selected.customerName}
        badge={{ label: STATUS_LABEL[selected.status], tone: STATUS_TONE[selected.status] }}
        size="xl"
      >
        <SpecList
          rows={[
            { label: 'Customer', value: selected.customerName, mono: false },
            { label: 'On record as', value: selected.customerId ? 'Existing customer' : 'Prospect', mono: false },
            { label: 'Contact', value: selected.contactPerson, mono: false },
            { label: 'Came in by', value: SOURCE_LABEL[selected.source], mono: false },
            { label: 'Logged on', value: formatDayMonth(selected.enquiryDate) },
          ]}
        />
        <Divider />
        <SpecList
          rows={[
            { label: 'Asking for', value: selected.productDescription, mono: false },
            { label: 'Artwork on file', value: selected.artworkCode ?? 'None yet' },
            { label: 'Material', value: `${selected.materialType} · ${selected.thicknessMicrons} µm`, mono: false },
            { label: 'Open layout', value: `${selected.openLengthMm} × ${selected.openWidthMm} mm` },
            { label: 'Formed depth', value: `${selected.depthMm} mm` },
            { label: 'Quantity', value: formatNumber(selected.expectedQtyPcs), emphasis: true },
            {
              label: 'Target rate',
              value: selected.targetRatePerPc !== null ? formatCurrency(selected.targetRatePerPc) : 'Not stated',
            },
            { label: 'Required by', value: formatDayMonth(selected.requiredBy) },
          ]}
        />
        {offers.length > 0 ? (
          <>
            <Divider />
            <p className="label-caps mb-2">Offers made</p>
            <SpecList
              rows={offers.map((o) => ({
                label: `${o.estimationNo} · ${o.status.toLowerCase()}`,
                value: `${formatCurrency(o.offeredRatePerPc)} / pc`,
              }))}
            />
          </>
        ) : null}
        {selected.remarks ? (
          <>
            <Divider />
            <p className="text-sm text-fg-muted">{selected.remarks}</p>
          </>
        ) : null}
      </DetailModal>

      <EnquiryModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

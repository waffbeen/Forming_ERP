'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs, TotalRow,
  type BadgeTone,
} from '@/components/ui'
import { DetailModal, EstimationModal } from '@/components/modals'
import { ESTIMATIONS, SALES_ENQUIRIES, SALES_ORDERS, marginOn } from '@/data'
import { formatCurrency, formatDayMonth, formatKg, formatNumber, formatPercent } from '@/lib/utils'
import type { Estimation, EstimationStatus } from '@/types'

const STATUS_TONE: Record<EstimationStatus, BadgeTone> = {
  DRAFT: 'muted',
  SENT: 'info',
  APPROVED: 'success',
  LOST: 'error',
  CONVERTED: 'primary',
}

const STATUS_LABEL: Record<EstimationStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  APPROVED: 'Approved',
  LOST: 'Lost',
  CONVERTED: 'Converted',
}

const countBy = (status: EstimationStatus) => ESTIMATIONS.filter((e) => e.status === status).length

const TABS = [
  { id: 'ALL', label: 'All', count: ESTIMATIONS.length },
  { id: 'DRAFT', label: 'Draft', count: countBy('DRAFT') },
  { id: 'SENT', label: 'With the customer', count: countBy('SENT') },
  { id: 'APPROVED', label: 'Approved', count: countBy('APPROVED') },
]

export default function EstimationPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(ESTIMATIONS[0].estimationId)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? ESTIMATIONS : ESTIMATIONS.filter((e) => e.status === tab)),
    [tab],
  )

  const selected = rows.find((e) => e.estimationId === selectedId) ?? rows[0] ?? ESTIMATIONS[0]
  const enquiry = SALES_ENQUIRIES.find((e) => e.enquiryNo === selected.enquiryNo)
  const order = SALES_ORDERS.find((o) => o.estimationNo === selected.estimationNo)

  const columns: Column<Estimation>[] = [
    {
      key: 'est',
      sortValue: (r) => r.estimationNo,
      header: 'Estimation no.',
      render: (r) => (
        <StackedCell top={r.estimationNo} bottom={r.enquiryNo ?? 'Direct costing'} mono />
      ),
    },
    {
      key: 'customer',
      sortValue: (r) => r.customerName,
      header: 'Customer',
      render: (r) => <StackedCell top={r.customerName} bottom={r.productDescription} />,
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
      key: 'ups',
      sortValue: (r) => r.upsPerSheet,
      header: 'Ups',
      align: 'right',
      render: (r) => <span className="font-mono">{r.upsPerSheet}</span>,
    },
    {
      key: 'qty',
      sortValue: (r) => r.quantityPcs,
      header: 'Quantity',
      align: 'right',
      render: (r) => <span className="font-mono">{formatNumber(r.quantityPcs)}</span>,
    },
    {
      key: 'cost',
      sortValue: (r) => r.costPerPiece,
      header: 'Landed cost',
      align: 'right',
      render: (r) => <span className="font-mono">{formatCurrency(r.costPerPiece)}</span>,
    },
    {
      key: 'rate',
      sortValue: (r) => r.offeredRatePerPc,
      header: 'Offered rate',
      align: 'right',
      render: (r) => <span className="font-mono">{formatCurrency(r.offeredRatePerPc)}</span>,
    },
    {
      key: 'value',
      sortValue: (r) => r.orderValue,
      header: 'Order value',
      align: 'right',
      render: (r) => <span className="font-mono">{formatCurrency(r.orderValue, 0)}</span>,
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
        title="Estimations"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            New Estimation
          </Button>
        }
      />

      <DataTable
        title="Offer register"
        toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
        mainColumns="est,customer,rate,status"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.estimationId}
        searchText={(r) => `${r.estimationNo} ${r.customerName} ${r.productDescription} ${r.enquiryNo ?? ''}`}
        searchPlaceholder="Search estimation number, customer or product"
        selectedKey={selected.estimationId}
        onSelect={(r) => setSelectedId(r.estimationId)}
        onOpen={(r) => {
          setSelectedId(r.estimationId)
          setDetailOpen(true)
        }}
        summary={{
          est: { type: 'custom', customFn: (r) => `${r.length} estimations` },
          qty: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, e) => s + e.quantityPcs, 0)) },
          value: { type: 'custom', customFn: (r) => formatCurrency(r.reduce((s, e) => s + e.orderValue, 0), 0) },
        }}
      />

      <DetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected.estimationNo}
        subtitle={`${selected.customerName} · ${selected.productDescription}`}
        badge={{ label: STATUS_LABEL[selected.status], tone: STATUS_TONE[selected.status] }}
        size="xl"
      >
        <SpecList
          rows={[
            { label: 'Against enquiry', value: selected.enquiryNo ?? 'Costed without an enquiry' },
            { label: 'Prepared by', value: selected.preparedBy, mono: false },
            { label: 'Dated', value: formatDayMonth(selected.estimationDate) },
            { label: 'Valid until', value: formatDayMonth(selected.validUntil) },
            { label: 'Raised as order', value: order?.soNumber ?? 'Not yet' },
          ]}
        />
        <Divider />
        <SpecList
          rows={[
            { label: 'Artwork', value: selected.artworkCode ?? 'New design' },
            { label: 'Material', value: `${selected.materialType} · ${selected.thicknessMicrons} µm`, mono: false },
            { label: 'Open layout', value: `${selected.openLengthMm} × ${selected.openWidthMm} mm` },
            { label: 'Cavity ups per sheet', value: `${selected.upsPerSheet} ups`, emphasis: true },
            { label: 'Quantity', value: formatNumber(selected.quantityPcs) },
            { label: 'Sheets required', value: formatNumber(selected.sheetsRequired) },
            { label: 'Gross reel weight', value: formatKg(selected.grossWeightKg), emphasis: true },
          ]}
        />
        <Divider />
        <SpecList
          rows={[
            { label: 'Landed cost per piece', value: formatCurrency(selected.costPerPiece) },
            { label: 'Conversion in that cost', value: `${formatCurrency(selected.conversionRatePerPc)} / pc` },
            { label: 'Margin applied', value: formatPercent(selected.marginPercent) },
            {
              label: 'Margin on the offered rate',
              value: formatPercent(marginOn(selected.costPerPiece, selected.offeredRatePerPc)),
            },
            {
              label: 'Customer target',
              value:
                enquiry?.targetRatePerPc != null ? formatCurrency(enquiry.targetRatePerPc) : 'Not stated',
            },
          ]}
        />
        <Divider />
        <TotalRow label="Offered rate per piece" value={formatCurrency(selected.offeredRatePerPc)} />
        <TotalRow label="Order value" value={formatCurrency(selected.orderValue, 0)} />
      </DetailModal>

      <EstimationModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

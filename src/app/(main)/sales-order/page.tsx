'use client'

import * as React from 'react'
import { FileText, Plus, RefreshCw, IndianRupee, CircleDot, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, Divider, Panel, PanelBody, PanelHeader,
  SpecList, StackedCell, StatsCard, StatsGrid, Tabs, TotalRow,
} from '@/components/ui'
import { SalesOrderModal } from '@/components/modals'
import { OrderStatusBadge } from '@/lib/shared-ui'
import { ARTWORKS, MATERIALS, SALES_ORDERS } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateCosting, calculateNesting } from '@/lib/layout-calc'
import {
  formatCurrency, formatDayMonth, formatKg, formatMicrons, formatNumber, formatPercent,
} from '@/lib/utils'
import type { SalesOrder } from '@/types'

const countBy = (status: SalesOrder['status']) => SALES_ORDERS.filter((o) => o.status === status).length

const TABS = [
  { id: 'ALL', label: 'All', count: SALES_ORDERS.length },
  { id: 'AWAITING_ARTWORK', label: 'Awaiting artwork', count: countBy('AWAITING_ARTWORK') },
  { id: 'READY_TO_RELEASE', label: 'Ready to release', count: countBy('READY_TO_RELEASE') },
  { id: 'IN_PRODUCTION', label: 'In production', count: countBy('IN_PRODUCTION') },
]

export default function SalesOrderPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(SALES_ORDERS[0].salesOrderId)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? SALES_ORDERS : SALES_ORDERS.filter((o) => o.status === tab)),
    [tab],
  )

  /* Keep the detail panel on a row the grid is actually showing: switching
     tabs used to leave it describing an order that had been filtered out. */
  const selected =
    rows.find((o) => o.salesOrderId === selectedId) ?? rows[0] ?? SALES_ORDERS[0]
  const artwork = ARTWORKS.find((a) => a.artworkCode === selected.artworkCode)
  const material = MATERIALS.find((m) => m.materialType === selected.materialType)

  const nesting = artwork
    ? calculateNesting({
        openLengthMm: artwork.openLengthMm,
        openWidthMm: artwork.openWidthMm,
        deckleWidthMm: DECKLE_MM,
        bedPitchMm: PLANT.bedLengthMm,
      })
    : null

  const costing =
    artwork && material && nesting
      ? calculateCosting({
          targetPiecesQty: selected.orderQtyPcs,
          upsPerSheet: nesting.upsPerSheet,
          utilisation: nesting.utilisation,
          deckleWidthMm: DECKLE_MM,
          bedPitchMm: PLANT.bedLengthMm,
          thicknessMicrons: selected.thicknessMicrons,
          densityGCm3: material.densityGCm3,
          ratePerKg: material.ratePerKg,
          scrapRatePerKg: material.scrapRatePerKg,
          conversionRatePerPc: 0.85,
        })
      : null

  const openValue = SALES_ORDERS.filter((o) => o.status !== 'DISPATCHED').reduce(
    (sum, o) => sum + o.orderQtyPcs * o.ratePerPc,
    0,
  )

  const columns: Column<SalesOrder>[] = [
    { key: 'so', sortValue: (r) => r.soNumber, header: 'SO No.', render: (r) => <span className="font-mono">{r.soNumber}</span> },
    {
      key: 'customer', sortValue: (r) => r.customerName,
      header: 'Customer',
      render: (r) => {
        const aw = ARTWORKS.find((a) => a.artworkCode === r.artworkCode)
        return <StackedCell top={r.customerName} bottom={aw?.clientProductRef ?? r.clientPoRef} />
      },
    },
    { key: 'artwork', sortValue: (r) => r.artworkCode, header: 'Artwork code', render: (r) => <span className="font-mono">{r.artworkCode}</span> },
    {
      key: 'material',
      header: 'Material',
      render: (r) => (
        <>
          {r.materialType} · <span className="font-mono">{formatMicrons(r.thicknessMicrons)}</span>
        </>
      ),
    },
    { key: 'qty', sortValue: (r) => r.orderQtyPcs, header: 'Order qty', align: 'right', render: (r) => <span className="font-mono">{formatNumber(r.orderQtyPcs)}</span> },
    { key: 'delivery', sortValue: (r) => r.deliveryDate, header: 'Delivery', render: (r) => <span className="font-mono">{formatDayMonth(r.deliveryDate)}</span> },
    { key: 'status', sortValue: (r) => r.status, header: 'Status', render: (r) => <OrderStatusBadge status={r.status} /> },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Order to Cash"
        title="Sales Orders"
        actions={
          <>
            <Button icon={RefreshCw}>Refresh</Button>
            <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
              New Sales Order
            </Button>
          </>
        }
      />

      <StatsGrid>
        <StatsCard label="Open orders" value={String(SALES_ORDERS.length)} note="4 due within 3 days" icon={FileText} />
        <StatsCard
          label="Awaiting artwork approval"
          value={String(SALES_ORDERS.filter((o) => o.status === 'AWAITING_ARTWORK').length)}
          note="Blocks job card release"
          noteTone="warn"
          icon={CircleDot}
        />
        <StatsCard
          label="Ready for job card"
          value={String(SALES_ORDERS.filter((o) => o.status === 'READY_TO_RELEASE').length)}
          note="Costing locked"
          noteTone="good"
          icon={Check}
        />
        <StatsCard
          label="Open order value"
          value={formatNumber(openValue / 100000, 1)}
          unit="lakh"
          note={`Across ${new Set(SALES_ORDERS.map((o) => o.customerId)).size} customers`}
          icon={IndianRupee}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
        <DataTable
          title="Order queue"
          toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
          mainColumns="so,customer,artwork,status"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.salesOrderId}
          searchText={(r) => `${r.soNumber} ${r.customerName} ${r.artworkCode} ${r.clientPoRef}`}
          searchPlaceholder="Search SO number, customer, artwork or PO reference"
          selectedKey={selected.salesOrderId}
          onSelect={(r) => setSelectedId(r.salesOrderId)}
        />

        <div className="flex flex-col gap-3.5">
          <Panel>
            <PanelHeader
              title="Artwork master"
              description={<span className="font-mono">{selected.artworkCode}</span>}
              action={
                artwork?.approved ? (
                  <Badge tone="success">Drawing approved</Badge>
                ) : (
                  <Badge tone="warning">Approval pending</Badge>
                )
              }
            />
            <PanelBody>
              {artwork ? (
                <>
                  <SpecList
                    rows={[
                      { label: 'Customer reference', value: artwork.clientProductRef, mono: false },
                      { label: 'Client PO', value: selected.clientPoRef },
                      { label: 'Open layout (expanded)', value: `${artwork.openLengthMm} × ${artwork.openWidthMm} mm` },
                      { label: 'Formed depth', value: `${artwork.depthMm} mm` },
                      { label: 'Reel thickness', value: formatMicrons(selected.thicknessMicrons) },
                      { label: 'Cavity ups per sheet', value: `${nesting?.upsPerSheet ?? 0} ups`, emphasis: true },
                      { label: 'Drawing', value: artwork.drawingRef },
                    ]}
                  />
                  <Divider />
                </>
              ) : (
                <p className="text-sm text-fg-subtle">No artwork master linked to this order yet.</p>
              )}
            </PanelBody>
        </Panel>

          {costing && nesting ? (
            <Panel>
              <PanelHeader
                title="Auto-costing"
              />
              <PanelBody>
                <SpecList
                  rows={[
                    { label: 'Sheets required', value: formatNumber(costing.sheets) },
                    { label: 'Nesting', value: `${nesting.across} across × ${nesting.down} down` },
                    { label: 'Reel deckle', value: `${DECKLE_MM} mm` },
                    { label: 'Reel length', value: `${formatNumber(costing.reelLengthM, 1)} m` },
                    { label: 'Gross reel weight', value: formatKg(costing.grossWeightKg), emphasis: true },
                    {
                      label: 'Skeleton allowance',
                      value: `${formatPercent(nesting.skeletonFraction * 100)} · ${formatKg(costing.skeletonKg)}`,
                    },
                    { label: 'Net tray weight', value: `${formatNumber(costing.gramsPerPiece, 2)} g / pc` },
                  ]}
                />
                <Divider />
                <SpecList
                  rows={[
                    {
                      label: `${selected.materialType} @ ${formatCurrency(material!.ratePerKg, 0)} / kg`,
                      value: formatCurrency(costing.materialCost, 0),
                    },
                    {
                      label: `Scrap recovery @ ${formatCurrency(material!.scrapRatePerKg, 0)} / kg`,
                      value: `− ${formatCurrency(costing.scrapRecovery, 0)}`,
                    },
                    { label: 'Conversion @ ₹ 0.85 / pc', value: formatCurrency(costing.conversionCost, 0) },
                  ]}
                />
                <Divider />
                <SpecList
                  rows={[
                    { label: 'Quoted rate', value: formatCurrency(selected.ratePerPc) },
                    {
                      label: 'Margin',
                      value: formatPercent(
                        ((selected.ratePerPc - costing.costPerPiece) / selected.ratePerPc) * 100,
                      ),
                    },
                  ]}
                />
                <Divider />
                <TotalRow label="Landed cost per tray" value={formatCurrency(costing.costPerPiece)} />
              </PanelBody>
            </Panel>
          ) : null}
        </div>
      </div>

      <SalesOrderModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

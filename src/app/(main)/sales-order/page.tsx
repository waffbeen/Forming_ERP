'use client'

import * as React from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button, Column, DataTable, Divider, SpecList, StackedCell, Tabs, TotalRow,
} from '@/components/ui'
import { DetailModal, SalesOrderModal } from '@/components/modals'
import { OrderStatusBadge } from '@/lib/shared-ui'
import {
  ARTWORKS, MATERIALS, PRODUCTS, SALES_ORDERS, lineArtworkCode, lineLabel,
  orderDeliveryDate, orderQty, orderValue,
} from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateCosting, calculateNesting } from '@/lib/layout-calc'
import {
  formatCurrency, formatDayMonth, formatKg, formatMicrons, formatNumber, formatPercent,
} from '@/lib/utils'
import type { SalesOrder, SalesOrderLine } from '@/types'

const CONVERSION_PER_PC = 0.85

const countBy = (status: SalesOrder['status']) => SALES_ORDERS.filter((o) => o.status === status).length

const TABS = [
  { id: 'ALL', label: 'All', count: SALES_ORDERS.length },
  { id: 'AWAITING_ARTWORK', label: 'Awaiting artwork', count: countBy('AWAITING_ARTWORK') },
  { id: 'READY_TO_RELEASE', label: 'Ready to release', count: countBy('READY_TO_RELEASE') },
  { id: 'IN_PRODUCTION', label: 'In production', count: countBy('IN_PRODUCTION') },
]

/**
 * What one line costs to make. A line ordered by product code is costed off
 * the drawing that product was built from, so an own product and a customer
 * design on the same order are priced by the same arithmetic.
 */
function costLine(line: SalesOrderLine) {
  const artwork = ARTWORKS.find((a) => a.artworkCode === lineArtworkCode(line))
  const material = MATERIALS.find((m) => m.materialType === line.materialType)
  if (!artwork || !material) return null

  const nesting = calculateNesting({
    openLengthMm: artwork.openLengthMm,
    openWidthMm: artwork.openWidthMm,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
  })
  if (nesting.upsPerSheet === 0) return null

  const costing = calculateCosting({
    targetPiecesQty: line.orderQtyPcs,
    upsPerSheet: nesting.upsPerSheet,
    utilisation: nesting.utilisation,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
    thicknessMicrons: line.thicknessMicrons,
    densityGCm3: material.densityGCm3,
    ratePerKg: material.ratePerKg,
    scrapRatePerKg: material.scrapRatePerKg,
    conversionRatePerPc: CONVERSION_PER_PC,
  })

  return { artwork, material, nesting, costing }
}

export default function SalesOrderPage() {
  const [tab, setTab] = React.useState('ALL')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(SALES_ORDERS[0].salesOrderId)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const rows = React.useMemo(
    () => (tab === 'ALL' ? SALES_ORDERS : SALES_ORDERS.filter((o) => o.status === tab)),
    [tab],
  )

  /* Keep the open record on a row the grid is actually showing: switching tabs
     used to leave it describing an order that had been filtered out. */
  const selected = rows.find((o) => o.salesOrderId === selectedId) ?? rows[0] ?? SALES_ORDERS[0]

  const priced = selected.lines.map((line) => ({ line, ...(costLine(line) ?? {}) }))
  const selectedCost = priced.reduce((sum, p) => sum + (p.costing?.totalCost ?? 0), 0)
  const selectedValue = orderValue(selected)

  const columns: Column<SalesOrder>[] = [
    {
      key: 'so',
      sortValue: (r) => r.soNumber,
      header: 'SO No.',
      render: (r) => <StackedCell top={r.soNumber} bottom={r.clientPoRef} mono />,
    },
    {
      key: 'customer',
      sortValue: (r) => r.customerName,
      header: 'Customer',
      render: (r) => <StackedCell top={r.customerName} bottom={formatDayMonth(r.soDate)} />,
    },
    {
      key: 'items',
      sortValue: (r) => r.lines.length,
      header: 'Items',
      render: (r) => {
        const only = r.lines.length === 1 ? r.lines[0] : null
        const ownProducts = r.lines.filter((l) => l.kind === 'PRODUCT').length
        return (
          <StackedCell
            top={only ? lineLabel(only) : `${r.lines.length} items`}
            bottom={
              only
                ? (only.kind === 'PRODUCT'
                    ? (PRODUCTS.find((p) => p.productCode === only.productCode)?.productName ?? 'Own product')
                    : (ARTWORKS.find((a) => a.artworkCode === only.artworkCode)?.clientProductRef ?? ''))
                : `${r.lines.map(lineLabel).join(', ')}${ownProducts > 0 ? ` · ${ownProducts} own` : ''}`
            }
          />
        )
      },
    },
    {
      key: 'qty',
      sortValue: (r) => orderQty(r),
      header: 'Order qty',
      align: 'right',
      render: (r) => <span className="font-mono">{formatNumber(orderQty(r))}</span>,
    },
    {
      key: 'value',
      sortValue: (r) => orderValue(r),
      header: 'Order value',
      align: 'right',
      render: (r) => <span className="font-mono">{formatCurrency(orderValue(r), 0)}</span>,
    },
    {
      key: 'delivery',
      sortValue: (r) => orderDeliveryDate(r),
      header: 'First delivery',
      render: (r) => <span className="font-mono">{formatDayMonth(orderDeliveryDate(r))}</span>,
    },
    {
      key: 'source',
      sortValue: (r) => r.source,
      header: 'Raised from',
      render: (r) =>
        r.estimationNo ? (
          <span className="font-mono">{r.estimationNo}</span>
        ) : (
          <span className="text-fg-subtle">Direct</span>
        ),
    },
    {
      key: 'status',
      sortValue: (r) => r.status,
      header: 'Status',
      render: (r) => <OrderStatusBadge status={r.status} />,
    },
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

      <DataTable
        title="Order queue"
        toolbar={<Tabs tabs={TABS} activeId={tab} onChange={setTab} />}
        rows={rows}
        columns={columns}
        rowKey={(r) => r.salesOrderId}
        searchText={(r) =>
          `${r.soNumber} ${r.customerName} ${r.clientPoRef} ${r.lines.map(lineLabel).join(' ')}`
        }
        searchPlaceholder="Search SO number, customer, artwork or PO reference"
        selectedKey={selected.salesOrderId}
        onSelect={(r) => setSelectedId(r.salesOrderId)}
        onOpen={(r) => {
          setSelectedId(r.salesOrderId)
          setDetailOpen(true)
        }}
        summary={{
          so: { type: 'custom', customFn: (r) => `${r.length} orders` },
          items: { type: 'custom', customFn: (r) => `${r.reduce((s, o) => s + o.lines.length, 0)} items` },
          qty: { type: 'custom', customFn: (r) => formatNumber(r.reduce((s, o) => s + orderQty(o), 0)) },
          value: { type: 'custom', customFn: (r) => formatCurrency(r.reduce((s, o) => s + orderValue(o), 0), 0) },
          source: {
            type: 'custom',
            customFn: (r) => `${r.filter((o) => o.source === 'ESTIMATION').length} from estimation`,
          },
        }}
      />

      <DetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected.soNumber}
        subtitle={`${selected.customerName} · ${selected.lines.length} item${selected.lines.length > 1 ? 's' : ''}`}
        size="master"
      >
        <SpecList
          rows={[
            { label: 'Client PO', value: selected.clientPoRef },
            { label: 'Order date', value: formatDayMonth(selected.soDate) },
            {
              label: 'Raised from',
              value: selected.estimationNo ?? 'Direct order',
              mono: Boolean(selected.estimationNo),
            },
            { label: 'Enquiry', value: selected.enquiryNo ?? 'None', mono: Boolean(selected.enquiryNo) },
            { label: 'First delivery', value: formatDayMonth(orderDeliveryDate(selected)) },
          ]}
        />

        {priced.map(({ line, artwork, nesting, costing }) => {
          const product = PRODUCTS.find((p) => p.productCode === line.productCode)
          const margin = costing ? ((line.ratePerPc - costing.costPerPiece) / line.ratePerPc) * 100 : null
          return (
            <React.Fragment key={line.lineId}>
              <Divider />
              <p className="label-caps mb-2">
                Item {line.lineNo} · {lineLabel(line)}
                {line.kind === 'PRODUCT'
                  ? ` · ${product?.productName ?? "the plant's own"}`
                  : artwork
                    ? ` · ${artwork.clientProductRef}`
                    : ''}
              </p>
              <SpecList
                rows={[
                  {
                    label: 'Ordered as',
                    value: line.kind === 'PRODUCT' ? "The plant's own product" : "The customer's design",
                    mono: false,
                  },
                  ...(product
                    ? [
                        { label: 'Product', value: product.productName, mono: false },
                        {
                          label: 'On the shelf',
                          value: product.isSafetyStock
                            ? `${formatNumber(product.currentStockQty)} of ${formatNumber(product.safetyStockQty)} held`
                            : 'Made to order',
                          mono: false,
                        },
                        { label: 'Standard cost', value: formatCurrency(product.standardCostPerPc) },
                      ]
                    : []),
                  { label: 'Material', value: `${line.materialType} · ${formatMicrons(line.thicknessMicrons)}`, mono: false },
                  ...(artwork
                    ? [
                        { label: 'Open layout (expanded)', value: `${artwork.openLengthMm} × ${artwork.openWidthMm} mm` },
                        { label: 'Formed depth', value: `${artwork.depthMm} mm` },
                      ]
                    : [{ label: 'Artwork', value: 'Not on file yet', mono: false }]),
                  { label: 'Quantity', value: formatNumber(line.orderQtyPcs), emphasis: true },
                  { label: 'Agreed rate', value: formatCurrency(line.ratePerPc) },
                  { label: 'Line value', value: formatCurrency(line.orderQtyPcs * line.ratePerPc, 0), emphasis: true },
                  { label: 'Delivery', value: formatDayMonth(line.deliveryDate) },
                  ...(nesting && costing
                    ? [
                        { label: 'Cavity ups per sheet', value: `${nesting.upsPerSheet} (${nesting.across} × ${nesting.down})` },
                        { label: 'Sheets required', value: formatNumber(costing.sheets) },
                        { label: 'Gross reel weight', value: formatKg(costing.grossWeightKg) },
                        {
                          label: 'Skeleton allowance',
                          value: `${formatPercent(nesting.skeletonFraction * 100)} · ${formatKg(costing.skeletonKg)}`,
                        },
                        { label: 'Landed cost per tray', value: formatCurrency(costing.costPerPiece) },
                        { label: 'Margin', value: margin !== null ? formatPercent(margin) : '—' },
                      ]
                    : []),
                ]}
              />
            </React.Fragment>
          )
        })}

        <Divider />
        <TotalRow label="Order value" value={formatCurrency(selectedValue, 0)} />
        <TotalRow label="Landed cost across all items" value={formatCurrency(selectedCost, 0)} />
        <TotalRow
          label="Margin on the order"
          value={selectedValue > 0 ? formatPercent(((selectedValue - selectedCost) / selectedValue) * 100) : '—'}
        />
      </DetailModal>

      <SalesOrderModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

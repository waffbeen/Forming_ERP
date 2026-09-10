'use client'

import { MasterPage } from '@/components/layout'
import { Column, StackedCell } from '@/components/ui'
import { ProductModal } from '@/components/modals'
import { CATEGORIES, PRODUCTS } from '@/data'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import type { Product } from '@/types/masters'

const columns: Column<Product>[] = [
  {
    key: 'code',
    header: 'Product',
    sortValue: (r) => r.productCode,
    render: (r) => <StackedCell top={r.productCode} bottom={r.productName} mono />,
  },
  { key: 'customer', header: 'Client', sortValue: (r) => r.customerName, render: (r) => r.customerName },
  { key: 'artwork', header: 'Artwork', sortValue: (r) => r.artworkCode, render: (r) => <span className="font-mono">{r.artworkCode}</span> },
  {
    key: 'category',
    header: 'Category',
    render: (r) => CATEGORIES.find((c) => c.categoryId === r.categoryId)?.categoryName ?? '—',
  },
  {
    key: 'spec',
    header: 'Specification',
    render: (r) => (
      <span className="font-mono">
        {r.materialType} {r.thicknessMicrons} µm · {r.cavityUpsPerSheet} ups
      </span>
    ),
  },
  {
    key: 'weight',
    header: 'Weight / pc',
    align: 'right',
    sortValue: (r) => r.weightPerPieceG,
    render: (r) => <span className="font-mono">{formatNumber(r.weightPerPieceG, 2)} g</span>,
  },
  {
    key: 'cost',
    header: 'Standard cost',
    align: 'right',
    sortValue: (r) => r.standardCostPerPc,
    render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.standardCostPerPc)}</span>,
  },
  {
    key: 'runs',
    header: 'Times produced',
    align: 'right',
    sortValue: (r) => r.timesProduced,
    render: (r) => (
      <span className="font-mono">
        {r.timesProduced}
        <span className="text-fg-muted"> · {formatNumber(r.totalPiecesProduced / 1000, 0)}k pcs</span>
      </span>
    ),
  },
  {
    key: 'stock',
    header: 'Safety stock',
    align: 'right',
    sortValue: (r) => r.currentStockQty,
    render: (r) =>
      r.isSafetyStock ? (
        <span
          className={
            r.currentStockQty < r.safetyStockQty ? 'font-mono font-semibold text-warning' : 'font-mono'
          }
        >
          {formatNumber(r.currentStockQty)}
          <span className="text-fg-muted"> / {formatNumber(r.safetyStockQty)}</span>
        </span>
      ) : (
        <span className="text-fg-subtle">Made to order</span>
      ),
  },
  { key: 'last', header: 'Last produced', sortValue: (r) => r.lastProducedOn, render: (r) => <span className="font-mono">{formatDate(r.lastProducedOn)}</span> },
  { key: 'origin', header: 'Created from', render: (r) => <span className="font-mono text-fg-muted">{r.originJobCardNo}</span> },
]

export default function ProductMasterPage() {
  const safetyStock = PRODUCTS.filter((p) => p.isSafetyStock)
  const belowSafety = safetyStock.filter((p) => p.currentStockQty < p.safetyStockQty)
  const repeats = PRODUCTS.filter((p) => p.timesProduced > 1)
  const totalPieces = PRODUCTS.reduce((s, p) => s + p.totalPiecesProduced, 0)

  return (
    <MasterPage
      title="Products"
      entityName="product"
      rows={PRODUCTS}
      columns={columns}
      rowKey={(r) => r.productId}
      createModal={(props) => <ProductModal {...props} />}
    />
  )
}

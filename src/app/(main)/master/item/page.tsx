'use client'

import { AlertTriangle, IndianRupee, PackageOpen, ScanBarcode } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { ItemModal } from '@/components/modals'
import { BINS, CATEGORIES, ITEMS, SUPPLIERS, stockOnHand } from '@/data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Item, ItemType } from '@/types/masters'

const TYPE_LABEL: Record<ItemType, string> = {
  RAW_MATERIAL: 'Raw material',
  CONSUMABLE: 'Consumable',
  PACKING: 'Packing',
  SPARE: 'Spare',
}

const TYPE_TONE = {
  RAW_MATERIAL: 'primary',
  CONSUMABLE: 'info',
  PACKING: 'success',
  SPARE: 'warning',
} as const

const columns: Column<Item>[] = [
  {
    key: 'code',
    header: 'Item',
    sortValue: (r) => r.itemCode,
    render: (r) => <StackedCell top={r.itemCode} bottom={r.itemName} mono />,
  },
  {
    key: 'type',
    header: 'Type',
    sortValue: (r) => r.itemType,
    render: (r) => <Badge tone={TYPE_TONE[r.itemType]}>{TYPE_LABEL[r.itemType]}</Badge>,
  },
  {
    key: 'category',
    header: 'Category',
    render: (r) => CATEGORIES.find((c) => c.categoryId === r.categoryId)?.categoryName ?? '—',
  },
  { key: 'uom', header: 'UOM', render: (r) => <span className="font-mono">{r.uom}</span> },
  {
    key: 'stock',
    header: 'In stock',
    align: 'right',
    sortValue: (r) => stockOnHand(r.itemId),
    render: (r) => (
      <span className={stockOnHand(r.itemId) < r.reorderLevel ? 'font-mono font-semibold text-error' : 'font-mono'}>
        {formatNumber(stockOnHand(r.itemId), r.uom === 'KG' || r.uom === 'LTR' ? 1 : 0)}
      </span>
    ),
  },
  {
    key: 'reorder',
    header: 'Reorder at',
    align: 'right',
    sortValue: (r) => r.reorderLevel,
    render: (r) => <span className="font-mono text-fg-muted">{formatNumber(r.reorderLevel)}</span>,
  },
  {
    key: 'rate',
    header: 'Rate',
    align: 'right',
    sortValue: (r) => r.ratePerUom,
    render: (r) => (
      <span className="font-mono">
        {formatCurrency(r.ratePerUom, r.ratePerUom < 10 ? 2 : 0)} <span className="text-fg-muted">/ {r.uom}</span>
      </span>
    ),
  },
  {
    key: 'supplier',
    header: 'Default supplier',
    render: (r) =>
      r.defaultSupplierId
        ? (SUPPLIERS.find((s) => s.supplierId === r.defaultSupplierId)?.supplierName ?? '—')
        : <span className="text-fg-subtle">Not set</span>,
  },
  {
    key: 'bin',
    header: 'Default bin',
    render: (r) =>
      r.defaultBinId ? <span className="font-mono">{BINS.find((b) => b.binId === r.defaultBinId)?.binCode ?? '—'}</span> : '—',
  },
  { key: 'hsn', header: 'HSN', render: (r) => <span className="font-mono">{r.hsnCode}</span> },
]

export default function ItemMasterPage() {
  const belowReorder = ITEMS.filter((i) => stockOnHand(i.itemId) < i.reorderLevel)
  const stockValue = ITEMS.reduce((s, i) => s + stockOnHand(i.itemId) * i.ratePerUom, 0)
  const rawMaterials = ITEMS.filter((i) => i.itemType === 'RAW_MATERIAL')

  return (
    <MasterPage
      title="Items"
      entityName="item"
      stats={[
        { label: 'Items on the master', value: String(ITEMS.length), note: `${rawMaterials.length} raw material codes`, icon: ScanBarcode },
        { label: 'Below reorder level', value: String(belowReorder.length), note: belowReorder.map((i) => i.itemCode).slice(0, 2).join(', ') || 'None', noteTone: belowReorder.length ? 'bad' : 'good', icon: AlertTriangle },
        { label: 'Stock value', value: formatNumber(stockValue / 100000, 2), unit: 'lakh', note: 'At current purchase rates', icon: IndianRupee },
        { label: 'Packing and spares', value: String(ITEMS.filter((i) => i.itemType === 'PACKING' || i.itemType === 'SPARE').length), note: 'Held against consumption', icon: PackageOpen },
      ]}
      rows={ITEMS}
      columns={columns}
      rowKey={(r) => r.itemId}
      createModal={(props) => <ItemModal {...props} />}
    />
  )
}

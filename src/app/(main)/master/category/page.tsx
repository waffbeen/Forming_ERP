'use client'

import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { CategoryModal } from '@/components/modals'
import { CATEGORIES, ITEMS, PRODUCTS } from '@/data'
import type { Category, CategoryAppliesTo } from '@/types/masters'

const APPLIES_LABEL: Record<CategoryAppliesTo, string> = {
  ITEM: 'Items',
  PRODUCT: 'Products',
  BOTH: 'Items & products',
}

const APPLIES_TONE = { ITEM: 'info', PRODUCT: 'primary', BOTH: 'success' } as const

const parentName = (id: string | null) =>
  id ? (CATEGORIES.find((c) => c.categoryId === id)?.categoryName ?? '—') : null

const columns: Column<Category>[] = [
  { key: 'code', header: 'Code', sortValue: (r) => r.categoryCode, render: (r) => <span className="font-mono">{r.categoryCode}</span> },
  {
    key: 'name',
    header: 'Category',
    sortValue: (r) => r.categoryName,
    render: (r) => {
      const parent = parentName(r.parentCategoryId)
      return (
        <span className="flex items-center gap-1.5">
          {parent ? <span className="text-fg-subtle">└</span> : null}
          <StackedCell top={r.categoryName} bottom={parent ? `under ${parent}` : undefined} />
        </span>
      )
    },
  },
  {
    key: 'applies',
    header: 'Applies to',
    sortValue: (r) => r.appliesTo,
    render: (r) => <Badge tone={APPLIES_TONE[r.appliesTo]}>{APPLIES_LABEL[r.appliesTo]}</Badge>,
  },
  {
    key: 'used',
    header: 'In use',
    align: 'right',
    render: (r) => {
      const items = ITEMS.filter((i) => i.categoryId === r.categoryId).length
      const products = PRODUCTS.filter((p) => p.categoryId === r.categoryId).length
      const total = items + products
      return total > 0 ? (
        <span className="font-mono">{total}</span>
      ) : (
        <span className="text-fg-subtle">unused</span>
      )
    },
  },
  { key: 'desc', header: 'Description', render: (r) => r.description },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => r.status,
    render: (r) => (r.status === 'ACTIVE' ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>),
  },
]

export default function CategoryMasterPage() {
  const topLevel = CATEGORIES.filter((c) => !c.parentCategoryId)
  const itemCats = CATEGORIES.filter((c) => c.appliesTo !== 'PRODUCT')
  const productCats = CATEGORIES.filter((c) => c.appliesTo !== 'ITEM')

  return (
    <MasterPage
      title="Categories"
      entityName="category"
      rows={CATEGORIES}
      columns={columns}
      rowKey={(r) => r.categoryId}
      createModal={(props) => <CategoryModal {...props} />}
    />
  )
}

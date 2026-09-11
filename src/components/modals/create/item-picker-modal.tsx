'use client'

import * as React from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import { Badge, Button, Input } from '@/components/ui'
import { CATEGORIES, ITEMS, SUPPLIERS, stockOnHand } from '@/data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Item } from '@/types/masters'

/* Choosing what to buy.

   A dropdown makes you choose one thing at a time and shows you a name while
   you do it. A buyer raising an order picks several items at once and needs to
   see what they are picking — the gauge, the deckle, the colour, what is on the
   shelf, what the supplier's minimum is. So this is the item master itself,
   opened over the document, with a tick against each row that is wanted.

   Thomson does the same thing and for the same reason: its order screen has an
   Add Item button that opens the master and adds every row that was ticked. */

const TYPE_LABEL: Record<Item['itemType'], string> = {
  RAW_MATERIAL: 'Reel',
  PACKING: 'Packing',
  CONSUMABLE: 'Consumable',
  SPARE: 'Spare',
}

/** The specification a buyer recognises the item by. */
function specificationOf(item: Item) {
  if (!item.materialType) {
    return item.conversionToStock > 1
      ? `Bought in ${item.purchaseUom} of ${formatNumber(item.conversionToStock)} ${item.uom}`
      : `Bought and stocked in ${item.uom}`
  }
  const parts: string[] = [item.materialType]
  if (item.thicknessMicrons) parts.push(`${item.thicknessMicrons} µm`)
  if (item.deckleWidthMm) parts.push(`${item.deckleWidthMm} mm deckle`)
  if (item.colour) parts.push(item.colour)
  if (item.standardRollWeightKg) parts.push(`${item.standardRollWeightKg} kg roll`)
  return parts.join(' · ')
}

export interface ItemPickerModalProps {
  isOpen: boolean
  onClose: () => void
  /** Hands back everything that was ticked, in the order the list shows them. */
  onAdd: (itemIds: string[]) => void
  /** Already on the document: shown, but cannot be picked twice. */
  alreadyChosen?: string[]
  /** Narrows the list to what one supplier is approved for. */
  supplierId?: string
  title?: string
}

export function ItemPickerModal({
  isOpen,
  onClose,
  onAdd,
  alreadyChosen = [],
  supplierId,
  title = 'Add items',
}: ItemPickerModalProps) {
  const [query, setQuery] = React.useState('')
  const [picked, setPicked] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setPicked([])
  }, [isOpen])

  const supplier = SUPPLIERS.find((s) => s.supplierId === supplierId)

  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return ITEMS.filter((item) => item.status === 'ACTIVE').filter((item) => {
      if (!needle) return true
      return [item.itemCode, item.itemName, specificationOf(item)]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [query])

  const toggle = (itemId: string) =>
    setPicked((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    )

  const handleAdd = () => {
    if (picked.length === 0) return
    onAdd(picked)
    onClose()
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Tick everything the document needs. They go on as one row each."
      size="master"
      onSave={handleAdd}
      saveDisabled={picked.length === 0}
      saveLabel={
        picked.length === 0
          ? 'Add items'
          : `Add ${picked.length} ${picked.length === 1 ? 'item' : 'items'}`
      }
      saveIcon={Plus}
      footerNote={
        supplier
          ? `${supplier.supplierName} supplies ${supplier.materialsSupplied.join(', ') || 'anything ordered'}`
          : `${rows.length} of ${ITEMS.length} items`
      }
    >
      <div className="mb-3">
        <Input
          leftIcon={Search}
          placeholder="Search by code, name, polymer, gauge or deckle"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search items"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-bd-default">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-bd-default bg-bg-subtle">
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2 text-left label-caps">Item</th>
              <th className="px-3 py-2 text-left label-caps">Specification</th>
              <th className="px-3 py-2 text-left label-caps">Bought in</th>
              <th className="px-3 py-2 text-right label-caps">Min order</th>
              <th className="px-3 py-2 text-right label-caps">Rate</th>
              <th className="px-3 py-2 text-right label-caps">On hand</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const already = alreadyChosen.includes(item.itemId)
              const chosen = picked.includes(item.itemId)
              const onHand = stockOnHand(item.itemId)
              const wrongPolymer = Boolean(
                supplier &&
                  supplier.materialsSupplied.length > 0 &&
                  item.materialType &&
                  !supplier.materialsSupplied.includes(item.materialType),
              )
              return (
                <tr
                  key={item.itemId}
                  onClick={() => !already && toggle(item.itemId)}
                  className={cn(
                    'border-b border-bd-subtle last:border-0',
                    already
                      ? 'cursor-not-allowed opacity-45'
                      : 'cursor-pointer hover:bg-bg-hover',
                    chosen && 'bg-primary-subtle',
                  )}
                >
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'grid h-4 w-4 place-items-center rounded border',
                        chosen
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-bd-strong bg-bg-surface',
                      )}
                    >
                      {chosen ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="block font-mono text-xs font-semibold">{item.itemCode}</span>
                    <span className="block text-xs text-fg-muted">{item.itemName}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-2xs">{specificationOf(item)}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={item.itemType === 'RAW_MATERIAL' ? 'primary' : 'muted'}>
                        {TYPE_LABEL[item.itemType]}
                      </Badge>
                      {item.isFoodGrade ? <Badge tone="success">Food grade</Badge> : null}
                      {already ? <Badge tone="muted">Already on the document</Badge> : null}
                      {wrongPolymer ? <Badge tone="error">Supplier not approved</Badge> : null}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {item.purchaseUom}
                    {item.conversionToStock > 1 ? (
                      <span className="block text-2xs text-fg-muted">
                        1 = {formatNumber(item.conversionToStock)} {item.uom}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {item.minOrderQtyKg ? `${formatNumber(item.minOrderQtyKg)} ${item.uom}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {formatCurrency(item.ratePerUom, 2)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    <span className={onHand < item.reorderLevel ? 'text-warning' : undefined}>
                      {formatNumber(onHand, 1)} {item.uom}
                    </span>
                    {onHand < item.reorderLevel ? (
                      <span className="block text-2xs text-warning">below reorder</span>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-fg-muted">
                  Nothing matches “{query}”. The category it belongs to may be inactive.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-fg-muted">
        {picked.length === 0
          ? 'Tick a row to put it on the document.'
          : `${picked.length} ticked · ${picked
              .map((id) => ITEMS.find((i) => i.itemId === id)?.itemCode)
              .filter(Boolean)
              .join(', ')}`}
      </p>
    </StandardModal>
  )
}

/** The category an item sits in, for screens that show it beside the code. */
export function categoryNameOf(item: Item) {
  return CATEGORIES.find((c) => c.categoryId === item.categoryId)?.categoryName ?? '—'
}

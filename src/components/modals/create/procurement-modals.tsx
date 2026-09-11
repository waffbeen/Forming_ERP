'use client'

import * as React from 'react'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import {
  Button, Checkbox, DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate,
} from '@/components/ui'
import {
  BINS, ITEMS, JOB_CARDS, PURCHASE_ORDERS, PURCHASE_REQUISITIONS, SUPPLIERS, WAREHOUSES,
  onOrderQty, stockOnHand,
} from '@/data'
import { PLANT } from '@/config/plant'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ItemPickerModal } from './item-picker-modal'
import { SupplierModal } from './business-modals'
import { previewNumber } from '@/lib/document-number'
import { GRNS } from '@/data'
import { INWARD_CHECKS } from '@/types/procurement'
import type { Item } from '@/types/masters'
import type { MasterModalProps } from './master-modals'

/**
 * Masters have no API yet, so saving closes cleanly. When the modal was opened
 * from a dropdown's add button, the new record is handed back so that field can
 * select it immediately.
 */
function useMockSave(
  onClose: () => void,
  onCreated?: (option: { value: string; label: string }) => void,
  makeOption?: () => { value: string; label: string } | null,
) {
  const [saving, setSaving] = React.useState(false)
  const save = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      const option = makeOption?.()
      if (onCreated && option) onCreated(option)
      onClose()
    }, 500)
  }
  return { saving, save }
}

// ------------------------------------------------------------- Document lines

/** A line on a requisition or an order, before it has been saved. */
interface DraftLine {
  /** Local only: the rows are reordered and removed, so they need identity. */
  key: string
  itemId: string
  quantity: string
  /** Purchase orders only. */
  rate?: string
  /** Purchase orders only: Thomson prices a line net of its own discount. */
  discountPct?: string
  /**
   * When this line is wanted. It belongs to the line, not the order: a buyer
   * asks for the reel this week and the cartons next month on one document.
   */
  deliveryDate?: string
  /** Requisitions only. */
  requiredBy?: string
  jobCardNo?: string
  remarks?: string
}

/* One template per document, so the header and every row line up. */
const LINE_GRID = 'grid items-center gap-2'
const PR_TEMPLATE = {
  gridTemplateColumns: '24px minmax(190px,1.3fr) minmax(110px,0.7fr) 140px minmax(150px,1fr) minmax(160px,1.1fr) 28px',
}
const PO_TEMPLATE = {
  gridTemplateColumns:
    '24px minmax(210px,1.3fr) 104px minmax(104px,0.6fr) 92px 68px 104px 128px minmax(130px,0.9fr) 28px',
}

/** One reel off the vehicle, before the receipt is booked. */
interface DraftBatch {
  key: string
  batchNo: number
  reelId: string
  weight: string
  microns: string
  binId: string
}

let batchSeq = 0
const newBatch = (batchNo: number): DraftBatch => ({
  key: `B${++batchSeq}`,
  batchNo,
  reelId: '',
  weight: '',
  microns: '',
  binId: '',
})

const BATCH_TEMPLATE = {
  gridTemplateColumns: '32px minmax(150px,1fr) 110px 96px minmax(190px,1.1fr) 28px',
}

/**
 * What was chosen, on the row. The item is not asked for again here: it was
 * picked off the master with its specification in front of the buyer, so the
 * row states it rather than offering it.
 */
function LineItemCell({ item }: { item: Item | undefined }) {
  if (!item) return <span className="text-xs text-fg-subtle">—</span>
  return (
    <span className="block min-w-0">
      <span className="block truncate font-mono text-xs font-semibold">{item.itemCode}</span>
      <span className="block truncate text-2xs text-fg-muted">{item.itemName}</span>
    </span>
  )
}

let lineSeq = 0
const newLine = (): DraftLine => ({ key: `L${++lineSeq}`, itemId: '', quantity: '' })

/**
 * One document, many items. A supplier is not sent a separate order per item
 * and a department does not raise a separate requisition per item, so both
 * screens are a header and a grid of lines — the way the paper order they
 * replace is laid out, and the way the tables underneath already were.
 */
function useDraftLines() {
  const [lines, setLines] = React.useState<DraftLine[]>([])

  /** Everything ticked in the picker goes on as one row each. */
  const addItems = (itemIds: string[], open?: (item: Item) => Partial<DraftLine>) =>
    setLines((rows) => [
      ...rows,
      ...itemIds
        .filter((id) => !rows.some((r) => r.itemId === id))
        .map((id) => {
          const item = ITEMS.find((i) => i.itemId === id)
          return { ...newLine(), itemId: id, ...(item && open ? open(item) : {}) }
        }),
    ])

  const remove = (key: string) => setLines((rows) => rows.filter((r) => r.key !== key))
  const patch = (key: string, values: Partial<DraftLine>) =>
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...values } : r)))
  const reset = () => setLines([])

  /** The same item twice on one document is a keying slip, never an intent. */
  const duplicates = lines
    .map((r) => r.itemId)
    .filter((id, i, all) => id && all.indexOf(id) !== i)

  return { lines, addItems, remove, patch, reset, duplicates }
}

// ------------------------------------------------------- Purchase requisition

export function RequisitionModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [department, setDepartment] = React.useState('')
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const { lines, addItems, remove, patch, reset, duplicates } = useDraftLines()

  React.useEffect(() => {
    if (isOpen) reset()
    // reset is stable for the life of one open screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  /** What each line comes to, and what is wrong with it. */
  const rows = lines.map((line) => {
    const item = ITEMS.find((i) => i.itemId === line.itemId)
    const qty = Number(line.quantity) || 0
    const onHand = item ? stockOnHand(item.itemId) : 0
    const onOrder = item ? onOrderQty(item.itemId) : 0
    /* Free stock plus what is already on order tells the planner whether the
       line is needed at all, or whether an open order already covers it. */
    const covered = item ? onHand + onOrder >= item.reorderLevel : false
    return { line, item, qty, onHand, onOrder, covered, value: qty * (item?.ratePerUom ?? 0) }
  })

  const filled = rows.filter((r) => r.item)
  const total = filled.reduce((sum, r) => sum + r.value, 0)
  const incomplete = rows.some((r) => !r.item || r.qty <= 0 || !r.line.requiredBy)

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Purchase Requisition"
      subtitle={filled.length > 1 ? `${filled.length} items on one requisition` : undefined}
      size="master"
      onSave={save}
      saving={saving}
      saveDisabled={!department || incomplete || duplicates.length > 0}
      saveLabel="Submit for approval"
      footerNote={
        duplicates.length > 0
          ? 'The same item is on two lines'
          : total > 0
            ? `${filled.length} ${filled.length === 1 ? 'line' : 'lines'} · about ${formatCurrency(total, 0)} at standard rates`
            : 'Add what the department needs'
      }
    >
      <FormSection title="Requisition">
        <FormGrid cols={2}>
          <Select
            label="Department"
            required
            placeholder="Select department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { value: 'Planning', label: 'Planning' },
              { value: 'Production', label: 'Production' },
              { value: 'Stores', label: 'Stores' },
              { value: 'Quality', label: 'Quality' },
              { value: 'Dispatch', label: 'Dispatch' },
            ]}
          />
          <DerivedField
            label="PR number"
            value={previewNumber(
              'PURCHASE_REQUISITION',
              PURCHASE_REQUISITIONS.map((r) => r.prNumber),
            )}
            emphasis
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Items"
        description="One requisition can ask for as many items as the department needs."
      >
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className={`${LINE_GRID} border-b border-bd-subtle px-2 pb-1.5`} style={PR_TEMPLATE}>
              <span className="label-caps">#</span>
              <span className="label-caps">Item</span>
              <span className="label-caps text-right">Quantity</span>
              <span className="label-caps">Required by</span>
              <span className="label-caps">Against job card</span>
              <span className="label-caps">Justification</span>
              <span />
            </div>

            <ul>
              {rows.map(({ line, item, qty, onHand, onOrder, covered }, index) => {
                const note = !item
                  ? null
                  : covered && qty > 0
                    ? 'Stock plus what is on order already covers the reorder level'
                    : `${formatNumber(onHand, 1)} ${item.uom} on hand · ${formatNumber(onOrder)} on order`
                return (
                  <li
                    key={line.key}
                    className="border-b border-bd-subtle last:border-0 hover:bg-bg-hover/60"
                  >
                    <div className={`${LINE_GRID} px-2 py-1.5`} style={PR_TEMPLATE}>
                      <span className="font-mono text-xs text-fg-subtle">{index + 1}</span>
                      <LineItemCell item={item} />
                      <span className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          step="0.1"
                          className="text-right"
                          value={line.quantity}
                          onChange={(e) => patch(line.key, { quantity: e.target.value })}
                        />
                        <span className="w-8 shrink-0 font-mono text-2xs text-fg-muted">
                          {item?.uom ?? ''}
                        </span>
                      </span>
                      <Input
                        type="date"
                        value={line.requiredBy ?? ''}
                        onChange={(e) => patch(line.key, { requiredBy: e.target.value })}
                      />
                      <Select
                        placeholder="Stock replenishment"
                        value={line.jobCardNo ?? ''}
                        onChange={(e) => patch(line.key, { jobCardNo: e.target.value })}
                        options={JOB_CARDS.map((j) => ({
                          value: j.jobCardNo,
                          label: `${j.jobCardNo} — ${j.customerName}`,
                        }))}
                      />
                      <Input
                        value={line.remarks ?? ''}
                        onChange={(e) => patch(line.key, { remarks: e.target.value })}
                        placeholder="Why this is needed"
                      />
                      <button
                        type="button"
                        aria-label={`Remove line ${index + 1}`}
                        disabled={lines.length === 1}
                        onClick={() => remove(line.key)}
                        className="grid h-7 w-7 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-error-subtle hover:text-error disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-fg-subtle"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {line.itemId && duplicates.includes(line.itemId) ? (
                      <p className="px-2 pb-1.5 pl-10 text-2xs text-error">
                        This item is already on another line
                      </p>
                    ) : note ? (
                      <p className="px-2 pb-1.5 pl-10 text-2xs text-fg-subtle">{note}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {lines.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-fg-muted">
            Nothing on the requisition yet. Add what the department needs from the item master.
          </p>
        ) : null}

        <div className="mt-2.5">
          <Button variant="primary" icon={Plus} onClick={() => setPickerOpen(true)}>
            {lines.length === 0 ? 'Add items' : 'Add more items'}
          </Button>
        </div>
      </FormSection>

      <ItemPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        alreadyChosen={lines.map((l) => l.itemId).filter(Boolean)}
        title="Add items to the requisition"
        onAdd={(itemIds) =>
          addItems(itemIds, (item) => ({
            /* The line opens at what it would take to get back to the reorder
               level, which is the reason the department is asking. */
            quantity: String(
              Math.max(item.reorderLevel - stockOnHand(item.itemId) - onOrderQty(item.itemId), 0) ||
                '',
            ),
          }))
        }
      />
    </StandardModal>
  )
}

// ------------------------------------------------------------- Purchase order

export function PurchaseOrderModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [supplierId, setSupplierId] = React.useState('')
  const [prNumber, setPrNumber] = React.useState('')
  const [gst, setGst] = React.useState('18')
  const [expected, setExpected] = React.useState('')
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const { lines, addItems, remove, patch, reset, duplicates } = useDraftLines()

  React.useEffect(() => {
    if (isOpen) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const supplier = SUPPLIERS.find((s) => s.supplierId === supplierId)

  /**
   * Each line, priced. The reel specification is not asked for again: it is
   * what the item is, so the order carries the item's own gauge and deckle and
   * the supplier is being asked for exactly that.
   */
  const rows = lines.map((line) => {
    const item = ITEMS.find((i) => i.itemId === line.itemId)
    const qty = Number(line.quantity) || 0
    const rate = Number(line.rate) || 0
    const isReel = item?.itemType === 'RAW_MATERIAL'

    /* A supplier may only be ordered from for the polymers they are approved
       for, and that is a per-line question once one order carries many items. */
    const polymerMismatch = Boolean(
      isReel &&
        supplier &&
        supplier.materialsSupplied.length > 0 &&
        item?.materialType &&
        !supplier.materialsSupplied.includes(item.materialType),
    )

    const belowMoq = Boolean(item?.minOrderQtyKg && qty > 0 && qty < item.minOrderQtyKg)

    /* Priced net of the line's own discount, the way Thomson's grid prices it. */
    const discountPct = Math.min(Math.max(Number(line.discountPct) || 0, 0), 100)
    const gross = qty * rate
    const value = gross * (1 - discountPct / 100)

    /* Bought in one unit, kept in another: an order for 10 boxes of tape is 720
       pieces to the store, and the line says both. */
    const stockQty = item ? qty * item.conversionToStock : 0
    const converted = Boolean(item && item.conversionToStock > 1)

    return {
      line,
      item,
      qty,
      rate,
      isReel,
      polymerMismatch,
      belowMoq,
      discountPct,
      stockQty,
      converted,
      value,
    }
  })

  const filled = rows.filter((r) => r.item)
  const net = rows.reduce((sum, r) => sum + r.value, 0)
  const total = net * (1 + (Number(gst) || 0) / 100)
  const incomplete = rows.some((r) => !r.item || r.qty <= 0)
  const blocked = rows.some((r) => r.polymerMismatch)

  const approved = PURCHASE_REQUISITIONS.filter(
    (p) => p.prStatus === 'APPROVED' || p.prStatus === 'SUBMITTED',
  )

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Purchase Order"
      subtitle={filled.length > 1 ? `${filled.length} items on one order` : undefined}
      badge={
        supplier
          ? {
              label: `${supplier.qualityRatingPct.toFixed(1)} % IQC first pass`,
              tone: supplier.qualityRatingPct >= 95 ? 'success' : 'warning',
            }
          : undefined
      }
      size="master"
      onSave={save}
      saving={saving}
      saveDisabled={!supplierId || !expected || incomplete || blocked || duplicates.length > 0}
      saveLabel="Raise purchase order"
      footerNote={
        blocked
          ? `${supplier?.supplierName ?? 'This supplier'} is not approved for every polymer on the order`
          : duplicates.length > 0
            ? 'The same item is on two lines'
            : total > 0
              ? `${filled.length} ${filled.length === 1 ? 'line' : 'lines'} · ${formatCurrency(total, 0)} including GST`
              : 'Add what is being ordered'
      }
    >
      <FormSection title="Order">
        <FormGrid cols={2}>
          <SelectWithCreate
            label="Supplier"
            required
            placeholder="Select or add a supplier"
            value={supplierId}
            onChange={setSupplierId}
            options={SUPPLIERS.filter((s) => s.status === 'ACTIVE').map((s) => ({
              value: s.supplierId,
              label: `${s.supplierName} — ${s.leadTimeDays} day lead`,
            }))}
            createLabel="New supplier"
            renderCreateModal={(props) => <SupplierModal {...props} />}
          />
          <Select
            label="Against requisition"
            placeholder="None, direct order"
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            options={approved.map((p) => ({ value: p.prNumber, label: `${p.prNumber} — ${p.department}` }))}
          />
          <DerivedField
            label="PO number"
            value={previewNumber('PURCHASE_ORDER', PURCHASE_ORDERS.map((o) => o.poNumber))}
            emphasis
          />
          <Input
            label="Expected delivery"
            required
            type="date"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            helper={
              supplier
                ? `${supplier.leadTimeDays} day lead time · lines can be wanted earlier`
                : 'Lines can each be wanted on their own date'
            }
          />
          <Select
            label="GST"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            options={[
              { value: '5', label: '5 %' },
              { value: '12', label: '12 %' },
              { value: '18', label: '18 %' },
            ]}
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Items"
        description="One order, as many items as the supplier is being sent. Each line opens at what the item master says it is bought at."
      >
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div className={`${LINE_GRID} border-b border-bd-subtle px-2 pb-1.5`} style={PO_TEMPLATE}>
              <span className="label-caps">#</span>
              <span className="label-caps">Item</span>
              <span className="label-caps">Ordered as</span>
              <span className="label-caps text-right">Quantity</span>
              <span className="label-caps text-right">Rate</span>
              <span className="label-caps text-right">Disc %</span>
              <span className="label-caps text-right">Value</span>
              <span className="label-caps">Wanted by</span>
              <span className="label-caps">Line remark</span>
              <span />
            </div>

            <ul>
              {rows.map(
                (
                  {
                    line,
                    item,
                    qty,
                    isReel,
                    polymerMismatch,
                    belowMoq,
                    stockQty,
                    converted,
                    value,
                  },
                  index,
                ) => {
                  const problem = polymerMismatch
                    ? `${supplier?.supplierName} is not approved for ${item?.materialType}`
                    : line.itemId && duplicates.includes(line.itemId)
                      ? 'This item is already on another line'
                      : belowMoq
                        ? `Under the supplier's minimum of ${formatNumber(item?.minOrderQtyKg ?? 0)} ${item?.uom}`
                        : null
                  return (
                    <li
                      key={line.key}
                      className={
                        polymerMismatch
                          ? 'border-b border-bd-subtle bg-error-subtle last:border-0'
                          : 'border-b border-bd-subtle last:border-0 hover:bg-bg-hover/60'
                      }
                    >
                      <div className={`${LINE_GRID} px-2 py-1.5`} style={PO_TEMPLATE}>
                        <span className="font-mono text-xs text-fg-subtle">{index + 1}</span>
                        <LineItemCell item={item} />
                        <span className="min-w-0 font-mono text-2xs text-fg-muted">
                          {isReel && item?.thicknessMicrons ? (
                            <>
                              {item.thicknessMicrons} µm · {item.deckleWidthMm ?? '—'} mm
                              {item.colour ? <span className="block">{item.colour}</span> : null}
                            </>
                          ) : item ? (
                            <>
                              {item.purchaseUom}
                              {item.conversionToStock > 1 ? (
                                <span className="block">
                                  1 = {formatNumber(item.conversionToStock)} {item.uom}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            '—'
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            step="0.1"
                            className="text-right"
                            value={line.quantity}
                            onChange={(e) => patch(line.key, { quantity: e.target.value })}
                          />
                          <span className="w-8 shrink-0 font-mono text-2xs text-fg-muted">
                            {item?.uom ?? ''}
                          </span>
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className="text-right"
                          value={line.rate ?? ''}
                          onChange={(e) => patch(line.key, { rate: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="0.5"
                          className="text-right"
                          value={line.discountPct ?? ''}
                          placeholder="0"
                          onChange={(e) => patch(line.key, { discountPct: e.target.value })}
                        />
                        <span className="text-right font-mono text-xs font-medium">
                          {value > 0 ? formatCurrency(value, 0) : '—'}
                        </span>
                        <Input
                          type="date"
                          value={line.deliveryDate ?? ''}
                          onChange={(e) => patch(line.key, { deliveryDate: e.target.value })}
                        />
                        <Input
                          value={line.remarks ?? ''}
                          placeholder="Optional"
                          onChange={(e) => patch(line.key, { remarks: e.target.value })}
                        />
                        <button
                          type="button"
                          aria-label={`Remove line ${index + 1}`}
                          disabled={lines.length === 1}
                          onClick={() => remove(line.key)}
                          className="grid h-7 w-7 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-error-subtle hover:text-error disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-fg-subtle"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {problem ? (
                        <p
                          className={
                            belowMoq && !polymerMismatch
                              ? 'px-2 pb-1.5 pl-10 text-2xs text-warning'
                              : 'px-2 pb-1.5 pl-10 text-2xs text-error'
                          }
                        >
                          {problem}
                        </p>
                      ) : converted || (isReel && item?.isFoodGrade) ? (
                        <p className="px-2 pb-1.5 pl-10 text-2xs text-fg-subtle">
                          {converted
                            ? `${formatNumber(qty)} ${item?.purchaseUom} is ${formatNumber(stockQty)} ${item?.uom} into stock`
                            : 'Food contact grade · incoming QC will ask for a migration certificate'}
                        </p>
                      ) : null}
                    </li>
                  )
                },
              )}
            </ul>
          </div>
        </div>

        {lines.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-fg-muted">
            Nothing on the order yet. Add what the supplier is being sent from the item master.
          </p>
        ) : null}

        <div className="mt-2.5">
          <Button variant="primary" icon={Plus} onClick={() => setPickerOpen(true)}>
            {lines.length === 0 ? 'Add items' : 'Add more items'}
          </Button>
        </div>
      </FormSection>

      <ItemPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        alreadyChosen={lines.map((l) => l.itemId).filter(Boolean)}
        supplierId={supplierId}
        title="Add items to the order"
        onAdd={(itemIds) =>
          /* Each line opens on what the item master says it is bought at. */
          addItems(itemIds, (item) => ({
            rate: String(item.ratePerUom),
            quantity: item.minOrderQtyKg ? String(item.minOrderQtyKg) : '',
            deliveryDate: expected,
          }))
        }
      />

      <FormSection title="Order value">
        <FormGrid cols={3}>
          <DerivedField label="Net" value={net > 0 ? formatCurrency(net, 0) : '—'} />
          <DerivedField label={`GST at ${gst} %`} value={net > 0 ? formatCurrency(total - net, 0) : '—'} />
          <DerivedField label="Total" value={total > 0 ? formatCurrency(total, 0) : '—'} emphasis />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// --------------------------------------------------------- Goods receipt note

export function GrnModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [poNumber, setPoNumber] = React.useState('')
  const [challan, setChallan] = React.useState('')
  const [invoice, setInvoice] = React.useState('')
  const [deliveryNote, setDeliveryNote] = React.useState('')
  const [deliveryNoteDate, setDeliveryNoteDate] = React.useState('')
  const [eWayBill, setEWayBill] = React.useState('')
  const [eWayBillDate, setEWayBillDate] = React.useState('')
  const [cocNo, setCocNo] = React.useState('')
  const [vehicleNo, setVehicleNo] = React.useState('')
  const [transporter, setTransporter] = React.useState('')
  const [warehouseId, setWarehouseId] = React.useState('')
  const [freight, setFreight] = React.useState('')
  const [otherCharges, setOtherCharges] = React.useState('')
  /* A check is OK, a finding, or not looked at yet — three states, so the
     value is allowed to be missing rather than defaulting to a pass. */
  const [checks, setChecks] = React.useState<Record<string, boolean | undefined>>({})

  /** How the consignment was split when it came off the vehicle. */
  const [reelCount, setReelCount] = React.useState('1')
  const [batches, setBatches] = React.useState<DraftBatch[]>([newBatch(1)])

  React.useEffect(() => {
    if (!isOpen) return
    setPoNumber('')
    setChallan('')
    setInvoice('')
    setDeliveryNote('')
    setDeliveryNoteDate('')
    setEWayBill('')
    setEWayBillDate('')
    setCocNo('')
    setVehicleNo('')
    setTransporter('')
    setWarehouseId('')
    setFreight('')
    setOtherCharges('')
    setChecks({})
    setReelCount('1')
    setBatches([newBatch(1)])
  }, [isOpen])

  const po = PURCHASE_ORDERS.find((p) => p.poNumber === poNumber)
  const line = po?.lines[0]
  const item = ITEMS.find((i) => i.itemId === line?.itemId)
  const supplier = SUPPLIERS.find((s) => s.supplierId === po?.supplierId)
  const pending = line ? line.orderedQty - line.receivedQty : 0
  const isReel = item?.itemType === 'RAW_MATERIAL'

  /**
   * The consignment arrives as reels and each one is booked on its own. Saying
   * how many came and what one weighs lays out that many rows rather than
   * making the store keep a tally on paper beside the screen.
   */
  const layOutReels = (count: number, weightEach: number) => {
    const wanted = Math.min(Math.max(count, 1), 40)
    setBatches((current) =>
      Array.from({ length: wanted }, (_, i) => ({
        ...(current[i] ?? newBatch(i + 1)),
        batchNo: i + 1,
        weight:
          current[i]?.weight && !weightEach ? current[i].weight : weightEach ? String(weightEach) : '',
      })),
    )
  }

  const patchBatch = (key: string, values: Partial<DraftBatch>) =>
    setBatches((rows) => rows.map((r) => (r.key === key ? { ...r, ...values } : r)))

  const received = batches.reduce((sum, b) => sum + (Number(b.weight) || 0), 0)
  const overReceipt = line ? received > pending : false

  const failedChecks = INWARD_CHECKS.filter((c) => checks[c] === false)
  const checkedCount = INWARD_CHECKS.filter((c) => checks[c] !== undefined).length

  const goodsValue = line ? received * line.ratePerUom : 0
  const total = goodsValue + (Number(freight) || 0) + (Number(otherCharges) || 0)

  const canSave = Boolean(
    poNumber && challan && received > 0 && !overReceipt && batches.every((b) => b.weight),
  )

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Goods Receipt"
      subtitle={
        batches.length > 1
          ? `${batches.length} ${isReel ? 'reels' : 'batches'} on this consignment`
          : undefined
      }
      badge={{ label: 'Pending inspection', tone: 'muted' }}
      size="master"
      onSave={save}
      saving={saving}
      saveDisabled={!canSave}
      saveLabel="Book receipt"
      footerNote={
        overReceipt
          ? `Only ${formatNumber(pending)} ${item?.uom ?? ''} pending on this order`
          : received > 0
            ? `${formatNumber(received, 1)} ${item?.uom ?? ''} booked in as ${batches.length} ${
                batches.length === 1 ? 'batch' : 'batches'
              } · none of it stock until QC passes it`
            : 'Book what came off the vehicle'
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-bd-strong bg-bg-subtle p-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
        <div>
          <h5 className="text-sm font-semibold">Booked, not yet in stock</h5>
          <p className="mt-0.5 max-w-[74ch] text-xs text-fg-muted">
            The receipt records what physically arrived, reel by reel. Each one is a batch, and
            incoming QC inspects and signs off each batch on its own — nothing reaches a bin until it
            does.
          </p>
        </div>
      </div>

      <FormSection title="Against the order">
        <FormGrid cols={3}>
          <Select
            label="Purchase order"
            required
            placeholder="Select an open PO"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            options={PURCHASE_ORDERS.filter(
              (p) => p.poStatus === 'OPEN' || p.poStatus === 'PART_RECEIVED',
            ).map((p) => ({
              value: p.poNumber,
              label: `${p.poNumber} — ${SUPPLIERS.find((s) => s.supplierId === p.supplierId)?.supplierName ?? ''}`,
              description: `${p.lines.length} ${p.lines.length === 1 ? 'line' : 'lines'} · expected ${p.expectedDate}`,
            }))}
          />
          <DerivedField
            label="GRN number"
            value={previewNumber('GRN', GRNS.map((g) => g.grnNumber))}
            emphasis
          />
          <DerivedField label="Supplier" value={supplier?.supplierName ?? '—'} />
          <DerivedField
            label="Pending on the order"
            value={line ? `${formatNumber(pending)} ${item?.uom}` : '—'}
          />
          <DerivedField label="Item" value={item ? `${item.itemCode}` : '—'} />
          <DerivedField
            label="Ordered specification"
            value={
              item?.thicknessMicrons
                ? `${item.thicknessMicrons} µm · ${item.deckleWidthMm ?? '—'} mm${item.colour ? ` · ${item.colour}` : ''}`
                : '—'
            }
          />
          <DerivedField
            label="Standard roll"
            value={item?.standardRollWeightKg ? `${item.standardRollWeightKg} kg` : '—'}
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="The consignment"
        description="What came with the load. These are the documents an auditor asks for by name."
      >
        <FormGrid cols={3}>
          <Input
            label="Supplier challan no"
            required
            mono
            value={challan}
            onChange={(e) => setChallan(e.target.value)}
            placeholder="SP/CH/26/4471"
          />
          <Input
            label="Delivery note no"
            mono
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="Supplier's own despatch note"
          />
          <Input
            label="Delivery note date"
            type="date"
            value={deliveryNoteDate}
            onChange={(e) => setDeliveryNoteDate(e.target.value)}
          />
          <Input
            label="E-way bill no"
            mono
            value={eWayBill}
            onChange={(e) => setEWayBill(e.target.value)}
            placeholder="12 digits"
          />
          <Input
            label="E-way bill date"
            type="date"
            value={eWayBillDate}
            onChange={(e) => setEWayBillDate(e.target.value)}
          />
          <Input
            label="Supplier invoice no"
            mono
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="Leave blank if not received"
          />
          <Input
            label="COC / test certificate no"
            mono
            value={cocNo}
            onChange={(e) => setCocNo(e.target.value)}
            helper={item?.isFoodGrade ? 'Food contact grade: QC will ask for this' : undefined}
          />
          <Input
            label="Vehicle no"
            mono
            value={vehicleNo}
            onChange={(e) => setVehicleNo(e.target.value)}
            placeholder="MH 48 AB 1234"
          />
          <Input
            label="Transporter"
            value={transporter}
            onChange={(e) => setTransporter(e.target.value)}
            placeholder="Who brought it"
          />
          <Select
            label="Unloaded at"
            placeholder="Select the warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            options={WAREHOUSES.map((w) => ({ value: w.warehouseId, label: w.warehouseName }))}
          />
          <Input
            label="Freight"
            unit="₹"
            type="number"
            step="0.01"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
          />
          <Input
            label="Other charges"
            unit="₹"
            type="number"
            step="0.01"
            value={otherCharges}
            onChange={(e) => setOtherCharges(e.target.value)}
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Reels on the consignment"
        description="One row per reel, because each is inspected, approved and issued on its own."
      >
        <FormGrid cols={3}>
          <Input
            label={isReel ? 'Number of reels' : 'Number of batches'}
            type="number"
            min={1}
            max={40}
            value={reelCount}
            onChange={(e) => {
              setReelCount(e.target.value)
              layOutReels(Number(e.target.value) || 1, 0)
            }}
          />
          <Input
            label="Weight per reel"
            unit={item?.uom ?? 'KG'}
            type="number"
            step="0.1"
            placeholder={item?.standardRollWeightKg ? String(item.standardRollWeightKg) : ''}
            onChange={(e) => layOutReels(Number(reelCount) || 1, Number(e.target.value) || 0)}
            helper="Fills every row; change any one that weighed differently"
          />
          <DerivedField
            label="Received in total"
            value={`${formatNumber(received, 1)} ${item?.uom ?? ''}`}
            emphasis={received > 0}
          />
        </FormGrid>

        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className={`${LINE_GRID} border-b border-bd-subtle px-2 pb-1.5`} style={BATCH_TEMPLATE}>
              <span className="label-caps">Reel</span>
              <span className="label-caps">Batch / roll id</span>
              <span className="label-caps text-right">Weight</span>
              <span className="label-caps text-right">Gauge</span>
              <span className="label-caps">Put away at</span>
              <span />
            </div>
            <ul>
              {batches.map((batch, index) => {
                const thin =
                  Number(batch.microns) > 0 && Number(batch.microns) < PLANT.minMicrons
                return (
                  <li
                    key={batch.key}
                    className={
                      thin
                        ? 'border-b border-bd-subtle bg-error-subtle last:border-0'
                        : 'border-b border-bd-subtle last:border-0 hover:bg-bg-hover/60'
                    }
                  >
                    <div className={`${LINE_GRID} px-2 py-1.5`} style={BATCH_TEMPLATE}>
                      <span className="font-mono text-xs text-fg-subtle">{index + 1}</span>
                      <Input
                        mono
                        value={batch.reelId}
                        placeholder="RL-9260"
                        onChange={(e) => patchBatch(batch.key, { reelId: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.1"
                        className="text-right"
                        value={batch.weight}
                        onChange={(e) => patchBatch(batch.key, { weight: e.target.value })}
                      />
                      <Input
                        type="number"
                        className="text-right"
                        value={batch.microns}
                        placeholder={item?.thicknessMicrons ? String(item.thicknessMicrons) : 'µm'}
                        onChange={(e) => patchBatch(batch.key, { microns: e.target.value })}
                      />
                      <Select
                        placeholder="Quarantine"
                        value={batch.binId}
                        onChange={(e) => patchBatch(batch.key, { binId: e.target.value })}
                        options={BINS.filter((b) => b.binType === 'QUARANTINE' || b.binType === 'GENERAL').map(
                          (b) => ({ value: b.binId, label: `${b.binCode} — ${b.binName}` }),
                        )}
                      />
                      <button
                        type="button"
                        aria-label={`Remove reel ${index + 1}`}
                        disabled={batches.length === 1}
                        onClick={() =>
                          setBatches((rows) =>
                            rows.length === 1 ? rows : rows.filter((r) => r.key !== batch.key),
                          )
                        }
                        className="grid h-7 w-7 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-error-subtle hover:text-error disabled:opacity-35"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {thin ? (
                      <p className="px-2 pb-1.5 pl-10 text-2xs text-error">
                        Under the {PLANT.minMicrons} µm plant floor — incoming QC will have to
                        return this reel
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="mt-2.5">
          <Button
            icon={Plus}
            onClick={() => setBatches((rows) => [...rows, newBatch(rows.length + 1)])}
          >
            Add a reel
          </Button>
        </div>
      </FormSection>

      <FormSection
        title="Inward check at the gate"
        description="Looked at before the vehicle is released. A finding does not stop the receipt — it goes on the record for incoming QC to see."
      >
        <ul className="grid gap-1.5 lg:grid-cols-2">
          {INWARD_CHECKS.map((check) => {
            const state = checks[check]
            return (
              <li
                key={check}
                className={
                  state === false
                    ? 'flex items-center gap-2 rounded-xl border border-error/50 bg-error-subtle px-3 py-1.5'
                    : 'flex items-center gap-2 rounded-xl border border-bd-default px-3 py-1.5'
                }
              >
                <span className="min-w-0 flex-1 truncate text-xs">{check}</span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-pressed={state === true}
                    onClick={() => setChecks((c) => ({ ...c, [check]: c[check] === true ? undefined : true }))}
                    className={
                      state === true
                        ? 'rounded-md border border-success bg-success px-2 py-0.5 text-2xs font-medium text-fg-inverse'
                        : 'rounded-md border border-bd-default px-2 py-0.5 text-2xs text-fg-muted hover:bg-bg-hover'
                    }
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    aria-pressed={state === false}
                    onClick={() => setChecks((c) => ({ ...c, [check]: c[check] === false ? undefined : false }))}
                    className={
                      state === false
                        ? 'rounded-md border border-error bg-error px-2 py-0.5 text-2xs font-medium text-fg-inverse'
                        : 'rounded-md border border-bd-default px-2 py-0.5 text-2xs text-fg-muted hover:bg-bg-hover'
                    }
                  >
                    Finding
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-fg-muted">
          {checkedCount} of {INWARD_CHECKS.length} looked at
          {failedChecks.length > 0 ? (
            <span className="text-error">
              {' '}
              · {failedChecks.length} finding{failedChecks.length > 1 ? 's' : ''} recorded against
              the consignment
            </span>
          ) : null}
        </p>
      </FormSection>

      <FormSection title="Receipt value">
        <FormGrid cols={3}>
          <DerivedField
            label="Goods"
            value={goodsValue > 0 ? formatCurrency(goodsValue, 0) : '—'}
          />
          <DerivedField
            label="Freight and other"
            value={
              Number(freight) || Number(otherCharges)
                ? formatCurrency((Number(freight) || 0) + (Number(otherCharges) || 0), 0)
                : '—'
            }
          />
          <DerivedField
            label="Landed value"
            value={total > 0 ? formatCurrency(total, 0) : '—'}
            emphasis
          />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

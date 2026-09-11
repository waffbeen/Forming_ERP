'use client'

import * as React from 'react'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import {
  Button, Checkbox, DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate,
} from '@/components/ui'
import {
  BINS, ITEMS, JOB_CARDS, PURCHASE_ORDERS, PURCHASE_REQUISITIONS, SUPPLIERS,
  onOrderQty, stockOnHand,
} from '@/data'
import { PLANT } from '@/config/plant'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ItemModal } from './business-modals'
import { SupplierModal } from './business-modals'
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

/**
 * What a buyer needs to recognise the item, on two lines: the code and the
 * name, then the specification it is bought on. A reel reads as its polymer,
 * gauge, deckle and colour; anything else reads as the pack it comes in.
 */
function itemDescription(item: Item) {
  const parts: string[] = []
  if (item.materialType) {
    parts.push(item.materialType)
    if (item.thicknessMicrons) parts.push(`${item.thicknessMicrons} µm`)
    if (item.deckleWidthMm) parts.push(`${item.deckleWidthMm} mm deckle`)
    if (item.colour) parts.push(item.colour)
    if (item.standardRollWeightKg) parts.push(`${item.standardRollWeightKg} kg roll`)
  }
  parts.push(
    item.conversionToStock > 1
      ? `bought in ${item.purchaseUom} of ${item.conversionToStock} ${item.uom}`
      : `bought and stocked in ${item.uom}`,
  )
  if (item.minOrderQtyKg) parts.push(`min ${item.minOrderQtyKg} ${item.uom}`)
  return parts.join(' · ')
}

const itemOptions = ITEMS.filter((i) => i.status === 'ACTIVE').map((i) => ({
  value: i.itemId,
  label: `${i.itemCode} — ${i.itemName}`,
  description: itemDescription(i),
}))

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

let lineSeq = 0
const newLine = (): DraftLine => ({ key: `L${++lineSeq}`, itemId: '', quantity: '' })

/**
 * One document, many items. A supplier is not sent a separate order per item
 * and a department does not raise a separate requisition per item, so both
 * screens are a header and a grid of lines — the way the paper order they
 * replace is laid out, and the way the tables underneath already were.
 */
function useDraftLines() {
  const [lines, setLines] = React.useState<DraftLine[]>([newLine()])

  const add = () => setLines((rows) => [...rows, newLine()])
  const remove = (key: string) =>
    setLines((rows) => (rows.length === 1 ? [newLine()] : rows.filter((r) => r.key !== key)))
  const patch = (key: string, values: Partial<DraftLine>) =>
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...values } : r)))
  const reset = () => setLines([newLine()])

  /** The same item twice on one document is a keying slip, never an intent. */
  const duplicates = lines
    .map((r) => r.itemId)
    .filter((id, i, all) => id && all.indexOf(id) !== i)

  return { lines, add, remove, patch, reset, duplicates }
}

// ------------------------------------------------------- Purchase requisition

export function RequisitionModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [department, setDepartment] = React.useState('')
  const { lines, add, remove, patch, reset, duplicates } = useDraftLines()

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
          <DerivedField label="PR number" value="Assigned on submit" />
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
                      <SelectWithCreate
                        placeholder="Select or add an item"
                        value={line.itemId}
                        onChange={(next) => {
                          const picked = ITEMS.find((i) => i.itemId === next)
                          const shortfall = picked
                            ? Math.max(
                                picked.reorderLevel -
                                  stockOnHand(picked.itemId) -
                                  onOrderQty(picked.itemId),
                                0,
                              )
                            : 0
                          patch(line.key, {
                            itemId: next,
                            quantity: line.quantity || (shortfall > 0 ? String(shortfall) : ''),
                          })
                        }}
                        options={itemOptions}
                        error={Boolean(line.itemId && duplicates.includes(line.itemId))}
                        createLabel="New item"
                        renderCreateModal={(props) => <ItemModal {...props} />}
                      />
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

        <div className="mt-2.5">
          <Button icon={Plus} onClick={add}>
            Add another item
          </Button>
        </div>
      </FormSection>
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
  const { lines, add, remove, patch, reset, duplicates } = useDraftLines()

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
                        <SelectWithCreate
                          placeholder="Select or add an item"
                          value={line.itemId}
                          onChange={(next) => {
                            /* The item brings its own price and its own minimum,
                               so the line opens on them rather than on nothing. */
                            const picked = ITEMS.find((i) => i.itemId === next)
                            patch(line.key, {
                              itemId: next,
                              rate: picked ? String(picked.ratePerUom) : '',
                              quantity:
                                line.quantity ||
                                (picked?.minOrderQtyKg ? String(picked.minOrderQtyKg) : ''),
                              deliveryDate: line.deliveryDate || expected,
                            })
                          }}
                          options={itemOptions}
                          error={Boolean(
                            polymerMismatch || (line.itemId && duplicates.includes(line.itemId)),
                          )}
                          createLabel="New item"
                          renderCreateModal={(props) => <ItemModal {...props} />}
                        />
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

        <div className="mt-2.5">
          <Button icon={Plus} onClick={add}>
            Add another item
          </Button>
        </div>
      </FormSection>

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
  const [reelId, setReelId] = React.useState('')
  const [challanQty, setChallanQty] = React.useState('')
  const [weighedQty, setWeighedQty] = React.useState('')
  const [thickness, setThickness] = React.useState('')
  const [qcDone, setQcDone] = React.useState(false)
  const [qcStatus, setQcStatus] = React.useState('APPROVED')
  const [binId, setBinId] = React.useState('')

  const po = PURCHASE_ORDERS.find((p) => p.poNumber === poNumber)
  const line = po?.lines[0]
  const item = ITEMS.find((i) => i.itemId === line?.itemId)
  const supplier = SUPPLIERS.find((s) => s.supplierId === po?.supplierId)
  const pending = line ? line.orderedQty - line.receivedQty : 0

  const challanNum = Number(challanQty) || 0
  const weighed = Number(weighedQty) || 0
  const shortfall = challanNum - weighed
  const overReceipt = line ? weighed > pending : false

  const thicknessNum = Number(thickness) || 0
  const belowFloor = thicknessNum > 0 && thicknessNum < PLANT.minMicrons

  /* A roll under the plant floor cannot be accepted, whatever QC selects. */
  const effectiveStatus = belowFloor ? 'REJECTED' : qcStatus

  const binOptions = BINS.filter((b) => {
    if (effectiveStatus === 'APPROVED') return b.binType === 'QC_APPROVED'
    if (effectiveStatus === 'QUARANTINE') return b.binType === 'QUARANTINE'
    if (effectiveStatus === 'REJECTED') return b.binType === 'REJECTED'
    return false
  })

  React.useEffect(() => {
    setBinId(binOptions[0]?.binId ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveStatus])

  const canSave = Boolean(poNumber && challan && weighed > 0 && (!qcDone || binId))

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Goods Receipt"
      badge={
        qcDone
          ? { label: `IQC ${effectiveStatus.toLowerCase()}`, tone: effectiveStatus === 'APPROVED' ? 'success' : effectiveStatus === 'QUARANTINE' ? 'warning' : 'error' }
          : { label: 'Pending IQC', tone: 'muted' }
      }
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!canSave}
      saveLabel="Book receipt"
      footerNote={
        qcDone && effectiveStatus === 'APPROVED'
          ? `Moves ${formatNumber(weighed, 1)} ${item?.uom ?? ''} into ${binOptions.find((b) => b.binId === binId)?.binCode ?? 'a bin'}`
          : 'Stock moves only once IQC approves the line'
      }
    >
      {!qcDone ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-bd-strong bg-bg-subtle p-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
          <div>
            <h5 className="text-sm font-semibold">Booked, not yet in stock</h5>
            <p className="mt-0.5 max-w-[62ch] text-xs text-fg-muted">
              The receipt records what arrived. Nothing reaches a bin until incoming QC has measured it and picked an
              outcome.
            </p>
          </div>
        </div>
      ) : null}

      <FormSection title="Receipt">
        <FormGrid cols={2}>
          <Select
            label="Against purchase order"
            required
            placeholder="Select an open PO"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            options={PURCHASE_ORDERS.filter((p) => p.poStatus === 'OPEN' || p.poStatus === 'PART_RECEIVED').map((p) => ({
              value: p.poNumber,
              label: `${p.poNumber} — ${SUPPLIERS.find((s) => s.supplierId === p.supplierId)?.supplierName ?? ''}`,
            }))}
          />
          <DerivedField label="Supplier" value={supplier?.supplierName ?? '—'} />
          <Input label="Supplier challan no" required mono value={challan} onChange={(e) => setChallan(e.target.value)} placeholder="SP/CH/26/4471" />
          <Input label="Supplier invoice no" mono value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="Leave blank if not received" />
        </FormGrid>
      </FormSection>

      <FormSection title="Line">
        <FormGrid cols={3}>
          <DerivedField label="Item" value={item?.itemCode ?? '—'} />
          <DerivedField label="Pending on the order" value={line ? `${formatNumber(pending)} ${item?.uom}` : '—'} />
          <Input label="Reel / batch id" mono value={reelId} onChange={(e) => setReelId(e.target.value)} placeholder="RL-9260" />
          <Input label="Challan quantity" unit={item?.uom ?? 'unit'} type="number" step="0.1" value={challanQty} onChange={(e) => setChallanQty(e.target.value)} />
          <Input
            label="Weighed quantity"
            unit={item?.uom ?? 'unit'}
            required
            type="number"
            step="0.1"
            value={weighedQty}
            onChange={(e) => setWeighedQty(e.target.value)}
            error={overReceipt ? `Only ${formatNumber(pending)} pending on this order` : false}
            helper={
              !overReceipt && shortfall > 0
                ? `${formatNumber(shortfall, 1)} short against the challan`
                : undefined
            }
          />
          <Input
            label="Measured thickness"
            unit="µm"
            type="number"
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
            error={belowFloor ? `Below the ${PLANT.minMicrons} µm floor, must be rejected` : false}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Incoming QC">
        <Checkbox
          label="Inspected"
          hint="Tick once IQC has measured the material and decided where it goes"
          checked={qcDone}
          onChange={(e) => setQcDone(e.target.checked)}
        />
        {qcDone ? (
          <div className="mt-3">
            <FormGrid cols={2}>
              <Select
                label="Outcome"
                required
                value={effectiveStatus}
                disabled={belowFloor}
                onChange={(e) => setQcStatus(e.target.value)}
                options={[
                  { value: 'APPROVED', label: 'Approved, release to the store' },
                  { value: 'QUARANTINE', label: 'Quarantine, hold pending decision' },
                  { value: 'REJECTED', label: 'Rejected, return to supplier' },
                ]}
                helper={belowFloor ? 'Forced to rejected: under the plant thickness floor' : undefined}
              />
              <Select
                label="Bin"
                required
                placeholder="Select bin"
                value={binId}
                onChange={(e) => setBinId(e.target.value)}
                options={binOptions.map((b) => ({ value: b.binId, label: `${b.binCode} — ${b.binName}` }))}
              />
            </FormGrid>
          </div>
        ) : null}
      </FormSection>
    </StandardModal>
  )
}

'use client'

import * as React from 'react'
import { Lock } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import {
  Checkbox, DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate, Textarea,
} from '@/components/ui'
import {
  BINS, ITEMS, JOB_CARDS, PURCHASE_ORDERS, PURCHASE_REQUISITIONS, SUPPLIERS,
  onOrderQty, stockOnHand,
} from '@/data'
import { PLANT } from '@/config/plant'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ItemModal } from './business-modals'
import { SupplierModal } from './business-modals'
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

const itemOptions = ITEMS.filter((i) => i.status === 'ACTIVE').map((i) => ({
  value: i.itemId,
  label: `${i.itemCode} — ${i.itemName}`,
}))

// ------------------------------------------------------- Purchase requisition

export function RequisitionModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [department, setDepartment] = React.useState('')
  const [itemId, setItemId] = React.useState('')
  const [quantity, setQuantity] = React.useState('')
  const [requiredBy, setRequiredBy] = React.useState('')
  const [jobCardNo, setJobCardNo] = React.useState('')
  const [remarks, setRemarks] = React.useState('')

  const item = ITEMS.find((i) => i.itemId === itemId)
  const onHand = item ? stockOnHand(item.itemId) : 0
  const onOrder = item ? onOrderQty(item.itemId) : 0
  const qty = Number(quantity) || 0

  /* Free stock plus what is already on order tells the planner whether this
     requisition is actually needed, or whether a PO already covers it. */
  const covered = item ? onHand + onOrder >= item.reorderLevel : false

  React.useEffect(() => {
    if (item && !quantity) setQuantity(String(Math.max(item.reorderLevel - onHand - onOrder, 0)))
  }, [item, quantity, onHand, onOrder])

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Purchase Requisition"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!department || !itemId || qty <= 0 || !requiredBy}
      saveLabel="Submit for approval"
      footerNote={
        item
          ? `${formatNumber(onHand, 1)} ${item.uom} on hand, ${formatNumber(onOrder)} on order`
          : 'Pick an item to see its position'
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

      <FormSection title="Line">
        <FormGrid cols={2}>
          <SelectWithCreate
            label="Item"
            required
            placeholder="Select or add an item"
            value={itemId}
            onChange={setItemId}
            options={itemOptions}
            createLabel="New item"
            renderCreateModal={(props) => <ItemModal {...props} />}
          />
          <Input
            label="Quantity"
            unit={item?.uom ?? 'unit'}
            required
            type="number"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            helper={
              covered && qty > 0
                ? 'Stock plus what is on order already covers the reorder level'
                : undefined
            }
          />
          <Input label="Required by" required type="date" value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} />
          <Select
            label="Against job card"
            placeholder="None, stock replenishment"
            value={jobCardNo}
            onChange={(e) => setJobCardNo(e.target.value)}
            options={JOB_CARDS.map((j) => ({ value: j.jobCardNo, label: `${j.jobCardNo} — ${j.customerName}` }))}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Position">
        <FormGrid cols={3}>
          <DerivedField label="On hand" value={item ? `${formatNumber(onHand, 1)} ${item.uom}` : '—'} />
          <DerivedField label="On order" value={item ? `${formatNumber(onOrder)} ${item.uom}` : '—'} />
          <DerivedField
            label="Reorder level"
            value={item ? `${formatNumber(item.reorderLevel)} ${item.uom}` : '—'}
            emphasis={Boolean(item && onHand < item.reorderLevel)}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Remarks">
        <Textarea label="Justification" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------- Purchase order

export function PurchaseOrderModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [supplierId, setSupplierId] = React.useState('')
  const [prNumber, setPrNumber] = React.useState('')
  const [itemId, setItemId] = React.useState('')
  const [quantity, setQuantity] = React.useState('')
  const [rate, setRate] = React.useState('')
  const [gst, setGst] = React.useState('18')
  const [expected, setExpected] = React.useState('')
  const [thickness, setThickness] = React.useState('')
  const [deckle, setDeckle] = React.useState('620')

  const supplier = SUPPLIERS.find((s) => s.supplierId === supplierId)
  const item = ITEMS.find((i) => i.itemId === itemId)
  const isReel = item?.itemType === 'RAW_MATERIAL'
  const qty = Number(quantity) || 0
  const rateNum = Number(rate) || 0
  const net = qty * rateNum
  const total = net * (1 + (Number(gst) || 0) / 100)

  /* A supplier may only be ordered from for polymers they are approved for. */
  const polymerMismatch = Boolean(
    isReel && supplier && supplier.materialsSupplied.length > 0 && item &&
      !supplier.materialsSupplied.some((m) => item.itemCode.includes(m)),
  )

  const thicknessNum = Number(thickness) || 0
  const belowFloor = isReel && thicknessNum > 0 && thicknessNum < PLANT.minMicrons

  React.useEffect(() => {
    if (item) setRate(String(item.ratePerUom))
  }, [item])

  const approved = PURCHASE_REQUISITIONS.filter(
    (p) => p.prStatus === 'APPROVED' || p.prStatus === 'SUBMITTED',
  )

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Purchase Order"
      badge={supplier ? { label: `${supplier.qualityRatingPct.toFixed(1)} % IQC first pass`, tone: supplier.qualityRatingPct >= 95 ? 'success' : 'warning' } : undefined}
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!supplierId || !itemId || qty <= 0 || !expected || polymerMismatch || belowFloor}
      saveLabel="Raise purchase order"
      footerNote={total > 0 ? `Order value ${formatCurrency(total, 0)} including GST` : undefined}
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
          <Input label="Expected delivery" required type="date" value={expected} onChange={(e) => setExpected(e.target.value)} helper={supplier ? `${supplier.leadTimeDays} day lead time` : undefined} />
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

      <FormSection title="Line">
        <FormGrid cols={2}>
          <SelectWithCreate
            label="Item"
            required
            placeholder="Select or add an item"
            value={itemId}
            onChange={setItemId}
            options={itemOptions}
            error={polymerMismatch ? `${supplier?.supplierName} is not approved for this polymer` : false}
            createLabel="New item"
            renderCreateModal={(props) => <ItemModal {...props} />}
          />
          <Input label="Quantity" unit={item?.uom ?? 'unit'} required type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input label="Rate" unit={`₹ / ${item?.uom ?? 'unit'}`} type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          <DerivedField label="Line value" value={net > 0 ? formatCurrency(net, 0) : '—'} />
          {isReel ? (
            <>
              <Input
                label="Thickness"
                unit="µm"
                type="number"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                error={belowFloor ? `Below the ${PLANT.minMicrons} µm plant floor` : false}
              />
              <Input label="Deckle width" unit="mm" type="number" value={deckle} onChange={(e) => setDeckle(e.target.value)} />
            </>
          ) : null}
          <DerivedField label="Total incl. GST" value={total > 0 ? formatCurrency(total, 0) : '—'} emphasis />
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

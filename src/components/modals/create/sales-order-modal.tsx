'use client'

import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import { CustomerModal } from './master-modals'
import { ArtworkPicker } from './master-pickers'
import {
  Button, DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate, Textarea,
} from '@/components/ui'
import { ARTWORKS, CUSTOMERS, MATERIALS, quotableEstimations } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateCosting, calculateNesting } from '@/lib/layout-calc'
import { formatCurrency, formatKg, formatNumber, formatPercent } from '@/lib/utils'

const CONVERSION_PER_PC = 0.85
const OFFERS = quotableEstimations()

/** One item being keyed in, before it becomes a line on the order. */
interface DraftLine {
  key: string
  artworkCode: string
  qty: string
  rate: string
  deliveryDate: string
}

let lineSeq = 0
const blankLine = (): DraftLine => ({
  key: `L${++lineSeq}`,
  artworkCode: '',
  qty: '',
  rate: '',
  deliveryDate: '',
})

/** What one keyed-in item costs to make, from its own artwork and gauge. */
function priceLine(line: DraftLine) {
  const artwork = ARTWORKS.find((a) => a.artworkCode === line.artworkCode)
  const material = MATERIALS.find((m) => m.materialType === artwork?.materialType)
  const qty = Number(line.qty) || 0
  const rate = Number(line.rate) || 0
  if (!artwork || !material || qty <= 0) return { artwork, qty, rate, nesting: null, costing: null }

  const nesting = calculateNesting({
    openLengthMm: artwork.openLengthMm,
    openWidthMm: artwork.openWidthMm,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
  })
  if (nesting.upsPerSheet === 0) return { artwork, qty, rate, nesting, costing: null }

  const costing = calculateCosting({
    targetPiecesQty: qty,
    upsPerSheet: nesting.upsPerSheet,
    utilisation: nesting.utilisation,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
    thicknessMicrons: artwork.thicknessMicrons,
    densityGCm3: material.densityGCm3,
    ratePerKg: material.ratePerKg,
    scrapRatePerKg: material.scrapRatePerKg,
    conversionRatePerPc: CONVERSION_PER_PC,
  })

  return { artwork, qty, rate, nesting, costing }
}

/**
 * A sales order, as the customer's PO actually arrives.
 *
 * A PO rarely names one tray: a base and its lid, or several cavity counts of
 * one design, each with its own gauge, rate and delivery date. Each is its own
 * line here because each becomes its own job card on the floor, and each is
 * costed on its own layout rather than against an order-level average.
 */
export function SalesOrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  /* A repeat of a design that is already costed comes straight in; anything
     the customer had to be quoted for is raised against that offer, so the
     rate on the order is the rate that was actually accepted. */
  const [raisedFrom, setRaisedFrom] = React.useState<'DIRECT' | 'ESTIMATION'>('DIRECT')
  const [estimationNo, setEstimationNo] = React.useState('')
  const [customerId, setCustomerId] = React.useState('')
  const [poRef, setPoRef] = React.useState('')
  const [lines, setLines] = React.useState<DraftLine[]>([blankLine()])
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const estimation = OFFERS.find((e) => e.estimationNo === estimationNo)

  /* Taking the offer fills the first item from it rather than asking for the
     same numbers a second time, where they could be keyed in differently. */
  React.useEffect(() => {
    if (!estimation) return
    if (estimation.customerId) setCustomerId(estimation.customerId)
    setLines((current) => {
      const [first, ...rest] = current
      return [
        {
          ...first,
          artworkCode: estimation.artworkCode ?? first.artworkCode,
          qty: String(estimation.quantityPcs),
          rate: String(estimation.offeredRatePerPc),
        },
        ...rest,
      ]
    })
  }, [estimation])

  /* Only artworks belonging to the chosen customer can be ordered, which is
     what stops a PO description being matched to the wrong drawing. */
  const artworkOptions = React.useMemo(
    () => ARTWORKS.filter((a) => !customerId || a.customerId === customerId),
    [customerId],
  )

  const setLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const addLine = () => setLines((current) => [...current, blankLine()])
  const removeLine = (key: string) =>
    setLines((current) => (current.length > 1 ? current.filter((l) => l.key !== key) : current))

  const priced = lines.map((line) => ({ line, ...priceLine(line) }))
  const totalQty = priced.reduce((sum, p) => sum + p.qty, 0)
  const totalValue = priced.reduce((sum, p) => sum + p.qty * p.rate, 0)
  const totalCost = priced.reduce((sum, p) => sum + (p.costing?.totalCost ?? 0), 0)
  const totalWeightKg = priced.reduce((sum, p) => sum + (p.costing?.grossWeightKg ?? 0), 0)
  const margin = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : null

  const completeLines = priced.filter((p) => p.line.artworkCode && p.qty > 0 && p.line.deliveryDate)
  const needsOffer = raisedFrom === 'ESTIMATION' && !estimationNo
  const belowCost = priced.some((p) => p.costing && p.rate > 0 && p.rate < p.costing.costPerPiece)
  const canSave = Boolean(customerId) && completeLines.length === lines.length && !needsOffer

  const blockedReason = () => {
    if (needsOffer) return 'Select the estimation this order is being raised against'
    if (!customerId) return 'Select the customer the order is for'
    if (completeLines.length !== lines.length) {
      return 'Every item needs an artwork, a quantity and a delivery date'
    }
    if (belowCost) return 'An item is priced below its landed cost'
    return `${lines.length} item${lines.length > 1 ? 's' : ''} · ${formatNumber(totalQty)} pieces · ${formatCurrency(totalValue, 0)}`
  }

  const reset = () => {
    setRaisedFrom('DIRECT')
    setEstimationNo('')
    setCustomerId('')
    setPoRef('')
    setLines([blankLine()])
    setNotes('')
  }

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      reset()
      onClose()
    }, 500)
  }

  const unapproved = priced.some((p) => p.artwork && !p.artwork.approved)

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Sales Order"
      subtitle="One line per item on the customer's PO"
      badge={unapproved ? { label: 'Artwork not approved', tone: 'warning' } : undefined}
      size="master"
      onSave={handleSave}
      saveLabel="Create Sales Order"
      saving={saving}
      saveDisabled={!canSave}
      footerNote={blockedReason()}
    >
      <FormSection title="Raised from">
        <FormGrid cols={3}>
          <Select
            label="Order source"
            value={raisedFrom}
            onChange={(e) => {
              setRaisedFrom(e.target.value as 'DIRECT' | 'ESTIMATION')
              setEstimationNo('')
            }}
            options={[
              { value: 'DIRECT', label: 'Direct order' },
              { value: 'ESTIMATION', label: 'Against an estimation' },
            ]}
            helper="Direct is for a repeat of a design already costed"
          />
          <Select
            label="Estimation"
            required={raisedFrom === 'ESTIMATION'}
            disabled={raisedFrom !== 'ESTIMATION'}
            placeholder={raisedFrom === 'ESTIMATION' ? 'Select the accepted offer' : 'Not applicable'}
            value={estimationNo}
            onChange={(e) => setEstimationNo(e.target.value)}
            options={OFFERS.map((o) => ({
              value: o.estimationNo,
              label: `${o.estimationNo} — ${o.customerName} @ ${formatCurrency(o.offeredRatePerPc)}`,
            }))}
          />
          <DerivedField
            label="Offered rate"
            value={estimation ? `${formatCurrency(estimation.offeredRatePerPc)} / pc` : '—'}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Order">
        <FormGrid cols={3}>
          <SelectWithCreate
            label="Customer"
            required
            placeholder="Select or add customer"
            value={customerId}
            onChange={(next) => {
              setCustomerId(next)
              // The artwork list is scoped to the customer, so clear the items.
              setLines((current) => current.map((l) => ({ ...l, artworkCode: '' })))
            }}
            options={CUSTOMERS.map((c) => ({ value: c.customerId, label: `${c.customerName} — ${c.city}` }))}
            createLabel="New client"
            renderCreateModal={(props) => <CustomerModal {...props} />}
          />
          <Input
            label="Client PO reference"
            mono
            placeholder="PO/VAD/26-27/1188"
            value={poRef}
            onChange={(e) => setPoRef(e.target.value)}
          />
          <DerivedField label="Items on this order" value={String(lines.length)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Items">
        <ul className="space-y-3">
          {priced.map(({ line, artwork, qty, rate, nesting, costing }, index) => {
            const lineMargin = costing && rate > 0 ? ((rate - costing.costPerPiece) / rate) * 100 : null
            return (
              <li key={line.key} className="rounded-md border border-bd-default p-3">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <span className="label-caps">Item {index + 1}</span>
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    disabled={lines.length === 1}
                    onClick={() => removeLine(line.key)}
                  >
                    Remove
                  </Button>
                </div>

                <FormGrid cols={4}>
                  <ArtworkPicker
                    label="Artwork code"
                    required
                    placeholder={customerId ? 'Select artwork' : 'Select a customer first'}
                    disabled={!customerId}
                    value={line.artworkCode}
                    onChange={(next) => setLine(line.key, { artworkCode: next })}
                    options={artworkOptions.map((a) => ({
                      value: a.artworkCode,
                      label: `${a.artworkCode} — ${a.clientProductRef}`,
                    }))}
                    helper={artwork && !artwork.approved ? 'Drawing approval is still pending' : undefined}
                  />
                  <Input
                    label="Quantity"
                    unit="pieces"
                    required
                    type="number"
                    min={1}
                    placeholder="25000"
                    value={line.qty}
                    onChange={(e) => setLine(line.key, { qty: e.target.value })}
                  />
                  <Input
                    label="Agreed rate"
                    unit="₹ / piece"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="2.85"
                    value={line.rate}
                    onChange={(e) => setLine(line.key, { rate: e.target.value })}
                    error={
                      costing && rate > 0 && rate < costing.costPerPiece
                        ? 'Below the landed cost'
                        : false
                    }
                  />
                  <Input
                    label="Delivery date"
                    required
                    type="date"
                    value={line.deliveryDate}
                    onChange={(e) => setLine(line.key, { deliveryDate: e.target.value })}
                  />
                </FormGrid>

                <FormGrid cols={4}>
                  <DerivedField
                    label="Material"
                    value={artwork ? `${artwork.materialType} · ${artwork.thicknessMicrons} µm` : '—'}
                  />
                  <DerivedField
                    label="Cavity ups per sheet"
                    value={nesting ? `${nesting.upsPerSheet} (${nesting.across} × ${nesting.down})` : '—'}
                  />
                  <DerivedField
                    label="Reel weight"
                    value={costing ? formatKg(costing.grossWeightKg) : '—'}
                  />
                  <DerivedField
                    label="Landed cost / margin"
                    value={
                      costing
                        ? `${formatCurrency(costing.costPerPiece)}${lineMargin !== null ? ` · ${formatPercent(lineMargin)}` : ''}`
                        : '—'
                    }
                    emphasis
                  />
                </FormGrid>

                <p className="mt-2 text-xs text-fg-muted">
                  Line value {qty > 0 && rate > 0 ? formatCurrency(qty * rate, 0) : '—'}
                </p>
              </li>
            )
          })}
        </ul>

        <div className="mt-3">
          <Button icon={Plus} onClick={addLine}>
            Add item
          </Button>
        </div>
      </FormSection>

      <FormSection title="Order totals">
        <FormGrid cols={4}>
          <DerivedField label="Total quantity" value={formatNumber(totalQty)} />
          <DerivedField label="Total reel weight" value={formatKg(totalWeightKg)} />
          <DerivedField label="Order value" value={formatCurrency(totalValue, 0)} emphasis />
          <DerivedField
            label="Margin across items"
            value={margin !== null ? formatPercent(margin) : '—'}
            emphasis
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Notes">
        <Textarea
          label="Internal notes"
          placeholder="Anything the planner needs to know before the job cards are released."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormSection>
    </StandardModal>
  )
}

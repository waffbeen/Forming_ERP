'use client'

import * as React from 'react'
import { Calculator, Send } from 'lucide-react'
import { StandardModal } from '@/components/modals/standard-modal'
import { CustomerModal } from './master-modals'
import { ArtworkPicker, MaterialPicker } from './master-pickers'
import {
  DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate, Textarea,
} from '@/components/ui'
import { ARTWORKS, CUSTOMERS, MATERIALS, SALES_ENQUIRIES } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateCosting, calculateNesting } from '@/lib/layout-calc'
import { formatCurrency, formatKg, formatNumber, formatPercent } from '@/lib/utils'
import type { MaterialType } from '@/types'

const MATERIAL_OPTIONS = MATERIALS.map((m) => ({
  value: m.materialType,
  label: `${m.materialType} · ${m.grade}`,
}))

const SOURCE_OPTIONS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'PLANT_VISIT', label: 'Plant visit' },
  { value: 'REFERRAL', label: 'Referral' },
]

/**
 * A customer enquiry, in the customer's own terms.
 *
 * Nothing here is costed. An enquiry can name a design that has no artwork
 * master yet and can come from a company that is not a customer yet, which is
 * exactly why it is a record of its own rather than a half-filled order.
 */
export function EnquiryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [customerId, setCustomerId] = React.useState('')
  const [prospectName, setProspectName] = React.useState('')
  const [contact, setContact] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [artworkCode, setArtworkCode] = React.useState('')
  const [material, setMaterial] = React.useState<MaterialType | ''>('')
  const [micron, setMicron] = React.useState('')
  const [length, setLength] = React.useState('')
  const [width, setWidth] = React.useState('')
  const [depth, setDepth] = React.useState('')
  const [qty, setQty] = React.useState('')
  const [targetRate, setTargetRate] = React.useState('')
  const [requiredBy, setRequiredBy] = React.useState('')
  const [source, setSource] = React.useState('EMAIL')
  const [remarks, setRemarks] = React.useState('')

  const artwork = ARTWORKS.find((a) => a.artworkCode === artworkCode)

  /* Picking a known artwork settles the specification, so it is filled in
     rather than asked for twice. */
  React.useEffect(() => {
    if (!artwork) return
    setMaterial(artwork.materialType)
    setMicron(String(artwork.thicknessMicrons))
    setLength(String(artwork.openLengthMm))
    setWidth(String(artwork.openWidthMm))
    setDepth(String(artwork.depthMm))
  }, [artwork])

  const named = Boolean(customerId) || prospectName.trim().length > 0
  const canSave = named && description.trim().length > 0 && Number(qty) > 0 && Boolean(requiredBy)

  const blockedReason = () => {
    if (!named) return 'Name the customer, or the prospect if they are not one yet'
    if (!description.trim()) return 'Describe what the customer is asking for'
    if (Number(qty) <= 0) return 'Enter the quantity being asked for'
    if (!requiredBy) return 'Enter the date the customer needs it by'
    return 'Ready to log'
  }

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      onClose()
    }, 500)
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Sales Enquiry"
      subtitle="What the customer asked for, before anything is costed"
      size="xl"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!canSave}
      saveIcon={Send}
      saveLabel="Log enquiry"
      footerNote={blockedReason()}
    >
      <FormSection title="Who is asking">
        <FormGrid cols={3}>
          <SelectWithCreate
            label="Existing customer"
            placeholder="Select customer"
            value={customerId}
            onChange={(next) => {
              setCustomerId(next)
              if (next) setProspectName('')
            }}
            options={CUSTOMERS.map((c) => ({ value: c.customerId, label: `${c.customerName} — ${c.city}` }))}
            createLabel="New client"
            renderCreateModal={(props) => <CustomerModal {...props} />}
          />
          <Input
            label="Prospect name"
            placeholder="If they are not a customer yet"
            value={prospectName}
            disabled={Boolean(customerId)}
            onChange={(e) => setProspectName(e.target.value)}
          />
          <Input
            label="Contact person"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Name at the customer"
          />
          <Select
            label="Came in by"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={SOURCE_OPTIONS}
          />
          <Input label="Enquiry date" type="date" defaultValue="2026-09-09" />
          <Input
            label="Required by"
            type="date"
            required
            value={requiredBy}
            onChange={(e) => setRequiredBy(e.target.value)}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="What they want">
        <FormGrid cols={3}>
          <Input
            label="Product description"
            required
            className="md:col-span-2"
            placeholder="Four-compartment meal tray, HIPS white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <ArtworkPicker
            label="Existing artwork"
            placeholder="If it matches one on file"
            value={artworkCode}
            onChange={setArtworkCode}
            options={ARTWORKS.map((a) => ({
              value: a.artworkCode,
              label: `${a.artworkCode} — ${a.clientProductRef}`,
            }))}
            helper="Leave blank for a design that has no drawing yet"
          />
          <MaterialPicker
            label="Material"
            placeholder="Select polymer"
            value={material}
            onChange={(next) => setMaterial(next as MaterialType)}
            options={MATERIAL_OPTIONS}
          />
          <Input
            label="Thickness"
            unit="µm"
            type="number"
            value={micron}
            onChange={(e) => setMicron(e.target.value)}
            placeholder="350"
            error={
              Number(micron) > 0 && (Number(micron) < PLANT.minMicrons || Number(micron) > PLANT.maxMicrons)
                ? `The plant runs ${PLANT.minMicrons} to ${PLANT.maxMicrons} µm`
                : false
            }
          />
          <Input
            label="Quantity asked for"
            unit="pieces"
            required
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="120000"
          />
          <Input
            label="Open length"
            unit="mm"
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            helper="Expanded, unformed"
          />
          <Input label="Open width" unit="mm" type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
          <Input label="Formed depth" unit="mm" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} />
          <Input
            label="Target rate"
            unit="₹ / piece"
            type="number"
            step="0.01"
            value={targetRate}
            onChange={(e) => setTargetRate(e.target.value)}
            helper="What the customer says they want to pay"
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Remarks">
        <Textarea
          label="Notes for the estimator"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Anything that affects how this should be costed."
        />
      </FormSection>
    </StandardModal>
  )
}

/* ------------------------------------------------------------------ */

/**
 * The costed offer.
 *
 * Weight, sheet count and landed cost come from the nesting and costing engine
 * the moment a layout and a quantity exist, so the estimator sets only the two
 * things that are actually a commercial decision: the conversion rate and the
 * margin. The rate that goes to the customer follows from those.
 */
export function EstimationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [enquiryNo, setEnquiryNo] = React.useState('')
  const [customerName, setCustomerName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [material, setMaterial] = React.useState<MaterialType | ''>('')
  const [micron, setMicron] = React.useState('')
  const [length, setLength] = React.useState('')
  const [width, setWidth] = React.useState('')
  const [qty, setQty] = React.useState('')
  const [conversion, setConversion] = React.useState('0.85')
  const [margin, setMargin] = React.useState('20')
  const [validUntil, setValidUntil] = React.useState('')

  const enquiry = SALES_ENQUIRIES.find((e) => e.enquiryNo === enquiryNo)

  /* An estimation raised against an enquiry inherits its specification, so the
     offer cannot quietly be for something other than what was asked for. */
  React.useEffect(() => {
    if (!enquiry) return
    setCustomerName(enquiry.customerName)
    setDescription(enquiry.productDescription)
    setMaterial(enquiry.materialType)
    setMicron(String(enquiry.thicknessMicrons))
    setLength(String(enquiry.openLengthMm))
    setWidth(String(enquiry.openWidthMm))
    setQty(String(enquiry.expectedQtyPcs))
  }, [enquiry])

  const grade = MATERIALS.find((m) => m.materialType === material)
  const lengthNum = Number(length) || 0
  const widthNum = Number(width) || 0
  const qtyNum = Number(qty) || 0
  const marginNum = Number(margin) || 0

  const nesting =
    lengthNum > 0 && widthNum > 0
      ? calculateNesting({
          openLengthMm: lengthNum,
          openWidthMm: widthNum,
          deckleWidthMm: DECKLE_MM,
          bedPitchMm: PLANT.bedLengthMm,
        })
      : null

  const costing =
    grade && nesting && nesting.upsPerSheet > 0 && qtyNum > 0 && Number(micron) > 0
      ? calculateCosting({
          targetPiecesQty: qtyNum,
          upsPerSheet: nesting.upsPerSheet,
          utilisation: nesting.utilisation,
          deckleWidthMm: DECKLE_MM,
          bedPitchMm: PLANT.bedLengthMm,
          thicknessMicrons: Number(micron),
          densityGCm3: grade.densityGCm3,
          ratePerKg: grade.ratePerKg,
          scrapRatePerKg: grade.scrapRatePerKg,
          conversionRatePerPc: Number(conversion) || 0,
          wastePercent: 2.5,
        })
      : null

  const offeredRate = costing ? costing.costPerPiece * (1 + marginNum / 100) : 0
  const orderValue = offeredRate * qtyNum
  const target = enquiry?.targetRatePerPc ?? null
  const aboveTarget = target !== null && offeredRate > target

  const wontNest = Boolean(nesting && nesting.upsPerSheet === 0)
  const canSave = Boolean(customerName && description && costing) && !wontNest

  const blockedReason = () => {
    if (wontNest) return `This layout does not nest on the ${PLANT.bedLengthMm} mm bed`
    if (!customerName) return 'Name the customer this offer is for'
    if (!costing) return 'Enter the layout, gauge and quantity to cost the offer'
    if (aboveTarget) {
      return `Offer is ${formatCurrency(offeredRate)} against a target of ${formatCurrency(target!)}`
    }
    return `Offer ${formatCurrency(offeredRate)} per piece on a landed cost of ${formatCurrency(costing.costPerPiece)}`
  }

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      onClose()
    }, 500)
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Estimation"
      subtitle="Costed from the open layout, priced on margin"
      badge={
        wontNest
          ? { label: 'Will not nest', tone: 'error' }
          : aboveTarget
            ? { label: 'Above customer target', tone: 'warning' }
            : undefined
      }
      size="xl"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!canSave}
      saveIcon={Calculator}
      saveLabel="Save estimation"
      footerNote={blockedReason()}
    >
      <FormSection title="Against">
        <FormGrid cols={3}>
          <Select
            label="Enquiry"
            placeholder="Cost without an enquiry"
            value={enquiryNo}
            onChange={(e) => setEnquiryNo(e.target.value)}
            options={SALES_ENQUIRIES.filter((e) => e.status === 'OPEN' || e.status === 'ESTIMATED').map((e) => ({
              value: e.enquiryNo,
              label: `${e.enquiryNo} — ${e.customerName}`,
            }))}
            helper="Leave blank to cost a design nobody has asked for yet"
          />
          <Input
            label="Customer"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer or prospect"
          />
          <Input
            label="Valid until"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
          <Input
            label="Product description"
            required
            className="md:col-span-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Specification">
        <FormGrid cols={3}>
          <MaterialPicker
            label="Material"
            required
            placeholder="Select polymer"
            value={material}
            onChange={(next) => setMaterial(next as MaterialType)}
            options={MATERIAL_OPTIONS}
          />
          <Input label="Thickness" unit="µm" required type="number" value={micron} onChange={(e) => setMicron(e.target.value)} />
          <Input label="Quantity" unit="pieces" required type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Input label="Open length" unit="mm" required type="number" value={length} onChange={(e) => setLength(e.target.value)} />
          <Input label="Open width" unit="mm" required type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
          <DerivedField
            label="Cavity ups per sheet"
            value={nesting ? `${nesting.upsPerSheet} (${nesting.across} × ${nesting.down})` : '—'}
            emphasis
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Derived cost">
        <FormGrid cols={3}>
          <DerivedField label="Sheets required" value={costing ? formatNumber(costing.sheets) : '—'} />
          <DerivedField label="Gross reel weight" value={costing ? formatKg(costing.grossWeightKg) : '—'} emphasis />
          <DerivedField label="Weight per piece" value={costing ? `${formatNumber(costing.gramsPerPiece, 2)} g` : '—'} />
          <DerivedField
            label={grade ? `Material @ ${formatCurrency(grade.ratePerKg, 0)}/kg` : 'Material'}
            value={costing ? formatCurrency(costing.materialCost, 0) : '—'}
          />
          <DerivedField
            label="Less scrap recovery"
            value={costing ? `− ${formatCurrency(costing.scrapRecovery, 0)}` : '—'}
          />
          <DerivedField
            label="Skeleton"
            value={costing && nesting ? `${formatPercent(nesting.skeletonFraction * 100)} · ${formatKg(costing.skeletonKg)}` : '—'}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Offer">
        <FormGrid cols={3}>
          <Input
            label="Conversion rate"
            unit="₹ / piece"
            type="number"
            step="0.01"
            value={conversion}
            onChange={(e) => setConversion(e.target.value)}
            helper="Machine, labour and overhead per piece"
          />
          <Input
            label="Margin"
            unit="%"
            type="number"
            step="0.5"
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            error={marginNum < 0 ? 'A negative margin quotes below cost' : false}
          />
          <DerivedField
            label="Landed cost per piece"
            value={costing ? formatCurrency(costing.costPerPiece) : '—'}
          />
          <DerivedField
            label="Customer target"
            value={target !== null ? formatCurrency(target) : 'Not stated'}
          />
          <DerivedField
            label="Offered rate per piece"
            value={costing ? formatCurrency(offeredRate) : '—'}
            emphasis
          />
          <DerivedField
            label="Order value"
            value={orderValue > 0 ? formatCurrency(orderValue, 0) : '—'}
            emphasis
          />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

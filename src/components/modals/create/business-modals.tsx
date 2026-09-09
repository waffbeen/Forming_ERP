'use client'

import * as React from 'react'
import { StandardModal } from '@/components/modals'
import { BinModal } from './system-modals'
import {
  Checkbox, DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate, Textarea,
} from '@/components/ui'
import {
  ARTWORKS, BINS, CATEGORIES, JOB_CARDS, MATERIALS, PRODUCTS, SUPPLIERS,
} from '@/data'
import { PLANT } from '@/config/plant'
import { calculateNesting } from '@/lib/layout-calc'
import { formatCurrency, formatNumber } from '@/lib/utils'
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

// ------------------------------------------------------------------ Supplier

export function SupplierModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    name ? { value: `NEW-SUP-${Date.now()}`, label: name } : null,
  )
  const [name, setName] = React.useState(initialName ?? '')
  const [city, setCity] = React.useState('')
  const [gstin, setGstin] = React.useState('')
  const [contact, setContact] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [leadTime, setLeadTime] = React.useState('')
  const [terms, setTerms] = React.useState('30 days')
  const [materials, setMaterials] = React.useState<string[]>([])

  const toggle = (m: string) =>
    setMaterials((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Supplier"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!name}
      saveLabel="Create supplier"
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Supplier name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Supreme Polymers" />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Vapi" />
          <Input label="GSTIN" mono value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="24AABCS4411K1ZR" />
          <DerivedField label="Supplier code" value="Assigned on save" />
        </FormGrid>
      </FormSection>

      <FormSection title="Contact">
        <FormGrid cols={2}>
          <Input label="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Rakesh Shah" />
          <Input label="Contact no" mono value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98250 41122" />
        </FormGrid>
      </FormSection>

      <FormSection title="Supply terms">
        <FormGrid cols={2}>
          <Input
            label="Lead time"
            unit="days"
            type="number"
            value={leadTime}
            onChange={(e) => setLeadTime(e.target.value)}
            helper="Used as the planning buffer on reel requisitions"
          />
          <Select
            label="Payment terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            options={[
              { value: '15 days', label: '15 days' },
              { value: '30 days', label: '30 days' },
              { value: '45 days', label: '45 days' },
              { value: '60 days', label: '60 days' },
            ]}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Approved for">
        <div className="flex flex-wrap gap-1.5">
          {MATERIALS.map((m) => {
            const on = materials.includes(m.materialType)
            return (
              <button
                key={m.materialType}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(m.materialType)}
                className={
                  on
                    ? 'rounded-full border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-on-primary'
                    : 'rounded-full border border-bd-default px-2.5 py-1 text-xs text-fg-muted hover:bg-bg-hover hover:text-fg-default'
                }
              >
                {m.materialType}
              </button>
            )
          })}
        </div>
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------------ Category

export function CategoryModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    name ? { value: `NEW-CAT-${Date.now()}`, label: name } : null,
  )
  const [name, setName] = React.useState(initialName ?? '')
  const [code, setCode] = React.useState('')
  const [parent, setParent] = React.useState('')
  const [appliesTo, setAppliesTo] = React.useState('ITEM')
  const [description, setDescription] = React.useState('')

  /* Only top-level categories may be a parent, so the tree stays two deep. */
  const parentOptions = CATEGORIES.filter((c) => !c.parentCategoryId)

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Category"
      size="md"
      onSave={save}
      saving={saving}
      saveDisabled={!name || !code}
      saveLabel="Create category"
    >
      <FormSection title="Category">
        <FormGrid cols={1}>
          <Input label="Category code" required mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="CAT-RM-PVC" />
          <Input label="Category name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="PVC reels" />
          <Select
            label="Parent category"
            placeholder="None, this is a top-level category"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            options={parentOptions.map((c) => ({ value: c.categoryId, label: c.categoryName }))}
          />
          <Select
            label="Applies to"
            required
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value)}
            options={[
              { value: 'ITEM', label: 'Items — things the plant buys' },
              { value: 'PRODUCT', label: 'Products — things the plant makes' },
              { value: 'BOTH', label: 'Both' },
            ]}
          />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ---------------------------------------------------------------------- Item

export function ItemModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    name ? { value: `NEW-ITM-${Date.now()}`, label: name } : null,
  )
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState(initialName ?? '')
  const [itemType, setItemType] = React.useState('')
  const [categoryId, setCategoryId] = React.useState('')
  const [uom, setUom] = React.useState('')
  const [supplierId, setSupplierId] = React.useState('')
  const [binId, setBinId] = React.useState('')
  const [reorder, setReorder] = React.useState('')
  const [rate, setRate] = React.useState('')
  const [hsn, setHsn] = React.useState('')

  const isRawMaterial = itemType === 'RAW_MATERIAL'

  /* Reels are bought by weight and nothing else, so the UOM is not a choice. */
  React.useEffect(() => {
    if (isRawMaterial) setUom('KG')
  }, [isRawMaterial])

  const itemCategories = CATEGORIES.filter((c) => c.appliesTo !== 'PRODUCT')
  const supplierOptions = SUPPLIERS.filter((s) => s.status === 'ACTIVE')

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Item"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!code || !name || !itemType || !uom}
      saveLabel="Create item"
      footerNote={
        rate && reorder
          ? `Reorder value ${formatCurrency((Number(rate) || 0) * (Number(reorder) || 0), 0)}`
          : undefined
      }
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Item code" required mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="RM-PVC-300C" />
          <Input label="HSN code" mono value={hsn} onChange={(e) => setHsn(e.target.value)} placeholder="39204900" />
          <Input
            label="Item name"
            required
            className="sm:col-span-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="PVC reel 300 µm clear, 620 mm deckle"
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Classification">
        <FormGrid cols={3}>
          <Select
            label="Item type"
            required
            placeholder="Select type"
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            options={[
              { value: 'RAW_MATERIAL', label: 'Raw material' },
              { value: 'CONSUMABLE', label: 'Consumable' },
              { value: 'PACKING', label: 'Packing' },
              { value: 'SPARE', label: 'Spare' },
            ]}
          />
          <SelectWithCreate
            label="Category"
            placeholder="Select or add category"
            value={categoryId}
            onChange={setCategoryId}
            options={itemCategories.map((c) => ({ value: c.categoryId, label: c.categoryName }))}
            createLabel="New category"
            renderCreateModal={(props) => <CategoryModal {...props} />}
          />
          {isRawMaterial ? (
            <DerivedField label="Unit of measure" value="KG" emphasis />
          ) : (
            <Select
              label="Unit of measure"
              required
              placeholder="Select UOM"
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              options={[
                { value: 'NOS', label: 'Numbers' },
                { value: 'KG', label: 'Kilograms' },
                { value: 'MTR', label: 'Metres' },
                { value: 'LTR', label: 'Litres' },
                { value: 'BOX', label: 'Boxes' },
              ]}
            />
          )}
        </FormGrid>
      </FormSection>

      <FormSection title="Sourcing and stock">
        <FormGrid cols={2}>
          <SelectWithCreate
            label="Default supplier"
            placeholder="None"
            value={supplierId}
            onChange={setSupplierId}
            options={supplierOptions.map((s) => ({ value: s.supplierId, label: `${s.supplierName} — ${s.leadTimeDays} day lead` }))}
            createLabel="New supplier"
            renderCreateModal={(props) => <SupplierModal {...props} />}
          />
          <SelectWithCreate
            label="Default bin"
            placeholder="None"
            value={binId}
            onChange={setBinId}
            options={BINS.map((b) => ({ value: b.binId, label: `${b.binCode} — ${b.binName}` }))}
            createLabel="New bin"
            renderCreateModal={(props) => <BinModal {...props} />}
          />
          <Input label="Reorder level" unit={uom || 'unit'} type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} />
          <Input label="Rate" unit={`₹ / ${uom || 'unit'}`} type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------------- Product

export function ProductModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [jobCardNo, setJobCardNo] = React.useState('')
  const [productName, setProductName] = React.useState('')
  const [categoryId, setCategoryId] = React.useState('')
  const [isSafetyStock, setIsSafetyStock] = React.useState(false)
  const [safetyQty, setSafetyQty] = React.useState('')

  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const artwork = ARTWORKS.find((a) => a.artworkCode === job?.artworkCode)
  const material = MATERIALS.find((m) => m.materialType === job?.materialType)

  const nesting = artwork
    ? calculateNesting({
        openLengthMm: artwork.openLengthMm,
        openWidthMm: artwork.openWidthMm,
        deckleWidthMm: 620,
        bedPitchMm: PLANT.bedLengthMm,
      })
    : null

  /* Weight and cost are read off the completed job, not estimated again. */
  const gramsPerPiece =
    job && nesting && material && nesting.upsPerSheet > 0
      ? ((job.estReelWeightKg - job.estTrimWasteKg) * 1000) / (job.requiredSheetsQty * nesting.upsPerSheet)
      : 0
  const costPerPiece =
    job && material
      ? (job.estReelWeightKg * material.ratePerKg -
          job.estTrimWasteKg * material.scrapRatePerKg +
          job.targetPiecesQty * 0.85) /
        job.targetPiecesQty
      : 0

  /* A repeat of an artwork that already has a product should reuse that one
     rather than creating a second record for the same design. */
  const existing = job
    ? (PRODUCTS.find((p) => p.artworkCode === job.artworkCode)?.productCode ?? null)
    : null

  React.useEffect(() => {
    if (artwork && !productName) setProductName(artwork.clientProductRef)
  }, [artwork, productName])

  const productCategories = CATEGORIES.filter((c) => c.appliesTo !== 'ITEM')

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Product"
      badge={existing ? { label: 'Artwork already has a product', tone: 'warning' } : undefined}
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!jobCardNo || !productName || Boolean(existing)}
      saveLabel="Create product"
      footerNote={
        existing
          ? `Reuse ${existing} instead of creating a duplicate`
          : costPerPiece > 0
            ? `Standard cost ${formatCurrency(costPerPiece)} per piece`
            : 'Pick a completed job card to carry its specification over'
      }
    >
      <FormSection title="Source job">
        <FormGrid cols={2}>
          <Select
            label="Completed job card"
            required
            placeholder="Select job card"
            value={jobCardNo}
            onChange={(e) => setJobCardNo(e.target.value)}
            options={JOB_CARDS.map((j) => ({
              value: j.jobCardNo,
              label: `${j.jobCardNo} — ${j.customerName} (${j.artworkCode})`,
            }))}
            error={existing ? `${existing} already covers this artwork` : false}
          />
          <DerivedField label="Client" value={job?.customerName ?? '—'} />
          <DerivedField label="Artwork" value={job?.artworkCode ?? '—'} />
          <DerivedField label="Product code" value="Assigned on save" />
        </FormGrid>
      </FormSection>

      <FormSection title="Product">
        <FormGrid cols={2}>
          <Input
            label="Product name"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ice cream tray 750 ml, clear"
          />
          <SelectWithCreate
            label="Category"
            placeholder="Select or add category"
            value={categoryId}
            onChange={setCategoryId}
            options={productCategories.map((c) => ({ value: c.categoryId, label: c.categoryName }))}
            createLabel="New category"
            renderCreateModal={(props) => <CategoryModal {...props} />}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Carried from the job">
        <FormGrid cols={3}>
          <DerivedField
            label="Material"
            value={job ? `${job.materialType} · ${job.thicknessMicrons} µm` : '—'}
          />
          <DerivedField label="Cavity ups per sheet" value={nesting ? String(nesting.upsPerSheet) : '—'} />
          <DerivedField
            label="Weight per piece"
            value={gramsPerPiece > 0 ? `${formatNumber(gramsPerPiece, 2)} g` : '—'}
          />
          <DerivedField
            label="Standard cost"
            value={costPerPiece > 0 ? formatCurrency(costPerPiece) : '—'}
            emphasis
          />
          <DerivedField label="Origin job card" value={job?.jobCardNo ?? '—'} />
          <DerivedField label="Times produced" value="1 on creation" />
        </FormGrid>
      </FormSection>

      <FormSection title="Stocking">
        <Checkbox
          label="Hold as safety stock"
          hint="Only the three or four generic trays are stocked; everything else is made to order"
          checked={isSafetyStock}
          onChange={(e) => setIsSafetyStock(e.target.checked)}
        />
        {isSafetyStock ? (
          <div className="mt-3">
            <FormGrid cols={2}>
              <Input
                label="Safety stock level"
                unit="pieces"
                type="number"
                value={safetyQty}
                onChange={(e) => setSafetyQty(e.target.value)}
                helper="A shortfall against this level shows on the product master"
              />
            </FormGrid>
          </div>
        ) : null}
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------------- Process

export function ProcessModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState('')
  const [stage, setStage] = React.useState('')
  const [department, setDepartment] = React.useState('')
  const [typeOfCharges, setTypeOfCharges] = React.useState('PER_PIECE')
  const [rate, setRate] = React.useState('')
  const [startUnit, setStartUnit] = React.useState('')
  const [endUnit, setEndUnit] = React.useState('')
  const [stdTime, setStdTime] = React.useState('')
  const [waste, setWaste] = React.useState('')
  const [toolRequired, setToolRequired] = React.useState(false)
  const [clearance, setClearance] = React.useState(false)
  const [fpa, setFpa] = React.useState(false)

  /* Forming and punching are gated by SOP; default the flags on when chosen. */
  React.useEffect(() => {
    const gated = stage === 'FORMING' || stage === 'PUNCHING'
    setClearance(gated)
    setFpa(gated)
    setToolRequired(gated)
  }, [stage])

  const UNITS = [
    { value: 'KG', label: 'Kilograms' },
    { value: 'SHEET', label: 'Sheets' },
    { value: 'PIECE', label: 'Pieces' },
    { value: 'BOX', label: 'Boxes' },
  ]

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Process"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!code || !name || !stage}
      saveLabel="Create process"
      footerNote={
        startUnit && endUnit ? `Converts ${startUnit} to ${endUnit}` : 'Set the start and end units'
      }
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Process code" required mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="PRC-020" />
          <Input label="Process name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Forming of trays" />
          <Select
            label="Stage"
            required
            placeholder="Select stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            options={[
              { value: 'FORMING', label: 'Forming' },
              { value: 'PUNCHING', label: 'Punching' },
              { value: 'PACKING', label: 'Packing' },
              { value: 'QC', label: 'Quality' },
              { value: 'DISPATCH', label: 'Dispatch' },
              { value: 'RECYCLING', label: 'Recycling' },
            ]}
          />
          <Select
            label="Department"
            placeholder="Select department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { value: 'Production', label: 'Production' },
              { value: 'Quality', label: 'Quality' },
              { value: 'Stores', label: 'Stores' },
              { value: 'Dispatch', label: 'Dispatch' },
            ]}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Unit conversion">
        <FormGrid cols={2}>
          <Select label="Start unit" placeholder="Consumes" value={startUnit} onChange={(e) => setStartUnit(e.target.value)} options={UNITS} />
          <Select label="End unit" placeholder="Produces" value={endUnit} onChange={(e) => setEndUnit(e.target.value)} options={UNITS} />
        </FormGrid>
      </FormSection>

      <FormSection title="Costing">
        <FormGrid cols={3}>
          <Select
            label="Type of charges"
            value={typeOfCharges}
            onChange={(e) => setTypeOfCharges(e.target.value)}
            options={[
              { value: 'PER_PIECE', label: 'Per piece' },
              { value: 'PER_SHEET', label: 'Per sheet' },
              { value: 'PER_HOUR', label: 'Per hour' },
            ]}
          />
          <Input label="Rate" unit="₹" type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          <Input label="Standard time" unit="minutes" type="number" value={stdTime} onChange={(e) => setStdTime(e.target.value)} />
          <Input label="Process waste" unit="%" type="number" step="0.1" value={waste} onChange={(e) => setWaste(e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Gates">
        <FormGrid cols={3}>
          <Checkbox label="Tool required" hint="A die must be mounted" checked={toolRequired} onChange={(e) => setToolRequired(e.target.checked)} />
          <Checkbox label="Line clearance" hint="QC clears the previous job first" checked={clearance} onChange={(e) => setClearance(e.target.checked)} />
          <Checkbox label="First piece approval" hint="FPA before the run, and after any power failure" checked={fpa} onChange={(e) => setFpa(e.target.checked)} />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

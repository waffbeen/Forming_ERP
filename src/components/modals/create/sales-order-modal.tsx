'use client'

import * as React from 'react'
import { StandardModal } from '@/components/modals'
import { CustomerModal } from './master-modals'
import {
  DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate, Textarea,
} from '@/components/ui'
import { ARTWORKS, CUSTOMERS, MATERIALS } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateCosting, calculateNesting } from '@/lib/layout-calc'
import { formatCurrency, formatKg, formatNumber, formatPercent } from '@/lib/utils'

const CONVERSION_PER_PC = 0.85

export function SalesOrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [customerId, setCustomerId] = React.useState('')
  const [artworkCode, setArtworkCode] = React.useState('')
  const [poRef, setPoRef] = React.useState('')
  const [qty, setQty] = React.useState('')
  const [rate, setRate] = React.useState('')
  const [deliveryDate, setDeliveryDate] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  /* Only artworks belonging to the chosen customer can be ordered, which is
     what stops a PO description being matched to the wrong drawing. */
  const artworkOptions = React.useMemo(
    () => ARTWORKS.filter((a) => !customerId || a.customerId === customerId),
    [customerId],
  )

  const artwork = ARTWORKS.find((a) => a.artworkCode === artworkCode)
  const material = MATERIALS.find((m) => m.materialType === artwork?.materialType)
  const qtyNum = Number(qty) || 0
  const rateNum = Number(rate) || 0

  const nesting = artwork
    ? calculateNesting({
        openLengthMm: artwork.openLengthMm,
        openWidthMm: artwork.openWidthMm,
        deckleWidthMm: DECKLE_MM,
        bedPitchMm: PLANT.bedLengthMm,
      })
    : null

  const costing =
    artwork && material && nesting && qtyNum > 0
      ? calculateCosting({
          targetPiecesQty: qtyNum,
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
      : null

  const margin = costing && rateNum > 0 ? ((rateNum - costing.costPerPiece) / rateNum) * 100 : null
  const canSave = Boolean(customerId && artworkCode && qtyNum > 0 && deliveryDate)

  const reset = () => {
    setCustomerId('')
    setArtworkCode('')
    setPoRef('')
    setQty('')
    setRate('')
    setDeliveryDate('')
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

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Sales Order"
      badge={artwork?.approved === false ? { label: 'Artwork not approved', tone: 'warning' } : undefined}
      size="xl"
      onSave={handleSave}
      saveLabel="Create Sales Order"
      saving={saving}
      saveDisabled={!canSave}
      footerNote={
        costing ? `Landed cost ${formatCurrency(costing.costPerPiece)} per tray` : 'Pick an artwork and quantity to cost the order'
      }
    >
      <FormSection title="Order">
        <FormGrid cols={3}>
          <SelectWithCreate
            label="Customer"
            required
            placeholder="Select or add customer"
            value={customerId}
            onChange={(next) => {
              setCustomerId(next)
              // The artwork list is scoped to the customer, so clear it.
              setArtworkCode('')
            }}
            options={CUSTOMERS.map((c) => ({ value: c.customerId, label: `${c.customerName} — ${c.city}` }))}
            createLabel="New client"
            renderCreateModal={(props) => <CustomerModal {...props} />}
          />
          <Select
            label="Artwork code"
            required
            placeholder={customerId ? 'Select artwork' : 'Select a customer first'}
            disabled={!customerId}
            value={artworkCode}
            onChange={(e) => setArtworkCode(e.target.value)}
            options={artworkOptions.map((a) => ({
              value: a.artworkCode,
              label: `${a.artworkCode} — ${a.clientProductRef}`,
            }))}
            helper={artwork && !artwork.approved ? 'Drawing approval is still pending' : undefined}
          />
          <Input
            label="Client PO reference"
            mono
            placeholder="PO/VAD/26-27/1188"
            value={poRef}
            onChange={(e) => setPoRef(e.target.value)}
          />
          <Input
            label="Order quantity"
            unit="pieces"
            required
            type="number"
            min={1}
            placeholder="25000"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Input
            label="Agreed rate"
            unit="₹ / piece"
            type="number"
            step="0.01"
            min={0}
            placeholder="2.85"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            helper={
              margin !== null
                ? `Margin ${formatPercent(margin)} against derived cost`
                : undefined
            }
            error={margin !== null && margin < 0 ? 'Rate is below the landed cost' : false}
          />
          <Input
            label="Delivery date"
            required
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Artwork specification"
      >
        <FormGrid cols={3}>
          <DerivedField label="Material" value={artwork ? `${artwork.materialType} · ${artwork.thicknessMicrons} µm` : '—'} />
          <DerivedField
            label="Open layout (expanded)"
            value={artwork ? `${artwork.openLengthMm} × ${artwork.openWidthMm} mm` : '—'}
          />
          <DerivedField label="Formed depth" value={artwork ? `${artwork.depthMm} mm` : '—'} />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Auto-costing"
      >
        <FormGrid cols={3}>
          <DerivedField
            label="Cavity ups per sheet"
            value={nesting ? `${nesting.upsPerSheet} (${nesting.across} × ${nesting.down})` : '—'}
            emphasis
          />
          <DerivedField label="Sheets required" value={costing ? formatNumber(costing.sheets) : '—'} />
          <DerivedField label="Reel length" value={costing ? `${formatNumber(costing.reelLengthM, 1)} m` : '—'} />
          <DerivedField
            label="Gross reel weight"
            value={costing ? formatKg(costing.grossWeightKg) : '—'}
            emphasis
          />
          <DerivedField
            label="Skeleton allowance"
            value={
              costing && nesting
                ? `${formatPercent(nesting.skeletonFraction * 100)} · ${formatKg(costing.skeletonKg)}`
                : '—'
            }
          />
          <DerivedField
            label="Weight per tray"
            value={costing ? `${formatNumber(costing.gramsPerPiece, 2)} g` : '—'}
          />
          <DerivedField
            label={material ? `Material @ ${formatCurrency(material.ratePerKg, 0)}/kg` : 'Material'}
            value={costing ? formatCurrency(costing.materialCost, 0) : '—'}
          />
          <DerivedField
            label="Less scrap recovery"
            value={costing ? `− ${formatCurrency(costing.scrapRecovery, 0)}` : '—'}
          />
          <DerivedField
            label="Landed cost per tray"
            value={costing ? formatCurrency(costing.costPerPiece) : '—'}
            emphasis
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Notes">
        <Textarea
          label="Internal notes"
          placeholder="Anything the planner needs to know before the job card is released."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormSection>
    </StandardModal>
  )
}

'use client'

import * as React from 'react'
import { ClipboardList } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import { MachinePicker } from './master-pickers'
import { DerivedField, FormGrid, FormSection, Input, Select } from '@/components/ui'
import { NestingDiagram } from '@/components/forming'
import { ARTWORKS, MACHINES, MATERIALS, REELS, SALES_ORDERS } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateCosting, calculateNesting } from '@/lib/layout-calc'
import { formatKg, formatMicrons, formatNumber, formatPercent } from '@/lib/utils'

export function JobCardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [soNumber, setSoNumber] = React.useState('')
  const [targetQty, setTargetQty] = React.useState('')
  const [formingMachine, setFormingMachine] = React.useState('')
  const [cuttingMachine, setCuttingMachine] = React.useState('')
  const [reelId, setReelId] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const order = SALES_ORDERS.find((o) => o.soNumber === soNumber)
  const artwork = ARTWORKS.find((a) => a.artworkCode === order?.artworkCode)
  const material = MATERIALS.find((m) => m.materialType === artwork?.materialType)

  /* Default the job quantity to the ordered quantity when an order is picked,
     since a partial run is the exception rather than the rule. */
  React.useEffect(() => {
    if (order) setTargetQty(String(order.orderQtyPcs))
  }, [order])

  const qtyNum = Number(targetQty) || 0

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
          conversionRatePerPc: 0.85,
        })
      : null

  /* Only approved reels of the right polymer and thickness may be requisitioned. */
  const reelOptions = REELS.filter(
    (r) =>
      r.qcStatus === 'APPROVED' &&
      r.netWeightKg > 0 &&
      (!artwork || r.materialType === artwork.materialType),
  )
  const reel = REELS.find((r) => r.reelId === reelId)
  const reelShort = Boolean(reel && costing && reel.netWeightKg < costing.grossWeightKg)

  const canSave = Boolean(soNumber && qtyNum > 0 && formingMachine && cuttingMachine)

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      setSoNumber('')
      setTargetQty('')
      setFormingMachine('')
      setCuttingMachine('')
      setReelId('')
      onClose()
    }, 500)
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Release Job Card"
      badge={order ? { label: order.customerName, tone: 'primary' } : undefined}
      size="master"
      onSave={handleSave}
      saveLabel="Release Job Card"
      saving={saving}
      saveDisabled={!canSave}
      footerNote={
        costing ? `Requisition ${formatKg(costing.grossWeightKg)} of ${artwork?.materialType}` : 'Pick a sales order to plan the run'
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div>
          <FormSection title="Source order">
            <FormGrid cols={2}>
              <Select
                label="Sales order"
                required
                placeholder="Select a released order"
                value={soNumber}
                onChange={(e) => setSoNumber(e.target.value)}
                options={SALES_ORDERS.filter((o) => o.status !== 'DISPATCHED').map((o) => ({
                  value: o.soNumber,
                  label: `${o.soNumber} — ${o.customerName} (${formatNumber(o.orderQtyPcs)} pcs)`,
                }))}
              />
              <Input
                label="Target quantity"
                unit="pieces"
                required
                type="number"
                min={1}
                value={targetQty}
                onChange={(e) => setTargetQty(e.target.value)}
                helper={
                  order && qtyNum !== order.orderQtyPcs
                    ? `Order is for ${formatNumber(order.orderQtyPcs)} pieces`
                    : undefined
                }
              />
              <DerivedField label="Artwork" value={artwork?.artworkCode ?? '—'} />
              <DerivedField
                label="Material"
                value={artwork ? `${artwork.materialType} · ${formatMicrons(artwork.thicknessMicrons)}` : '—'}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Machine assignment">
            <FormGrid cols={2}>
              <MachinePicker
                label="Forming machine"
                required
                placeholder="Select forming line"
                value={formingMachine}
                onChange={setFormingMachine}
                options={MACHINES.filter((m) => m.type === 'FORMING').map((m) => ({
                  value: m.machineCode,
                  label: `${m.machineCode} — ${m.machineName}${m.status === 'MAINTENANCE' ? ' (under maintenance)' : ''}`,
                }))}
              />
              <MachinePicker
                label="Cutting machine"
                required
                placeholder="Select press"
                value={cuttingMachine}
                onChange={setCuttingMachine}
                options={MACHINES.filter((m) => m.type === 'CUTTING').map((m) => ({
                  value: m.machineCode,
                  label: `${m.machineCode} — ${m.machineName}`,
                }))}
              />
            </FormGrid>
          </FormSection>

          <FormSection
            title="Reel requisition"
          >
            <FormGrid cols={2}>
              <Select
                label="Issue reel"
                placeholder={artwork ? 'Select an approved reel' : 'Pick a sales order first'}
                disabled={!artwork}
                value={reelId}
                onChange={(e) => setReelId(e.target.value)}
                options={reelOptions.map((r) => ({
                  value: r.reelId,
                  label: `${r.reelId} — ${r.materialType} ${r.thicknessMicrons} µm · ${formatKg(r.netWeightKg)} available`,
                }))}
                error={reelShort ? 'This reel does not cover the full run' : false}
                helper={
                  !reelShort && reel && costing
                    ? `Leaves ${formatKg(reel.netWeightKg - costing.grossWeightKg)} on the roll`
                    : undefined
                }
              />
              <DerivedField
                label="Required weight"
                value={costing ? formatKg(costing.grossWeightKg) : '—'}
                emphasis
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Derived plan">
            <FormGrid cols={3}>
              <DerivedField label="Ups per sheet" value={nesting ? String(nesting.upsPerSheet) : '—'} emphasis />
              <DerivedField label="Sheets required" value={costing ? formatNumber(costing.sheets) : '—'} />
              <DerivedField label="Reel length" value={costing ? `${formatNumber(costing.reelLengthM, 1)} m` : '—'} />
              <DerivedField
                label="Sheet utilisation"
                value={nesting ? formatPercent(nesting.utilisation * 100) : '—'}
              />
              <DerivedField label="Estimated skeleton" value={costing ? formatKg(costing.skeletonKg) : '—'} />
              <DerivedField
                label="Cutting strokes"
                value={costing ? formatNumber(Math.ceil(costing.sheets / PLANT.sheetsPerStroke)) : '—'}
              />
            </FormGrid>
          </FormSection>
        </div>

        <aside>
          <h4 className="label-caps mb-2.5 border-b border-bd-subtle pb-1.5">Nesting preview</h4>
          {artwork && nesting ? (
            <NestingDiagram
              openLengthMm={artwork.openLengthMm}
              openWidthMm={artwork.openWidthMm}
              deckleWidthMm={DECKLE_MM}
              bedPitchMm={PLANT.bedLengthMm}
              skeletonKg={costing?.skeletonKg}
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-bd-strong text-center">
              <ClipboardList className="h-6 w-6 text-fg-subtle" />
              <p className="max-w-[26ch] text-xs text-fg-subtle">
                Select a sales order to see how its tray nests on the bed.
              </p>
            </div>
          )}
        </aside>
      </div>
    </StandardModal>
  )
}

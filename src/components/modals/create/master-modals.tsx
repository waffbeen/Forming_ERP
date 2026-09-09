'use client'

import * as React from 'react'
import { StandardModal } from '@/components/modals'
import {
  Checkbox, DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate, Textarea,
} from '@/components/ui'
import { NestingDiagram } from '@/components/forming'
import { ARTWORKS, CUSTOMERS, MACHINES, MATERIALS } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateNesting } from '@/lib/layout-calc'
import { formatKg, formatNumber, formatPercent } from '@/lib/utils'

export interface MasterModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Set when the modal was opened from a dropdown's add button. The new record
   * is handed back so the field that opened it can select it straight away.
   */
  onCreated?: (option: { value: string; label: string }) => void
  /** Whatever the user had typed into that dropdown before opening this. */
  initialName?: string
}

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

// ------------------------------------------------------------------ Customer

export function CustomerModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    name ? { value: `NEW-CUS-${Date.now()}`, label: name } : null,
  )
  const [name, setName] = React.useState(initialName ?? '')
  const [segment, setSegment] = React.useState('')
  const [city, setCity] = React.useState('')
  const [gstin, setGstin] = React.useState('')
  const [terms, setTerms] = React.useState('45 days')

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Customer"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!name || !segment}
      saveLabel="Create customer"
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Customer name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Vadilal Industries" />
          <Select
            label="Segment"
            required
            placeholder="Select segment"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            options={[
              { value: 'Pharmaceutical', label: 'Pharmaceutical' },
              { value: 'Food', label: 'Food' },
              { value: 'Cosmetics', label: 'Cosmetics' },
            ]}
            helper={
              segment === 'Pharmaceutical'
                ? 'Every dispatch will require a COA and a sealed audit trail'
                : segment === 'Food'
                  ? 'Migration testing is added to the COA'
                  : undefined
            }
          />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ahmedabad" />
          <Input label="GSTIN" mono value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="24AABCV1234K1ZP" />
        </FormGrid>
      </FormSection>

      <FormSection title="Commercial">
        <FormGrid cols={2}>
          <Select
            label="Payment terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            options={[
              { value: '30 days', label: '30 days' },
              { value: '45 days', label: '45 days' },
              { value: '60 days', label: '60 days' },
              { value: 'Advance', label: 'Against advance' },
            ]}
          />
          <DerivedField label="Customer code" value="Assigned on save" />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------------- Artwork

export function ArtworkModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [customerId, setCustomerId] = React.useState('')
  const [productRef, setProductRef] = React.useState('')
  const [trayType, setTrayType] = React.useState('')
  const [materialType, setMaterialType] = React.useState('')
  const [thickness, setThickness] = React.useState('')
  const [openLength, setOpenLength] = React.useState('')
  const [openWidth, setOpenWidth] = React.useState('')
  const [depth, setDepth] = React.useState('')
  const [drawingRef, setDrawingRef] = React.useState('')
  const [approved, setApproved] = React.useState(false)

  const length = Number(openLength) || 0
  const width = Number(openWidth) || 0
  const thicknessNum = Number(thickness) || 0
  const material = MATERIALS.find((m) => m.materialType === materialType)

  const nesting =
    length > 0 && width > 0
      ? calculateNesting({
          openLengthMm: length,
          openWidthMm: width,
          deckleWidthMm: DECKLE_MM,
          bedPitchMm: PLANT.bedLengthMm,
        })
      : null

  const gramsPerTray =
    nesting && material && thicknessNum > 0 && nesting.upsPerSheet > 0
      ? ((DECKLE_MM / 10) * (PLANT.bedLengthMm / 10) * (thicknessNum / 10000) * material.densityGCm3 * nesting.utilisation) /
        nesting.upsPerSheet
      : 0

  const thicknessOutOfRange =
    Boolean(material && thicknessNum > 0 && (thicknessNum < material.minMicrons || thicknessNum > material.maxMicrons))

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Artwork"
      size="master"
      onSave={save}
      saving={saving}
      saveDisabled={!customerId || !productRef || !length || !width || thicknessOutOfRange}
      saveLabel="Create artwork"
      footerNote={nesting ? `${nesting.upsPerSheet} ups on the standard bed` : 'Enter the open layout to nest it'}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div>
          <FormSection title="Ownership">
            <FormGrid cols={2}>
              <SelectWithCreate
                label="Customer"
                required
                placeholder="Select or add customer"
                value={customerId}
                onChange={setCustomerId}
                options={CUSTOMERS.map((c) => ({ value: c.customerId, label: c.customerName }))}
            createLabel="New client"
            renderCreateModal={(props) => <CustomerModal {...props} />}
          />
              <Input
                label="Customer reference"
                required
                value={productRef}
                onChange={(e) => setProductRef(e.target.value)}
                placeholder="Ice cream tray 750 ml"
                helper="However the customer describes it on their PO"
              />
              <Input
                label="Drawing reference"
                mono
                value={drawingRef}
                onChange={(e) => setDrawingRef(e.target.value)}
                placeholder="DWG/VAD/0312-R3"
              />
              <DerivedField label="Artwork code" value="Assigned on save" />
            </FormGrid>
          </FormSection>

          <FormSection title="Material">
            <FormGrid cols={3}>
              <Select
                label="Polymer"
                required
                placeholder="Select polymer"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                options={MATERIALS.map((m) => ({ value: m.materialType, label: `${m.materialType} — ${m.grade}` }))}
              />
              <Select
                label="Tray type"
                placeholder="Select colour"
                value={trayType}
                onChange={(e) => setTrayType(e.target.value)}
                options={[
                  { value: 'TRANSPARENT', label: 'Clear / transparent' },
                  { value: 'HIPS_WHITE', label: 'White HIPS' },
                  { value: 'AMBER', label: 'Amber' },
                  { value: 'GREEN', label: 'Green' },
                ]}
                helper="Colour comes from the extruder, never printed"
              />
              <Input
                label="Reel thickness"
                unit="µm"
                required
                type="number"
                min={PLANT.minMicrons}
                max={PLANT.maxMicrons}
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                error={
                  thicknessOutOfRange && material
                    ? `${material.materialType} runs ${material.minMicrons} to ${material.maxMicrons} µm`
                    : false
                }
              />
            </FormGrid>
          </FormSection>

          <FormSection
            title="Open layout"
          >
            <FormGrid cols={3}>
              <Input label="Open length" unit="mm" required type="number" step="0.1" value={openLength} onChange={(e) => setOpenLength(e.target.value)} />
              <Input label="Open width" unit="mm" required type="number" step="0.1" value={openWidth} onChange={(e) => setOpenWidth(e.target.value)} />
              <Input label="Formed depth" unit="mm" type="number" step="0.1" value={depth} onChange={(e) => setDepth(e.target.value)} />
            </FormGrid>
          </FormSection>

          <FormSection title="Derived nesting">
            <FormGrid cols={3}>
              <DerivedField
                label="Cavity ups per sheet"
                value={nesting ? `${nesting.upsPerSheet} (${nesting.across} × ${nesting.down})` : '—'}
                emphasis
              />
              <DerivedField label="Sheet utilisation" value={nesting ? formatPercent(nesting.utilisation * 100) : '—'} />
              <DerivedField label="Skeleton share" value={nesting ? formatPercent(nesting.skeletonFraction * 100) : '—'} />
              <DerivedField label="Orientation" value={nesting ? (nesting.rotated ? 'Turned 90°' : 'Upright') : '—'} />
              <DerivedField label="Weight per tray" value={gramsPerTray > 0 ? `${formatNumber(gramsPerTray, 2)} g` : '—'} />
              <DerivedField
                label="Trays per 100 kg"
                value={gramsPerTray > 0 ? formatNumber(100000 / gramsPerTray) : '—'}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Approval">
            <Checkbox
              label="Drawing approved by the customer"
              hint="Until this is ticked, orders on this artwork cannot be released to a job card"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
          </FormSection>
        </div>

        <aside>
          <h4 className="label-caps mb-2.5 border-b border-bd-subtle pb-1.5">Nesting preview</h4>
          {nesting && nesting.upsPerSheet > 0 ? (
            <NestingDiagram
              openLengthMm={length}
              openWidthMm={width}
              deckleWidthMm={DECKLE_MM}
              bedPitchMm={PLANT.bedLengthMm}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-bd-strong px-6 text-center">
              <p className="max-w-[28ch] text-xs text-fg-subtle">
                Enter an open length and width to see how the tray nests on the {PLANT.bedLengthMm} mm bed.
              </p>
            </div>
          )}
        </aside>
      </div>
    </StandardModal>
  )
}

// ------------------------------------------------------------------ Material

export function MaterialModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    grade ? { value: `NEW-MAT-${Date.now()}`, label: grade } : null,
  )
  const [polymer, setPolymer] = React.useState('')
  const [grade, setGrade] = React.useState(initialName ?? '')
  const [density, setDensity] = React.useState('')
  const [minMicrons, setMinMicrons] = React.useState(String(PLANT.minMicrons))
  const [maxMicrons, setMaxMicrons] = React.useState(String(PLANT.maxMicrons))
  const [rate, setRate] = React.useState('')
  const [scrapRate, setScrapRate] = React.useState('')

  const rateNum = Number(rate) || 0
  const scrapNum = Number(scrapRate) || 0
  const belowFloor = Number(minMicrons) < PLANT.minMicrons

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Material Grade"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!polymer || !grade || !density || belowFloor}
      saveLabel="Create grade"
    >
      <FormSection title="Grade">
        <FormGrid cols={2}>
          <Select
            label="Polymer"
            required
            placeholder="Select polymer"
            value={polymer}
            onChange={(e) => setPolymer(e.target.value)}
            options={[
              { value: 'PVC', label: 'PVC' },
              { value: 'PET', label: 'PET' },
              { value: 'HIPS', label: 'HIPS' },
              { value: 'PP', label: 'PP' },
            ]}
          />
          <Input label="Grade description" required value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Rigid PVC, pharma grade" />
          <Input
            label="Density"
            unit="g / cm³"
            required
            type="number"
            step="0.01"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            helper="PVC and PET 1.38, HIPS 1.05, PP 0.91"
          />
          <DerivedField label="Purchased in" value="Kilograms, reel form only" />
        </FormGrid>
      </FormSection>

      <FormSection title="Thickness range" description={`The plant never accepts a reel below ${PLANT.minMicrons} µm.`}>
        <FormGrid cols={2}>
          <Input
            label="Minimum"
            unit="µm"
            type="number"
            value={minMicrons}
            onChange={(e) => setMinMicrons(e.target.value)}
            error={belowFloor ? `Cannot go below the ${PLANT.minMicrons} µm plant floor` : false}
          />
          <Input label="Maximum" unit="µm" type="number" value={maxMicrons} onChange={(e) => setMaxMicrons(e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Rates">
        <FormGrid cols={3}>
          <Input label="Purchase rate" unit="₹ / kg" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          <Input label="Scrap recovery rate" unit="₹ / kg" type="number" value={scrapRate} onChange={(e) => setScrapRate(e.target.value)} />
          <DerivedField
            label="Recovery"
            value={rateNum > 0 && scrapNum > 0 ? formatPercent((scrapNum / rateNum) * 100, 0) : '—'}
          />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ---------------------------------------------------------------------- Reel

export function ReelModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [grn, setGrn] = React.useState('')
  const [supplier, setSupplier] = React.useState('')
  const [polymer, setPolymer] = React.useState('')
  const [thickness, setThickness] = React.useState('')
  const [deckle, setDeckle] = React.useState('620')
  const [weight, setWeight] = React.useState('')
  const [qcStatus, setQcStatus] = React.useState('QUARANTINE')

  const thicknessNum = Number(thickness) || 0
  const material = MATERIALS.find((m) => m.materialType === polymer)
  const belowFloor = thicknessNum > 0 && thicknessNum < PLANT.minMicrons
  const outOfGrade =
    Boolean(material && thicknessNum > 0 && (thicknessNum < material.minMicrons || thicknessNum > material.maxMicrons))

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Reel"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!grn || !polymer || !weight || belowFloor}
      saveLabel="Book reel in"
      footerNote={
        belowFloor
          ? `Below the ${PLANT.minMicrons} µm floor — this roll must be rejected`
          : 'Reel ID is issued as a barcode on save'
      }
    >
      <FormSection title="Receipt">
        <FormGrid cols={2}>
          <Input label="GRN number" required mono value={grn} onChange={(e) => setGrn(e.target.value)} placeholder="GRN-2609-0188" />
          <Input label="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supreme Polymers" />
        </FormGrid>
      </FormSection>

      <FormSection title="Reel specification">
        <FormGrid cols={2}>
          <Select
            label="Polymer"
            required
            placeholder="Select polymer"
            value={polymer}
            onChange={(e) => setPolymer(e.target.value)}
            options={MATERIALS.map((m) => ({ value: m.materialType, label: `${m.materialType} — ${m.grade}` }))}
          />
          <Input
            label="Measured thickness"
            unit="µm"
            required
            type="number"
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
            error={
              belowFloor
                ? `Below the ${PLANT.minMicrons} µm plant floor`
                : outOfGrade && material
                  ? `Outside the ${material.minMicrons} to ${material.maxMicrons} µm range for this grade`
                  : false
            }
          />
          <Input label="Deckle width" unit="mm" type="number" value={deckle} onChange={(e) => setDeckle(e.target.value)} />
          <Input
            label="Gross weight"
            unit="kg"
            required
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            helper={weight ? `Available stock rises by ${formatKg(Number(weight) || 0)} once approved` : undefined}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Incoming QC">
        <Select
          label="Bin"
          value={belowFloor ? 'REJECTED' : qcStatus}
          disabled={belowFloor}
          onChange={(e) => setQcStatus(e.target.value)}
          options={[
            { value: 'QUARANTINE', label: 'Quarantine — hold pending decision' },
            { value: 'APPROVED', label: 'Approved — release to the store' },
            { value: 'REJECTED', label: 'Rejected — return to supplier' },
          ]}
          helper={belowFloor ? 'Forced to rejected: the roll is under the plant thickness floor' : undefined}
        />
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------------- Machine

export function MachineModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    code ? { value: `NEW-MC-${Date.now()}`, label: code } : null,
  )
  const [code, setCode] = React.useState(initialName ?? '')
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState('')
  const [bedLength, setBedLength] = React.useState(String(PLANT.bedLengthMm))
  const [bedWidth, setBedWidth] = React.useState(String(PLANT.bedWidthMm))
  const [perStroke, setPerStroke] = React.useState('1')
  const [spm, setSpm] = React.useState('')
  const [status, setStatus] = React.useState('IDLE')

  const isPunching = type === 'PUNCHING'
  const throughput = (Number(perStroke) || 0) * (Number(spm) || 0) * 60

  React.useEffect(() => {
    setPerStroke(isPunching ? String(PLANT.sheetsPerStroke) : '1')
  }, [isPunching])

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Machine"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!code || !type}
      saveLabel="Create machine"
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Machine code" required mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="TF-04" />
          <Input label="Machine name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Forming Line 4" />
          <Select
            label="Stage"
            required
            placeholder="Select stage"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'FORMING', label: 'Forming' },
              { value: 'PUNCHING', label: 'Punching' },
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'IDLE', label: 'Idle' },
              { value: 'RUNNING', label: 'Running' },
              { value: 'MAINTENANCE', label: 'Under maintenance' },
            ]}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Capability">
        <FormGrid cols={3}>
          <Input label="Bed length" unit="mm" type="number" value={bedLength} onChange={(e) => setBedLength(e.target.value)} />
          <Input label="Bed width" unit="mm" type="number" value={bedWidth} onChange={(e) => setBedWidth(e.target.value)} />
          <Input
            label="Sheets per stroke"
            type="number"
            value={perStroke}
            onChange={(e) => setPerStroke(e.target.value)}
            helper={isPunching ? 'Double-sided presses run 6 + 6' : 'Forming draws one sheet per stroke'}
          />
          <Input label="Strokes per minute" type="number" value={spm} onChange={(e) => setSpm(e.target.value)} />
          <DerivedField label="Sheets per hour" value={throughput > 0 ? formatNumber(throughput) : '—'} emphasis />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ----------------------------------------------------------------------- Die

export function DieModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    code ? { value: `NEW-DIE-${Date.now()}`, label: code } : null,
  )
  const [code, setCode] = React.useState(initialName ?? '')
  const [artworkCode, setArtworkCode] = React.useState('')
  const [type, setType] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [serviceDue, setServiceDue] = React.useState('')

  const artwork = ARTWORKS.find((a) => a.artworkCode === artworkCode)
  const nesting = artwork
    ? calculateNesting({
        openLengthMm: artwork.openLengthMm,
        openWidthMm: artwork.openWidthMm,
        deckleWidthMm: DECKLE_MM,
        bedPitchMm: PLANT.bedLengthMm,
      })
    : null

  /* Punching dies wear far faster than forming dies, so their default
     interval is a fraction of the forming one. */
  React.useEffect(() => {
    if (type) setServiceDue(type === 'PUNCHING' ? '8000' : '50000')
  }, [type])

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Die"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!code || !artworkCode || !type}
      saveLabel="Create die"
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Die code" required mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="FD-0312" />
          <Select
            label="Artwork"
            required
            placeholder="Select artwork"
            value={artworkCode}
            onChange={(e) => setArtworkCode(e.target.value)}
            options={ARTWORKS.map((a) => ({ value: a.artworkCode, label: `${a.artworkCode} — ${a.clientProductRef}` }))}
          />
          <Select
            label="Stage"
            required
            placeholder="Select stage"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'FORMING', label: 'Forming — heated male and female pair' },
              { value: 'PUNCHING', label: 'Punching — cutting die' },
            ]}
          />
          <Select
            label="Location"
            placeholder="Select location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            options={[
              { value: 'Tool Room, Bay 1', label: 'Tool Room, Bay 1' },
              { value: 'Tool Room, Bay 2', label: 'Tool Room, Bay 2' },
              { value: 'Tool Room, Bay 3', label: 'Tool Room, Bay 3' },
              ...MACHINES.map((m) => ({ value: `${m.machineCode} mounted`, label: `${m.machineCode} mounted` })),
            ]}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Cavities and service">
        <FormGrid cols={3}>
          <DerivedField
            label="Cavities"
            value={nesting ? String(nesting.upsPerSheet) : '—'}
            emphasis
          />
          <Input
            label="Service interval"
            unit="strokes"
            type="number"
            value={serviceDue}
            onChange={(e) => setServiceDue(e.target.value)}
            helper={type === 'PUNCHING' ? 'Cutting edges dull quickly' : 'Heated dies hold up far longer'}
          />
          <DerivedField label="Strokes since service" value="0 on a new die" />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------------ Operator

const CERTIFICATIONS = [
  'IQC',
  'Line clearance',
  'First piece',
  'In-process',
  'FG inspection',
  'COA',
  'TF-01',
  'TF-02',
  'TF-03',
  'PN-01',
  'PN-02',
  'Sorting',
  'Carton close',
  'GRN',
  'Reel issue',
  'Scheduling',
]

export function OperatorModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [name, setName] = React.useState('')
  const [empCode, setEmpCode] = React.useState('')
  const [role, setRole] = React.useState('')
  const [shift, setShift] = React.useState('A')
  const [certs, setCerts] = React.useState<string[]>([])
  const [notes, setNotes] = React.useState('')

  const toggleCert = (cert: string) =>
    setCerts((prev) => (prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]))

  const signsGates = certs.some((c) => ['Line clearance', 'First piece', 'IQC', 'COA'].includes(c))

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Employee"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!name || !role}
      saveLabel="Create employee"
      footerNote={signsGates ? 'This person will be able to sign quality gates' : undefined}
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunita Rane" />
          <Input label="Employee code" mono value={empCode} onChange={(e) => setEmpCode(e.target.value)} placeholder="EMP-014" />
          <Select
            label="Role"
            required
            placeholder="Select role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'Operator', label: 'Machine operator' },
              { value: 'QC Inspector', label: 'QC inspector' },
              { value: 'Packer', label: 'Packer' },
              { value: 'Store Keeper', label: 'Store keeper' },
              { value: 'Planner', label: 'Production planner' },
            ]}
          />
          <Select
            label="Shift"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            options={[
              { value: 'A', label: 'Shift A' },
              { value: 'B', label: 'Shift B' },
              { value: 'General', label: 'General shift' },
            ]}
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Certified for"
      >
        <div className="flex flex-wrap gap-1.5">
          {CERTIFICATIONS.map((cert) => {
            const on = certs.includes(cert)
            return (
              <button
                key={cert}
                type="button"
                aria-pressed={on}
                onClick={() => toggleCert(cert)}
                className={
                  on
                    ? 'rounded-full border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-on-primary'
                    : 'rounded-full border border-bd-default px-2.5 py-1 text-xs text-fg-muted hover:bg-bg-hover hover:text-fg-default'
                }
              >
                {cert}
              </button>
            )
          })}
        </div>
      </FormSection>

      <FormSection title="Notes">
        <Textarea label="Training notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </FormSection>
    </StandardModal>
  )
}

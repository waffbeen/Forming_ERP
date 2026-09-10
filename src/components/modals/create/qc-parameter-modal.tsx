'use client'

import * as React from 'react'
import { FlaskConical } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import {
  Badge, DerivedField, FormGrid, FormSection, Input, Select, Textarea,
} from '@/components/ui'
import { CATEGORIES, ITEMS } from '@/data'
import { PLANT } from '@/config/plant'
import type { QcFieldType, QcParameter } from '@/types/procurement'

/* The QC parameter master.

   This is where an inspection format is written, and the only place it is: the
   RM QC screen builds itself from these rows, so adding a characteristic here
   is what makes the next inspection ask for it. Nothing about the format is
   held in the screen that uses it.

   The field type is the important choice on this form, because it decides how
   the answer is judged rather than only how it looks. */

const FIELD_TYPES: { value: QcFieldType; label: string; hint: string }[] = [
  {
    value: 'NUMERIC',
    label: 'Numeric reading',
    hint: 'Judged against limits: fails if any single sample falls outside',
  },
  {
    value: 'COMBO',
    label: 'Choice from a list',
    hint: 'The first option is the acceptable answer; anything else is a finding',
  },
  {
    value: 'CHECKBOX',
    label: 'Yes / no confirmation',
    hint: 'A no is a finding against the batch',
  },
  {
    value: 'TEXT',
    label: 'Recorded observation',
    hint: 'Evidence on the report, never a pass or fail on its own',
  },
]

/** How a numeric characteristic gets its limits. */
type LimitMode = 'FIXED' | 'ORDER'

export interface QcParameterModalProps {
  isOpen: boolean
  onClose: () => void
  /** The category the format belongs to, when opened from that format. */
  categoryId?: string
  /** Editing an existing characteristic rather than adding one. */
  parameter?: QcParameter | null
}

export function QcParameterModal({
  isOpen,
  onClose,
  categoryId: initialCategoryId = '',
  parameter = null,
}: QcParameterModalProps) {
  const editing = parameter !== null

  const [categoryId, setCategoryId] = React.useState(initialCategoryId)
  const [characteristic, setCharacteristic] = React.useState('')
  const [fieldType, setFieldType] = React.useState<QcFieldType>('NUMERIC')
  const [specification, setSpecification] = React.useState('')
  const [method, setMethod] = React.useState('')
  const [equipment, setEquipment] = React.useState('')
  const [uom, setUom] = React.useState('')
  const [limitMode, setLimitMode] = React.useState<LimitMode>('FIXED')
  const [lower, setLower] = React.useState('')
  const [upper, setUpper] = React.useState('')
  const [nominal, setNominal] = React.useState('')
  const [tolerance, setTolerance] = React.useState('')
  const [options, setOptions] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  /* Reopening starts on the row being edited, or clean on the format it was
     opened from. */
  React.useEffect(() => {
    if (!isOpen) return
    setCategoryId(parameter?.categoryId ?? initialCategoryId)
    setCharacteristic(parameter?.characteristic ?? '')
    setFieldType(parameter?.fieldType ?? 'NUMERIC')
    setSpecification(parameter?.specification ?? '')
    setMethod(parameter?.method ?? '')
    setEquipment(parameter?.measuringEquipment ?? '')
    setUom(parameter?.uom ?? '')
    setLimitMode(parameter?.tolerancePctOfOrder !== null && parameter ? 'ORDER' : 'FIXED')
    setLower(parameter?.lowerLimit === null || !parameter ? '' : String(parameter.lowerLimit))
    setUpper(parameter?.upperLimit === null || !parameter ? '' : String(parameter.upperLimit))
    setNominal(parameter?.nominal === null || !parameter ? '' : String(parameter.nominal))
    setTolerance(
      parameter?.tolerancePctOfOrder === null || !parameter ? '' : String(parameter.tolerancePctOfOrder),
    )
    setOptions(parameter?.acceptanceOptions?.join(' | ') ?? '')
    setSaving(false)
  }, [isOpen, parameter, initialCategoryId])

  const category = CATEGORIES.find((c) => c.categoryId === categoryId)
  const parsedOptions = options
    .split('|')
    .map((o) => o.trim())
    .filter(Boolean)

  /* A format written against a parent category is asked of everything under it,
     which is worth showing before somebody adds a reel check to all items. */
  const covered = ITEMS.filter((item) => {
    let current: string | null = item.categoryId
    while (current) {
      if (current === categoryId) return true
      current = CATEGORIES.find((c) => c.categoryId === current)?.parentCategoryId ?? null
    }
    return false
  })

  const lowerNum = Number(lower)
  const upperNum = Number(upper)
  const limitsBackwards =
    limitMode === 'FIXED' && lower !== '' && upper !== '' && lowerNum >= upperNum
  const toleranceNum = Number(tolerance)
  const toleranceInvalid = limitMode === 'ORDER' && (!(toleranceNum > 0) || toleranceNum >= 100)
  const tooFewOptions = fieldType === 'COMBO' && parsedOptions.length < 2

  const canSave = Boolean(
    categoryId &&
      characteristic.trim() &&
      specification.trim() &&
      method.trim() &&
      !limitsBackwards &&
      !tooFewOptions &&
      (fieldType !== 'NUMERIC' || limitMode === 'FIXED' || !toleranceInvalid),
  )

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      onClose()
    }, 500)
  }

  /** What the inspection screen will show for this row, in one line. */
  const preview =
    fieldType === 'NUMERIC'
      ? limitMode === 'ORDER'
        ? `Readings judged against the ordered value ± ${tolerance || '—'} %`
        : `Readings judged against ${lower || '—'} to ${upper || '—'} ${uom || ''}`.trim()
      : fieldType === 'COMBO'
        ? parsedOptions.length > 0
          ? `A dropdown; "${parsedOptions[0]}" passes, the other ${parsedOptions.length - 1} are findings`
          : 'A dropdown, once the options are filled in'
        : fieldType === 'CHECKBOX'
          ? 'Yes or no; no is a finding'
          : 'A text box, recorded on the report but never judged'

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit QC Characteristic' : 'New QC Characteristic'}
      subtitle={category ? `${category.categoryName} format` : undefined}
      badge={{ label: FIELD_TYPES.find((f) => f.value === fieldType)?.label ?? '', tone: 'info' }}
      size="lg"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!canSave}
      saveLabel={editing ? 'Save characteristic' : 'Add to the format'}
      saveIcon={FlaskConical}
      footerNote={
        categoryId
          ? `Asked of ${covered.length} ${covered.length === 1 ? 'item' : 'items'} at the next inspection`
          : 'Pick the category this format belongs to'
      }
    >
      <FormSection
        title="Where it applies"
        description="A format is inherited down the category tree, so a characteristic on Raw material is asked of every reel under it."
      >
        <FormGrid cols={2}>
          <Select
            label="Item category"
            required
            placeholder="Select a category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={CATEGORIES.filter((c) => c.appliesTo === 'ITEM' && c.status === 'ACTIVE').map((c) => ({
              value: c.categoryId,
              label: c.parentCategoryId
                ? `${c.categoryName} — under ${CATEGORIES.find((p) => p.categoryId === c.parentCategoryId)?.categoryName ?? ''}`
                : c.categoryName,
            }))}
          />
          <DerivedField
            label="Items covered"
            value={categoryId ? `${covered.length} items` : '—'}
            emphasis={covered.length > 6}
          />
        </FormGrid>
        {covered.length > 0 ? (
          <p className="mt-2 text-xs text-fg-subtle">
            {covered.slice(0, 4).map((i) => i.itemCode).join(', ')}
            {covered.length > 4 ? ` and ${covered.length - 4} more` : ''}
          </p>
        ) : null}
      </FormSection>

      <FormSection title="The characteristic">
        <FormGrid cols={2}>
          <Input
            label="Characteristic"
            required
            value={characteristic}
            onChange={(e) => setCharacteristic(e.target.value)}
            placeholder="Thickness, Colour, Gels and fish eyes"
          />
          <Select
            label="How it is answered"
            required
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as QcFieldType)}
            options={FIELD_TYPES.map((f) => ({ value: f.value, label: f.label }))}
            helper={FIELD_TYPES.find((f) => f.value === fieldType)?.hint}
          />
          <Input
            label="Acceptance criteria"
            required
            className="sm:col-span-2"
            value={specification}
            onChange={(e) => setSpecification(e.target.value)}
            placeholder="Ordered gauge ± 2 %, or: clear of haze and contamination"
          />
          <Input
            label="Method of inspection"
            required
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Five points across the web"
          />
          <Input
            label="Measuring equipment"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="Digital micrometer, 0 to 25 mm"
            helper="What an auditor asks for by name"
          />
        </FormGrid>
      </FormSection>

      {fieldType === 'NUMERIC' ? (
        <FormSection title="Limits" description="What the reading is allowed to be.">
          <FormGrid cols={2}>
            <Select
              label="Judged against"
              required
              value={limitMode}
              onChange={(e) => setLimitMode(e.target.value as LimitMode)}
              options={[
                { value: 'FIXED', label: 'Fixed limits, the same for every order' },
                { value: 'ORDER', label: 'A band around what the order asked for' },
              ]}
              helper={
                limitMode === 'ORDER'
                  ? 'Gauge works this way: a 300 µm reel and a 450 µm reel each get their own band'
                  : undefined
              }
            />
            <Input
              label="Unit"
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              placeholder="µm, ppm, nos/m²"
            />
            {limitMode === 'FIXED' ? (
              <>
                <Input
                  label="Lower limit"
                  type="number"
                  step="0.01"
                  value={lower}
                  onChange={(e) => setLower(e.target.value)}
                  error={limitsBackwards ? 'Lower limit must be under the upper limit' : false}
                />
                <Input
                  label="Upper limit"
                  type="number"
                  step="0.01"
                  value={upper}
                  onChange={(e) => setUpper(e.target.value)}
                />
                <Input
                  label="Target value"
                  type="number"
                  step="0.01"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  helper="Where the reading should sit, if there is a target"
                />
              </>
            ) : (
              <Input
                label="Tolerance"
                unit="% of the ordered value"
                required
                type="number"
                step="0.1"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                error={
                  tolerance !== '' && toleranceInvalid ? 'Give a tolerance between 0 and 100 %' : false
                }
                helper={`The ${PLANT.minMicrons} µm plant floor still applies on top of this`}
              />
            )}
          </FormGrid>
        </FormSection>
      ) : null}

      {fieldType === 'COMBO' ? (
        <FormSection
          title="Answers"
          description="Separated by a pipe. The first one is the acceptable answer; every other is a finding."
        >
          <Textarea
            label="Acceptance status options"
            required
            rows={2}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Clear, no haze | Slight haze | Haze or streaks | Black specks"
            error={
              options.trim() !== '' && tooFewOptions ? 'Give at least two options, separated by a pipe' : false
            }
          />
          {parsedOptions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parsedOptions.map((option, i) => (
                <Badge key={option} tone={i === 0 ? 'success' : 'error'}>
                  {option}
                </Badge>
              ))}
            </div>
          ) : null}
        </FormSection>
      ) : null}

      <FormSection title="On the inspection screen">
        <p className="rounded-md border border-dashed border-bd-strong bg-bg-subtle px-3 py-2.5 text-xs text-fg-muted">
          <span className="font-medium text-fg-default">{characteristic || 'This characteristic'}</span> — {preview}.
          {fieldType !== 'TEXT'
            ? ' A failure here stops the full quantity being approved; some of it has to be held or returned.'
            : ''}
        </p>
      </FormSection>
    </StandardModal>
  )
}

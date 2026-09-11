'use client'

import * as React from 'react'
import {
  AlertTriangle, ClipboardCheck, FileSearch, Lock, PackageX, Plus, ShieldCheck, Undo2,
} from 'lucide-react'
import { StandardModal } from '@/components/modals'
import {
  Badge, Button, DerivedField, Divider, FormGrid, FormSection, Input, Select, SpecList, Textarea,
} from '@/components/ui'
import {
  ITEMS, SUPPLIERS, USERS,
  average, judgeCharacteristic, nextQcNumber, orderedGaugeOf, overallOf, qcParametersFor,
  qcReportForLine, rmQcLinesOf, samplePlanFor,
} from '@/data'
import { PLANT } from '@/config/plant'
import { previewNumber } from '@/lib/document-number'
import { formatDate, formatNumber } from '@/lib/utils'
import type {
  GoodsReceiptNote, GrnLine, QcCharacteristicResult, QcParameter, QcResult, RejectDisposition,
  RmQcReport, RmQcTab,
} from '@/types/procurement'

/* Raw material QC.

   Two screens, in the order the store works: the inspection first, the
   quantities second. An inspector cannot sign off a quantity on a line they
   have not inspected, and the receipt cannot be finalised until every line
   carries a report number. That ordering is the whole control — it is what
   stops material entering stock on somebody's word.

   Nothing is written anywhere yet, so both modals hold their own state and
   close cleanly. The rules they enforce are the ones the API would. */

const itemOf = (id: string) => ITEMS.find((i) => i.itemId === id)
const userName = (id: string) => USERS.find((u) => u.userId === id)?.userName ?? id

const RESULT_TONE: Record<QcResult, 'success' | 'error'> = { PASS: 'success', FAIL: 'error' }

/** A roll under the plant floor cannot be formed at all, whatever else it measures. */
function belowPlantFloor(line: GrnLine) {
  return line.thicknessMicrons !== null && line.thicknessMicrons < PLANT.minMicrons
}

// ============================================================= QC report

interface CharacteristicDraft {
  /** Held as text so a half-typed reading does not read as a zero. */
  readings: string[]
  acceptanceStatus: string
  remark: string
}

function blankDraft(parameter: QcParameter, sampleCount: number): CharacteristicDraft {
  return {
    readings: Array.from({ length: sampleCount }, () => ''),
    acceptanceStatus: '',
    remark: '',
  }
}

function draftFrom(result: QcCharacteristicResult, sampleCount: number): CharacteristicDraft {
  return {
    readings: Array.from({ length: sampleCount }, (_, i) =>
      result.readings[i] === undefined ? '' : String(result.readings[i]),
    ),
    acceptanceStatus: result.acceptanceStatus ?? '',
    remark: result.remark,
  }
}

const filledReadings = (values: string[]) =>
  values.filter((v) => v.trim() !== '').map(Number).filter((n) => !Number.isNaN(n))

export interface QcReportModalProps {
  isOpen: boolean
  onClose: () => void
  grn: GoodsReceiptNote
  line: GrnLine
  /** An inspection already on file, which opens the format read-only. */
  existing: RmQcReport | null
  /** Hands the new report back to the approval screen. */
  onSaved?: (report: RmQcReport) => void
}

/**
 * The incoming inspection format for one received batch, driven by the QC
 * parameter master rather than by a fixed list of fields, so a PET reel is
 * asked about its migration certificate and a PVC reel about its shade.
 *
 * The verdict is never typed in. Each characteristic is judged from the
 * readings against its own limits, and the report takes the worst of them.
 */
export function QcReportModal({ isOpen, onClose, grn, line, existing, onSaved }: QcReportModalProps) {
  const readOnly = existing !== null
  const parameters = React.useMemo(() => qcParametersFor(line.itemId), [line.itemId])
  const item = itemOf(line.itemId)
  const orderedGauge = orderedGaugeOf(grn.poNumber, line.poLineId)

  const plan = samplePlanFor(line.itemId)
  const [sampleCount, setSampleCount] = React.useState(existing?.sampleCount ?? plan?.sampleCount ?? 3)
  const [sampleSize, setSampleSize] = React.useState(existing?.sampleSize ?? plan?.sampleSize ?? '')
  const [inspectorId, setInspectorId] = React.useState(existing?.inspectedByUserId ?? '')
  const [remarks, setRemarks] = React.useState(existing?.remarks ?? '')
  const [drafts, setDrafts] = React.useState<Record<string, CharacteristicDraft>>({})
  const [saving, setSaving] = React.useState(false)

  /* Reopening the format starts it clean, or on what is already on file. */
  React.useEffect(() => {
    if (!isOpen) return
    const count = existing?.sampleCount ?? plan?.sampleCount ?? 3
    setSampleCount(count)
    setSampleSize(existing?.sampleSize ?? plan?.sampleSize ?? '')
    setInspectorId(existing?.inspectedByUserId ?? '')
    setRemarks(existing?.remarks ?? '')
    setDrafts(
      Object.fromEntries(
        parameters.map((p) => {
          const saved = existing?.characteristics.find((c) => c.parameterId === p.parameterId)
          return [p.parameterId, saved ? draftFrom(saved, count) : blankDraft(p, count)]
        }),
      ),
    )
  }, [isOpen, existing, parameters, plan])

  /* More samples means more columns, and the readings already typed stay put. */
  const resize = (count: number) => {
    setSampleCount(count)
    setDrafts((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, draft]) => [
          id,
          {
            ...draft,
            readings: Array.from({ length: count }, (_, i) => draft.readings[i] ?? ''),
          },
        ]),
      ),
    )
  }

  const update = (parameterId: string, patch: Partial<CharacteristicDraft>) =>
    setDrafts((prev) => ({ ...prev, [parameterId]: { ...prev[parameterId], ...patch } }))

  const setReading = (parameterId: string, index: number, value: string) =>
    setDrafts((prev) => {
      const readings = [...prev[parameterId].readings]
      readings[index] = value
      return { ...prev, [parameterId]: { ...prev[parameterId], readings } }
    })

  /** Where a characteristic has been answered at all, and what it comes to. */
  const judged = parameters.map((p) => {
    const draft = drafts[p.parameterId] ?? blankDraft(p, sampleCount)
    const readings = filledReadings(draft.readings)
    const complete =
      p.fieldType === 'NUMERIC' ? readings.length === sampleCount : draft.acceptanceStatus.trim() !== ''
    const result = complete
      ? judgeCharacteristic(p, readings, draft.acceptanceStatus || null, orderedGauge)
      : null
    return { parameter: p, draft, readings, complete, result }
  })

  const allAnswered = judged.every((j) => j.complete)
  const overall: QcResult = judged.some((j) => j.result === 'FAIL') ? 'FAIL' : 'PASS'
  const failures = judged.filter((j) => j.result === 'FAIL')
  const qcNumber = existing?.qcNumber ?? nextQcNumber()

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      const characteristics: QcCharacteristicResult[] = judged.map((j) => ({
        parameterId: j.parameter.parameterId,
        readings: j.parameter.fieldType === 'NUMERIC' ? j.readings : [],
        acceptanceStatus: j.parameter.fieldType === 'NUMERIC' ? null : j.draft.acceptanceStatus,
        result: j.result ?? 'FAIL',
        remark: j.draft.remark,
      }))
      onSaved?.({
        qcNumber,
        grnNumber: grn.grnNumber,
        grnLineId: line.lineId,
        itemId: line.itemId,
        reelId: line.reelId,
        inspectedOn: new Date().toISOString().slice(0, 10),
        inspectedByUserId: inspectorId,
        sampleSize,
        sampleCount,
        characteristics,
        overallResult: overallOf(characteristics),
        remarks,
      })
      setSaving(false)
      onClose()
    }, 500)
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={readOnly ? `Inspection ${existing.qcNumber}` : 'Incoming Inspection'}
      subtitle={`${item?.itemName ?? line.itemId}${line.reelId ? ` · ${line.reelId}` : ''}`}
      badge={
        allAnswered
          ? { label: overall === 'PASS' ? 'Passes' : `Fails on ${failures.length}`, tone: RESULT_TONE[overall] }
          : { label: 'Incomplete', tone: 'muted' }
      }
      size="master"
      onSave={readOnly ? undefined : handleSave}
      saving={saving}
      saveDisabled={!allAnswered || !inspectorId}
      saveLabel="Save inspection"
      cancelLabel={readOnly ? 'Close' : 'Cancel'}
      footerNote={
        readOnly
          ? `Inspected ${formatDate(existing.inspectedOn)} by ${userName(existing.inspectedByUserId)}`
          : allAnswered
            ? `Saves as ${qcNumber}, verdict ${overall === 'PASS' ? 'pass' : 'fail'}`
            : `${judged.filter((j) => !j.complete).length} of ${parameters.length} characteristics still to fill`
      }
    >
      <FormSection title="Sampling">
        <FormGrid cols={3}>
          <DerivedField label="Against receipt" value={`${grn.grnNumber} · ${line.reelId ?? 'no reel'}`} />
          <Input
            label="Sample size"
            value={sampleSize}
            onChange={(e) => setSampleSize(e.target.value)}
            disabled={readOnly}
          />
          <Select
            label="Samples drawn"
            required
            value={String(sampleCount)}
            disabled={readOnly}
            onChange={(e) => resize(Number(e.target.value))}
            options={[
              { value: '3', label: '3 samples' },
              { value: '5', label: '5 samples' },
              { value: '7', label: '7 samples' },
            ]}
          />
          <Select
            label="Inspected by"
            required
            placeholder="Select inspector"
            value={inspectorId}
            disabled={readOnly}
            onChange={(e) => setInspectorId(e.target.value)}
            options={USERS.filter((u) => u.role === 'QC' && u.status === 'ACTIVE').map((u) => ({
              value: u.userId,
              label: `${u.userName} — ${u.designation}`,
            }))}
          />
          <DerivedField
            label="Ordered gauge"
            value={orderedGauge ? `${orderedGauge} µm ± 2 %` : 'Not ordered by gauge'}
          />
          <DerivedField
            label="Received"
            value={`${formatNumber(line.receivedQty, 1)} ${item?.uom ?? ''}`}
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Characteristics"
        description="Each one is judged against its own limits, so the verdict follows the readings rather than an opinion."
      >
        <div className="space-y-2.5">
          {judged.map(({ parameter, draft, readings, complete, result }) => (
            <div
              key={parameter.parameterId}
              className={
                result === 'FAIL'
                  ? 'rounded-md border border-error/50 bg-error/5 px-3 py-2.5'
                  : 'rounded-md border border-bd-default px-3 py-2.5'
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-sm font-medium">{parameter.characteristic}</span>
                  <span className="ml-2 font-mono text-xs text-fg-muted">{parameter.specification}</span>
                </div>
                {!complete ? (
                  <Badge tone="muted">Not filled</Badge>
                ) : parameter.fieldType === 'TEXT' ? (
                  <Badge tone="info">Recorded</Badge>
                ) : result ? (
                  <Badge tone={RESULT_TONE[result]}>{result === 'PASS' ? 'Within spec' : 'Out of spec'}</Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-fg-subtle">
                {parameter.method} · {parameter.measuringEquipment}
              </p>

              {parameter.fieldType !== 'NUMERIC' ? (
                <div className="mt-2">
                  <FormGrid cols={2}>
                    {parameter.fieldType === 'COMBO' ? (
                      <Select
                        label="Acceptance status"
                        required
                        placeholder="Select what was seen"
                        value={draft.acceptanceStatus}
                        disabled={readOnly}
                        onChange={(e) => update(parameter.parameterId, { acceptanceStatus: e.target.value })}
                        options={(parameter.acceptanceOptions ?? []).map((o) => ({ value: o, label: o }))}
                        helper={`Acceptable: ${parameter.acceptanceOptions?.[0] ?? '—'}`}
                      />
                    ) : parameter.fieldType === 'CHECKBOX' ? (
                      <Select
                        label="Confirmed"
                        required
                        placeholder="Yes or no"
                        value={draft.acceptanceStatus}
                        disabled={readOnly}
                        onChange={(e) => update(parameter.parameterId, { acceptanceStatus: e.target.value })}
                        options={[
                          { value: 'Yes', label: 'Yes' },
                          { value: 'No', label: 'No' },
                        ]}
                        helper="No is a finding against the batch"
                      />
                    ) : (
                      <Input
                        label="Recorded as"
                        required
                        mono
                        value={draft.acceptanceStatus}
                        disabled={readOnly}
                        onChange={(e) => update(parameter.parameterId, { acceptanceStatus: e.target.value })}
                        placeholder="Copy it exactly off the label"
                        helper="Recorded on the report as evidence, not judged"
                      />
                    )}
                    <Input
                      label="Remark"
                      value={draft.remark}
                      disabled={readOnly}
                      onChange={(e) => update(parameter.parameterId, { remark: e.target.value })}
                      placeholder={result === 'FAIL' ? 'What was seen, and where on the roll' : 'Optional'}
                    />
                  </FormGrid>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap items-end gap-2">
                    {draft.readings.map((value, i) => (
                      <Input
                        key={i}
                        label={`S${i + 1}`}
                        unit={i === draft.readings.length - 1 ? (parameter.uom ?? undefined) : undefined}
                        type="number"
                        step="0.01"
                        className="w-20"
                        value={value}
                        disabled={readOnly}
                        onChange={(e) => setReading(parameter.parameterId, i, e.target.value)}
                      />
                    ))}
                    <div className="w-28">
                      <DerivedField
                        label="Average"
                        value={readings.length > 0 ? formatNumber(average(readings), 2) : '—'}
                        emphasis={result === 'FAIL'}
                      />
                    </div>
                    <div className="min-w-40 flex-1">
                      <Input
                        label="Remark"
                        value={draft.remark}
                        disabled={readOnly}
                        onChange={(e) => update(parameter.parameterId, { remark: e.target.value })}
                        placeholder={result === 'FAIL' ? 'Which readings, and where on the web' : 'Optional'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Inspector's note">
        <Textarea
          label="Remarks"
          rows={2}
          value={remarks}
          disabled={readOnly}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="What the store should do with the material, and why"
        />
        {allAnswered && overall === 'FAIL' ? (
          <div className="mt-3 flex items-start gap-3 rounded-md border border-error/50 bg-error/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
            <div>
              <h5 className="text-sm font-semibold">
                Fails on {failures.map((f) => f.parameter.characteristic).join(', ')}
              </h5>
              <p className="mt-0.5 max-w-[70ch] text-xs text-fg-muted">
                The approval screen will not let the full quantity through on a failed inspection. Some of it has to be
                held for a supplier decision, or returned.
              </p>
            </div>
          </div>
        ) : null}
      </FormSection>
    </StandardModal>
  )
}

// ============================================================ Approval

interface LineDraft {
  qcNumber: string | null
  /** Text, so clearing the field does not silently read as zero. */
  hold: string
  reject: string
  disposition: RejectDisposition | ''
  remark: string
}

function draftOf(line: GrnLine, finalised: boolean): LineDraft {
  if (finalised) {
    return {
      qcNumber: line.qcNumber,
      hold: String(line.holdQty),
      reject: String(line.rejectedQty),
      disposition: line.rejectDisposition ?? '',
      remark: line.qcRemarks,
    }
  }
  /* A roll under the plant floor is going back whatever else it measures, so
     the screen opens with that already filled in. */
  return {
    qcNumber: null,
    hold: '0',
    reject: belowPlantFloor(line) ? String(line.receivedQty) : '0',
    disposition: belowPlantFloor(line) ? 'RETURN_TO_SUPPLIER' : '',
    remark: '',
  }
}

const DISPOSITION_LABEL: Record<RejectDisposition, string> = {
  RETURN_TO_SUPPLIER: 'Return to supplier',
  SCRAP: 'Scrap, raise a debit note',
}

export interface RmQcModalProps {
  isOpen: boolean
  onClose: () => void
  grn: GoodsReceiptNote
  /** Which tab the receipt was opened from, which decides what can be edited. */
  tab: RmQcTab
}

/**
 * The approval screen for one receipt: every batch line on it, the inspection
 * behind each, and the three-way split of what arrived.
 *
 * Approved is derived rather than typed. Everything that arrived passes unless
 * the inspector holds some of it or sends some back, which is the way the store
 * actually thinks about it and means the three figures can never fail to add up
 * to what was weighed in.
 */
export function RmQcModal({ isOpen, onClose, grn, tab }: RmQcModalProps) {
  const finalised = tab !== 'PENDING'
  const lines = React.useMemo(() => rmQcLinesOf(grn, tab), [grn, tab])
  const supplier = SUPPLIERS.find((s) => s.supplierId === grn.supplierId)

  const [drafts, setDrafts] = React.useState<Record<string, LineDraft>>({})
  /** Inspections saved in this sitting, alongside the ones already on file. */
  const [reports, setReports] = React.useState<Record<string, RmQcReport>>({})
  const [reportFor, setReportFor] = React.useState<string | null>(null)
  const [returnOpen, setReturnOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return
    setDrafts(Object.fromEntries(lines.map((l) => [l.lineId, draftOf(l, finalised)])))
    setReports({})
    setReportFor(null)
    setReturnOpen(false)
  }, [isOpen, lines, finalised])

  const reportOf = (line: GrnLine) => reports[line.lineId] ?? qcReportForLine(line.lineId)

  const update = (lineId: string, patch: Partial<LineDraft>) =>
    setDrafts((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }))

  /** One line's arithmetic, and everything the finalise button has to check. */
  const state = lines.map((line) => {
    const draft = drafts[line.lineId] ?? draftOf(line, finalised)
    const hold = Math.max(Number(draft.hold) || 0, 0)
    const reject = Math.max(Number(draft.reject) || 0, 0)
    const approved = Number((line.receivedQty - hold - reject).toFixed(1))
    const report = reportOf(line)
    const mustReject = belowPlantFloor(line)

    const errors: string[] = []
    if (approved < 0) errors.push('Held and returned together come to more than was received')
    if (!draft.qcNumber && !report) errors.push('Inspect the batch before signing off a quantity')
    if (report?.overallResult === 'FAIL' && hold + reject === 0) {
      errors.push('The inspection failed, so some quantity has to be held or returned')
    }
    if (reject > 0 && !draft.disposition) errors.push('Say what happens to the returned quantity')
    if (mustReject && reject !== line.receivedQty) {
      errors.push(`Under the ${PLANT.minMicrons} µm plant floor, so the whole roll goes back`)
    }

    return { line, draft, hold, reject, approved, report, mustReject, errors }
  })

  const totalApproved = state.reduce((s, l) => s + Math.max(l.approved, 0), 0)
  const totalHeld = state.reduce((s, l) => s + l.hold, 0)
  const totalRejected = state.reduce((s, l) => s + l.reject, 0)
  const rejects = state.filter((l) => l.reject > 0)
  const blocking = state.flatMap((l) => l.errors)
  const uom = itemOf(lines[0]?.itemId ?? '')?.uom ?? ''

  const finish = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      setReturnOpen(false)
      onClose()
    }, 500)
  }

  /* Anything going back to the supplier needs a disposition document, so
     finalising hands straight over to it rather than trusting a follow-up. */
  const handleFinalise = () => {
    if (rejects.length > 0) {
      setReturnOpen(true)
      return
    }
    finish()
  }

  const openLine = state.find((l) => l.line.lineId === reportFor)

  return (
    <>
      <StandardModal
        isOpen={isOpen}
        onClose={onClose}
        title={`RM QC · ${grn.grnNumber}`}
        subtitle={`${supplier?.supplierName ?? grn.supplierId} · challan ${grn.supplierChallanNo}`}
        badge={
          finalised
            ? { label: 'Signed off', tone: 'success' }
            : { label: `${lines.length} ${lines.length === 1 ? 'batch' : 'batches'} to inspect`, tone: 'warning' }
        }
        size="master"
        onSave={finalised ? undefined : handleFinalise}
        saving={saving}
        saveDisabled={blocking.length > 0}
        saveLabel={rejects.length > 0 ? 'Finalise and raise return' : 'Finalise approval'}
        saveIcon={ShieldCheck}
        cancelLabel={finalised ? 'Close' : 'Cancel'}
        footerActions={
          finalised ? (
            <Button variant="ghost" icon={Undo2} onClick={finish} disabled={saving}>
              Send back to pending
            </Button>
          ) : null
        }
        footerNote={
          finalised
            ? `Approved by ${grn.inspectedByUserId ? userName(grn.inspectedByUserId) : '—'} on ${formatDate(grn.grnDate)}`
            : blocking.length > 0
              ? blocking[0]
              : `${formatNumber(totalApproved, 1)} ${uom} to stock · ${formatNumber(totalHeld, 1)} held · ${formatNumber(totalRejected, 1)} back to the supplier`
        }
      >
        {!finalised ? (
          <div className="mb-5 flex items-start gap-3 rounded-md border border-bd-strong bg-bg-subtle p-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
            <div>
              <h5 className="text-sm font-semibold">None of this is stock yet</h5>
              <p className="mt-0.5 max-w-[74ch] text-xs text-fg-muted">
                The receipt booked what arrived. Only the quantity signed off here reaches a bin, and only that quantity
                can be issued to a job card. Held and returned quantities never count as stock at all.
              </p>
            </div>
          </div>
        ) : null}

        <FormSection title="Receipt">
          <SpecList
            rows={[
              { label: 'Supplier', value: supplier?.supplierName ?? grn.supplierId, mono: false },
              { label: 'Against PO', value: grn.poNumber },
              { label: 'Challan', value: `${grn.supplierChallanNo} · ${formatDate(grn.grnDate)}` },
              { label: 'Invoice', value: grn.supplierInvoiceNo || 'Not received' },
              { label: 'Received by', value: userName(grn.receivedByUserId), mono: false },
            ]}
          />
        </FormSection>

        <FormSection
          title="Batches"
          description={
            finalised
              ? 'What was signed off against each batch, and the inspection behind it.'
              : 'Inspect each batch, then hold or return whatever the inspection would not pass.'
          }
        >
          <div className="space-y-3">
            {state.map(({ line, draft, hold, reject, approved, report, mustReject, errors }) => {
              const item = itemOf(line.itemId)
              const orderedGauge = orderedGaugeOf(grn.poNumber, line.poLineId)
              return (
                <div key={line.lineId} className="rounded-md border border-bd-default px-3 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium">{item?.itemName ?? line.itemId}</span>
                      <span className="ml-2 font-mono text-xs text-fg-muted">
                        {line.reelId ?? 'no reel'} · challan {formatNumber(line.challanQty, 1)} · weighed{' '}
                        {formatNumber(line.receivedQty, 1)} {item?.uom}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {report ? (
                        <>
                          <Badge tone={RESULT_TONE[report.overallResult]}>
                            {report.overallResult === 'PASS' ? 'Inspection passed' : 'Inspection failed'}
                          </Badge>
                          <span className="font-mono text-xs">{report.qcNumber}</span>
                        </>
                      ) : (
                        <Badge tone="muted">Not inspected</Badge>
                      )}
                      <Button
                        variant="ghost"
                        icon={report ? FileSearch : Plus}
                        onClick={() => setReportFor(line.lineId)}
                      >
                        {report ? 'View inspection' : 'Add QC detail'}
                      </Button>
                    </div>
                  </div>

                  <p className="mt-1 font-mono text-xs text-fg-subtle">
                    gauge {line.thicknessMicrons ?? '—'} µm against {orderedGauge ?? '—'} ordered
                    {mustReject ? (
                      <span className="text-error"> · under the {PLANT.minMicrons} µm plant floor</span>
                    ) : null}
                  </p>

                  <div className="mt-3">
                    <FormGrid cols={3}>
                      <DerivedField
                        label="Approved into stock"
                        unit={item?.uom}
                        value={formatNumber(Math.max(approved, 0), 1)}
                        emphasis={approved > 0}
                      />
                      <Input
                        label="Hold"
                        unit={item?.uom}
                        type="number"
                        step="0.1"
                        value={draft.hold}
                        disabled={finalised || mustReject}
                        onChange={(e) => update(line.lineId, { hold: e.target.value })}
                        helper="Stays in the quarantine bin pending a supplier decision"
                      />
                      <Input
                        label="Return / reject"
                        unit={item?.uom}
                        type="number"
                        step="0.1"
                        value={draft.reject}
                        disabled={finalised || mustReject}
                        onChange={(e) => update(line.lineId, { reject: e.target.value })}
                        error={approved < 0 ? 'More than was received' : false}
                      />
                      {reject > 0 ? (
                        <Select
                          label="What happens to it"
                          required
                          placeholder="Select the disposition"
                          value={draft.disposition}
                          disabled={finalised}
                          onChange={(e) =>
                            update(line.lineId, { disposition: e.target.value as RejectDisposition })
                          }
                          options={(Object.keys(DISPOSITION_LABEL) as RejectDisposition[]).map((d) => ({
                            value: d,
                            label: DISPOSITION_LABEL[d],
                          }))}
                        />
                      ) : null}
                      <Input
                        label="QC remark"
                        className="sm:col-span-2"
                        value={draft.remark}
                        disabled={finalised}
                        onChange={(e) => update(line.lineId, { remark: e.target.value })}
                        placeholder="Why anything was held or sent back"
                      />
                    </FormGrid>
                  </div>

                  {!finalised && errors.length > 0 ? (
                    <ul className="mt-2 space-y-0.5">
                      {errors.map((error) => (
                        <li key={error} className="flex items-start gap-1.5 text-xs text-error">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )
            })}
          </div>
        </FormSection>

        <Divider />

        <FormGrid cols={3}>
          <DerivedField label="To stock" unit={uom} value={formatNumber(totalApproved, 1)} emphasis />
          <DerivedField label="On hold" unit={uom} value={formatNumber(totalHeld, 1)} />
          <DerivedField label="Back to supplier" unit={uom} value={formatNumber(totalRejected, 1)} />
        </FormGrid>
      </StandardModal>

      {openLine ? (
        <QcReportModal
          isOpen
          onClose={() => setReportFor(null)}
          grn={grn}
          line={openLine.line}
          existing={openLine.report}
          onSaved={(report) => {
            setReports((prev) => ({ ...prev, [report.grnLineId]: report }))
            update(report.grnLineId, { qcNumber: report.qcNumber })
          }}
        />
      ) : null}

      <SupplierReturnModal
        isOpen={returnOpen}
        onClose={() => setReturnOpen(false)}
        grn={grn}
        rejects={rejects.map((r) => ({
          line: r.line,
          quantity: r.reject,
          disposition: (r.draft.disposition || 'RETURN_TO_SUPPLIER') as RejectDisposition,
          remark: r.draft.remark,
        }))}
        onDone={finish}
      />
    </>
  )
}

// ===================================================== Supplier return

export interface SupplierReturnLine {
  line: GrnLine
  quantity: number
  disposition: RejectDisposition
  remark: string
}

export interface SupplierReturnModalProps {
  isOpen: boolean
  onClose: () => void
  grn: GoodsReceiptNote
  rejects: SupplierReturnLine[]
  /** Called instead of onClose when the return is actually raised. */
  onDone?: () => void
}

/**
 * What leaves the plant again. A rejected quantity is not simply written off:
 * it goes back on a vehicle against a debit note, or to the grinder as scrap,
 * and either way somebody has to say which before QC can finalise the receipt.
 */
export function SupplierReturnModal({ isOpen, onClose, grn, rejects, onDone }: SupplierReturnModalProps) {
  const supplier = SUPPLIERS.find((s) => s.supplierId === grn.supplierId)
  const [transporter, setTransporter] = React.useState('')
  const [vehicle, setVehicle] = React.useState('')
  const [debitNote, setDebitNote] = React.useState('')
  const [remarks, setRemarks] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const returning = rejects.filter((r) => r.disposition === 'RETURN_TO_SUPPLIER')
  const scrapping = rejects.filter((r) => r.disposition === 'SCRAP')
  const total = rejects.reduce((s, r) => s + r.quantity, 0)
  const uom = itemOf(rejects[0]?.line.itemId ?? '')?.uom ?? ''
  const value = rejects.reduce(
    (s, r) => s + r.quantity * (itemOf(r.line.itemId)?.ratePerUom ?? 0),
    0,
  )

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      ;(onDone ?? onClose)()
    }, 500)
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Rejected Material"
      subtitle={`${grn.grnNumber} · ${supplier?.supplierName ?? grn.supplierId}`}
      badge={{ label: `${formatNumber(total, 1)} ${uom}`, tone: 'error' }}
      size="lg"
      onSave={handleSave}
      saving={saving}
      saveDisabled={returning.length > 0 && !transporter}
      saveLabel="Raise return"
      saveIcon={PackageX}
      footerNote={value > 0 ? `Recoverable from the supplier: about ₹ ${formatNumber(value, 0)}` : undefined}
    >
      <FormSection title="What is going back">
        <ul className="space-y-2">
          {rejects.map((reject) => {
            const item = itemOf(reject.line.itemId)
            return (
              <li key={reject.line.lineId} className="rounded-md border border-bd-default px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{item?.itemName ?? reject.line.itemId}</span>
                  <Badge tone={reject.disposition === 'RETURN_TO_SUPPLIER' ? 'warning' : 'error'}>
                    {DISPOSITION_LABEL[reject.disposition]}
                  </Badge>
                </div>
                <p className="mt-0.5 font-mono text-xs text-fg-muted">
                  {reject.line.reelId ?? 'no reel'} · {formatNumber(reject.quantity, 1)} {item?.uom} of{' '}
                  {formatNumber(reject.line.receivedQty, 1)} received
                </p>
                {reject.remark ? <p className="mt-1 text-xs text-fg-subtle">{reject.remark}</p> : null}
              </li>
            )
          })}
        </ul>
      </FormSection>

      {returning.length > 0 ? (
        <FormSection title="Outward vehicle" description="Needed for the return challan at the gate.">
          <FormGrid cols={2}>
            <Input
              label="Transporter"
              required
              value={transporter}
              onChange={(e) => setTransporter(e.target.value)}
              placeholder="Who is taking it back"
            />
            <Input
              label="Vehicle no"
              mono
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="MH 48 AB 1234"
            />
            <Input
              label="Supplier debit note ref"
              mono
              value={debitNote}
              onChange={(e) => setDebitNote(e.target.value)}
              placeholder="Leave blank until accounts raise it"
            />
            <DerivedField
              label="Return note"
              value={previewNumber('SUPPLIER_RETURN')}
              emphasis
            />
          </FormGrid>
        </FormSection>
      ) : null}

      {scrapping.length > 0 ? (
        <FormSection title="Scrap">
          <p className="text-xs text-fg-muted">
            {formatNumber(scrapping.reduce((s, r) => s + r.quantity, 0), 1)} {uom} goes to the scrap bin for grinding
            rather than back on a vehicle. It is still recoverable from the supplier on the debit note.
          </p>
        </FormSection>
      ) : null}

      <FormSection title="Remarks">
        <Textarea
          label="Note to the supplier"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="What was wrong with the material, and what is expected back"
        />
      </FormSection>

      <div className="flex items-start gap-3 rounded-md border border-bd-strong bg-bg-subtle p-3">
        <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
        <p className="max-w-[74ch] text-xs text-fg-muted">
          Raising this finalises the receipt. The approved quantity reaches its bin and can be issued to a job card;
          nothing else on the receipt can.
        </p>
      </div>
    </StandardModal>
  )
}

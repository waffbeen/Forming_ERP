'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, ClipboardCheck, FileCheck2, Lock, ShieldAlert } from 'lucide-react'
import { HeaderSteps } from 'indas-ui'
import { StandardModal } from '@/components/modals/standard-modal'
import { EmployeePicker } from './master-pickers'
import {
  Badge, Button, Checkbox, DerivedField, FormGrid, FormSection, Input, Select, Textarea,
} from '@/components/ui'
import { IN_PROCESS_CHECK_COUNT } from '@/config/plant'
import {
  COAS, EMPLOYEES, IN_PROCESS_CHECKS, JOB_CARDS, PACKING_RECORDS, USERS,
  blankCharacteristics, openNcsFor,
} from '@/data'
import { cn, formatNumber } from '@/lib/utils'
import { coaBlockers, fgReportPasses, sampleSizeFor, ACCEPTANCE_NUMBER } from '@/types/fg-inspection'
import type { FgCharacteristic, FgResult } from '@/types/fg-inspection'

const STEPS = [
  { id: 1, label: 'Lot and sample', icon: ClipboardCheck },
  { id: 2, label: 'Inspection', icon: ShieldAlert },
  { id: 3, label: 'Certificate', icon: FileCheck2 },
]

function nameOf(employeeId: string) {
  const employee = EMPLOYEES.find((e) => e.employeeId === employeeId)
  return USERS.find((u) => u.userId === employee?.userId)?.userName ?? employeeId
}

const qcOptions = EMPLOYEES.filter((e) => e.department === 'Quality').map((e) => ({
  value: e.employeeId,
  label: nameOf(e.employeeId) || e.employeeCode,
}))

/**
 * Finished goods inspection, then the certificate that follows it.
 *
 * The certificate is deliberately the last step and not a form of its own. It
 * is released against records the plant already made — the hourly checks, the
 * inspection just completed, and a clean non-conformance register — and the
 * gate names whichever of those is missing rather than only refusing.
 */
export function FgCoaModal({
  isOpen,
  onClose,
  jobCardNo: initialJobCardNo,
}: {
  isOpen: boolean
  onClose: () => void
  jobCardNo?: string
}) {
  const [step, setStep] = React.useState(1)
  const [saving, setSaving] = React.useState(false)

  const [jobCardNo, setJobCardNo] = React.useState(initialJobCardNo ?? '')
  const [inspectedBy, setInspectedBy] = React.useState('')
  const [remarks, setRemarks] = React.useState('')
  const [defectives, setDefectives] = React.useState('0')
  const [characteristics, setCharacteristics] = React.useState<FgCharacteristic[]>(blankCharacteristics())

  // Laboratory numbers that go on the certificate
  const [avgThickness, setAvgThickness] = React.useState('')
  const [depth, setDepth] = React.useState('')
  const [clarity, setClarity] = React.useState<FgResult>('PASS')
  const [migration, setMigration] = React.useState('CONFORMS')
  const [releasedBy, setReleasedBy] = React.useState('')
  const [sealRecord, setSealRecord] = React.useState(true)

  React.useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setJobCardNo(initialJobCardNo ?? '')
    setCharacteristics(blankCharacteristics())
    setDefectives('0')
    setRemarks('')
  }, [isOpen, initialJobCardNo])

  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const packing = PACKING_RECORDS.find((p) => p.jobCardNo === jobCardNo)
  const existingCoa = COAS.find((c) => c.jobCardNo === jobCardNo)

  const lotSize = packing?.goodPiecesQty ?? 0
  const sampleSize = sampleSizeFor(lotSize)
  const defectivesNum = Number(defectives) || 0

  const setCharacteristic = (index: number, patch: Partial<FgCharacteristic>) =>
    setCharacteristics((cs) => cs.map((c, i) => (i === index ? { ...c, ...patch } : c)))

  const allObserved = characteristics.every((c) => c.observed.trim().length > 0)
  const reportPasses = fgReportPasses({ characteristics, defectivesFound: defectivesNum, acceptanceNumber: ACCEPTANCE_NUMBER })
  const inspectionDone = allObserved && Boolean(inspectedBy)

  /* The checks recorded for this job across the shift, which is one of the
     three things the certificate is released against. */
  const checksRecorded = IN_PROCESS_CHECKS.filter((c) => c.jobCardNo === jobCardNo).length
  const openNcs = jobCardNo ? openNcsFor(jobCardNo).length : 0

  const blockers = coaBlockers({
    fgReportPassed: inspectionDone && reportPasses,
    hourlyChecksRecorded: checksRecorded,
    hourlyChecksRequired: IN_PROCESS_CHECK_COUNT,
    openNonConformances: openNcs,
  })

  const canRelease =
    blockers.length === 0 && Boolean(avgThickness) && Boolean(depth) && Boolean(releasedBy)

  const canReach = (id: number) => {
    if (id <= 1) return true
    if (id === 2) return Boolean(jobCardNo) && lotSize > 0
    if (id === 3) return inspectionDone
    return false
  }

  const blockedReason = () => {
    if (step === 1) {
      if (!jobCardNo) return 'Select the job card being certified'
      if (lotSize === 0) return 'This job has nothing packed to inspect yet'
      return null
    }
    if (step === 2) {
      if (!allObserved) return 'Record what was observed against every characteristic'
      if (!inspectedBy) return 'Name the QC executive who carried out the inspection'
      if (!reportPasses) return 'The lot fails inspection; raise a non-conformance instead of certifying it'
      return null
    }
    if (blockers.length > 0) return blockers[0]
    if (!avgThickness || !depth) return 'Enter the laboratory readings that go on the certificate'
    if (!releasedBy) return 'The certificate has to be released by a named QC executive'
    return null
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
      title="Finished Goods Inspection & COA"
      subtitle={
        existingCoa
          ? `${existingCoa.coaNumber} · already released`
          : 'Inspect the packed lot, then release the certificate against it'
      }
      badge={
        blockers.length === 0 && step === 3
          ? { label: 'Clear to certify', tone: 'success' }
          : { label: 'Gated', tone: 'error' }
      }
      size="master"
      onSave={handleSave}
      saving={saving}
      saveDisabled={step !== 3 || !canRelease}
      saveLabel="Release certificate"
      saveIcon={FileCheck2}
      footerNote={blockedReason() ?? 'Ready to release'}
      footerActions={
        <>
          <Button variant="ghost" icon={ChevronLeft} disabled={step === 1 || saving} onClick={() => setStep((s) => Math.max(s - 1, 1))}>
            Back
          </Button>
          {step < STEPS.length ? (
            <Button variant="primary" icon={ChevronRight} disabled={!canReach(step + 1)} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-5">
        <HeaderSteps steps={STEPS} currentStep={step} onStepClick={(id) => { if (canReach(id)) setStep(id) }} />
      </div>

      {step === 1 ? (
        <FormSection title="The lot offered">
          <FormGrid cols={3}>
            <Select
              label="Job card"
              required
              placeholder="Select job card"
              value={jobCardNo}
              onChange={(e) => setJobCardNo(e.target.value)}
              options={PACKING_RECORDS.map((p) => ({
                value: p.jobCardNo,
                label: `${p.jobCardNo} — ${p.customerName}`,
              }))}
            />
            <DerivedField label="Customer" value={job?.customerName ?? packing?.customerName ?? '—'} />
            <DerivedField label="Artwork" value={job?.artworkCode ?? '—'} />
            <DerivedField label="Lot size" value={lotSize > 0 ? `${formatNumber(lotSize)} pieces` : '—'} emphasis />
            <DerivedField label="Sample to draw" value={sampleSize > 0 ? `${sampleSize} pieces` : '—'} emphasis />
            <DerivedField label="Acceptance number" value={`${ACCEPTANCE_NUMBER} defective`} />
          </FormGrid>
          <p className="mt-2.5 text-xs text-fg-muted">
            The sample is the square root of the lot, drawn across every pallet rather than off the top of one.
          </p>
        </FormSection>
      ) : null}

      {step === 2 ? (
        <>
          <FormSection title="Characteristics">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th className="label-caps border-b border-bd-default px-3 py-2 text-left">Characteristic</th>
                    <th className="label-caps border-b border-bd-default px-3 py-2 text-left">Specification</th>
                    <th className="label-caps border-b border-bd-default px-3 py-2 text-left">Observed</th>
                    <th className="label-caps border-b border-bd-default px-3 py-2 text-center">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {characteristics.map((c, i) => (
                    <tr key={c.characteristic} className="border-b border-bd-subtle last:border-b-0">
                      <td className="px-3 py-1.5 text-sm">{c.characteristic}</td>
                      <td className="px-3 py-1.5 text-xs text-fg-muted">{c.specification}</td>
                      <td className="px-3 py-1.5">
                        <Input
                          aria-label={`Observed value for ${c.characteristic}`}
                          value={c.observed}
                          onChange={(e) => setCharacteristic(i, { observed: e.target.value })}
                          placeholder="Measured or seen"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className="flex justify-center gap-1">
                          {(['PASS', 'FAIL'] as FgResult[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              aria-pressed={c.result === r}
                              onClick={() => setCharacteristic(i, { result: r })}
                              className={cn(
                                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                c.result === r
                                  ? r === 'PASS'
                                    ? 'border-success bg-success text-fg-inverse'
                                    : 'border-error bg-error text-fg-inverse'
                                  : 'border-bd-default text-fg-muted hover:bg-bg-hover hover:text-fg-default',
                              )}
                            >
                              {r === 'PASS' ? 'Pass' : 'Fail'}
                            </button>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>

          <FormSection title="Result">
            <FormGrid cols={3}>
              <Input
                label="Defectives found in the sample"
                type="number"
                value={defectives}
                onChange={(e) => setDefectives(e.target.value)}
                helper={`Sample of ${sampleSize}, acceptance number ${ACCEPTANCE_NUMBER}`}
              />
              <EmployeePicker
                label="Inspected by (QC)"
                required
                placeholder="Select QC executive"
                value={inspectedBy}
                onChange={setInspectedBy}
                options={qcOptions}
              />
              <DerivedField
                label="Lot result"
                value={reportPasses ? 'Accepted' : 'Rejected'}
                emphasis={reportPasses}
              />
            </FormGrid>
            <Textarea label="Remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            {!reportPasses && allObserved ? (
              <p className="mt-2 text-xs text-error">
                A failed characteristic or a defective in the sample rejects the lot. Raise a non-conformance
                against the job card rather than certifying it.
              </p>
            ) : null}
          </FormSection>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <FormSection title="What the certificate is released against">
            <ul className="space-y-1.5">
              {[
                {
                  label: 'Finished goods inspection',
                  detail: `Sample of ${sampleSize} from ${formatNumber(lotSize)} pieces`,
                  ok: inspectionDone && reportPasses,
                },
                {
                  label: 'In-process checks across the shift',
                  detail: `${checksRecorded} of ${IN_PROCESS_CHECK_COUNT} recorded`,
                  ok: checksRecorded >= IN_PROCESS_CHECK_COUNT,
                },
                {
                  label: 'Non-conformance register',
                  detail: openNcs > 0 ? `${openNcs} still open against this job` : 'Nothing open against this job',
                  ok: openNcs === 0,
                },
              ].map((row) => (
                <li
                  key={row.label}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-bd-default px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-sm">{row.label}</span>
                    <span className="block text-xs text-fg-muted">{row.detail}</span>
                  </span>
                  <Badge tone={row.ok ? 'success' : 'error'}>{row.ok ? 'Satisfied' : 'Outstanding'}</Badge>
                </li>
              ))}
            </ul>
          </FormSection>

          <FormSection title="Laboratory readings">
            <FormGrid cols={3}>
              <Input
                label="Average thickness"
                unit="µm"
                required
                type="number"
                value={avgThickness}
                onChange={(e) => setAvgThickness(e.target.value)}
                helper={job ? `Reel gauge ${job.thicknessMicrons} µm` : undefined}
              />
              <Input
                label="Depth of draw"
                unit="mm"
                required
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
              <Select
                label="Visual clarity"
                value={clarity}
                onChange={(e) => setClarity(e.target.value as FgResult)}
                options={[
                  { value: 'PASS', label: 'Pass, no haze or crazing' },
                  { value: 'FAIL', label: 'Fail' },
                ]}
              />
              <Select
                label="Migration test"
                value={migration}
                onChange={(e) => setMigration(e.target.value)}
                options={[
                  { value: 'CONFORMS', label: 'Conforms, food grade' },
                  { value: 'NOT_APPLICABLE', label: 'Not applicable' },
                  { value: 'FAILED', label: 'Failed' },
                ]}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Release">
            <FormGrid cols={2}>
              <EmployeePicker
                label="Released by (QC)"
                required
                placeholder="Select QC executive"
                value={releasedBy}
                onChange={setReleasedBy}
                options={qcOptions}
              />
              <div className="flex items-end">
                <Checkbox
                  label="Seal the record against further editing"
                  hint="GDP audit lock: the certificate and the records behind it become read-only"
                  checked={sealRecord}
                  onChange={(e) => setSealRecord(e.target.checked)}
                />
              </div>
            </FormGrid>
            {blockers.length > 0 ? (
              <div className="mt-3 flex items-start gap-3 rounded-md border border-error/35 bg-error-subtle p-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                <div>
                  <h5 className="text-sm font-semibold text-error">Certificate held</h5>
                  <ul className="mt-1 space-y-0.5 text-xs text-fg-muted">
                    {blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </FormSection>
        </>
      ) : null}
    </StandardModal>
  )
}

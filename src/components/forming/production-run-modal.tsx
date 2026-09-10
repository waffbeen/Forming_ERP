'use client'

import * as React from 'react'
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, FileText, Flame, Lock,
  PlayCircle, RotateCcw, StopCircle, Trash2, X,
} from 'lucide-react'
import { HeaderSteps } from 'indas-ui'
import { StandardModal } from '@/components/modals'
import { EmployeePicker } from '@/components/modals'
import {
  Badge, Button, Checkbox, DerivedField, FormGrid, FormSection, Input, Select,
} from '@/components/ui'
import { ZoneTemperatures } from './zone-temperatures'
import { ParameterResults } from './parameter-results'
import { DefectChecklist } from './defect-checklist'
import type { DefectCheck } from './defect-checklist'
import {
  DOCUMENTS, FORMING_DEFECTS, IN_PROCESS_CHECK_COUNT, LINE_CLEARANCE_AREAS, PLANT,
  CUTTING_DEFECTS, formingWindowFor,
} from '@/config/plant'
import { EMPLOYEES, JOB_CARDS, MACHINES, USERS, ZONE_TEMPERATURES } from '@/data'
import { formatNumber } from '@/lib/utils'
import { discardDraft, listDrafts, loadDraft, restoreDraft, saveDraft, savedAgo } from '@/lib/run-drafts'
import type { RunDraft } from '@/lib/run-drafts'
import { firstPieceApproved, lineClearanceComplete } from '@/types/run-record'
import type {
  ParameterResult, RunFirstPieceAttempt, RunInProcessCheck, RunLineClearance, RunSection,
} from '@/types/run-record'

const STEPS = [
  { id: 1, label: 'Job details', icon: FileText },
  { id: 2, label: 'Line clearance', icon: Lock },
  { id: 3, label: 'First piece', icon: ClipboardCheck },
  { id: 4, label: 'Job start', icon: PlayCircle },
  { id: 5, label: 'In-process', icon: Flame },
  { id: 6, label: 'Job end', icon: StopCircle },
]

function nameOf(employeeId: string) {
  const employee = EMPLOYEES.find((e) => e.employeeId === employeeId)
  return USERS.find((u) => u.userId === employee?.userId)?.userName ?? ''
}

const operatorOptions = EMPLOYEES.filter((e) => e.department === 'Production').map((e) => ({
  value: e.employeeId,
  label: nameOf(e.employeeId) || e.employeeCode,
}))

const qcOptions = EMPLOYEES.filter((e) => e.department === 'Quality').map((e) => ({
  value: e.employeeId,
  label: nameOf(e.employeeId) || e.employeeCode,
}))

const now = () => new Date().toTimeString().slice(0, 5)

/**
 * The shop-floor run, worked in the order the paper record is worked.
 *
 * Each stage gates the next, which is the whole point of the format: line
 * clearance is signed before a first piece exists, the first piece is approved
 * before the job starts, and quantities cannot be entered on a job that never
 * started. The step rail refuses to move forward until the current stage is
 * genuinely complete.
 */
export function ProductionRunModal({
  isOpen,
  onClose,
  section,
  resumeJobCardNo,
  resumeMachineCode,
}: {
  isOpen: boolean
  onClose: () => void
  section: RunSection
  /** Open straight into this job's part-worked run. */
  resumeJobCardNo?: string
  /** Which machine's run to reopen, when the page named one. */
  resumeMachineCode?: string
}) {
  const isForming = section === 'FORMING'
  const parameters = isForming ? FORMING_DEFECTS : CUTTING_DEFECTS

  const documentNo = isForming ? DOCUMENTS.productionForming : DOCUMENTS.productionCutting
  const qcDocumentNo = isForming ? DOCUMENTS.qcForming : DOCUMENTS.qcCutting

  const [step, setStep] = React.useState(1)
  const [saving, setSaving] = React.useState(false)

  // Job details
  const [jobCardNo, setJobCardNo] = React.useState('')
  /* The press this run is on. The job card names one, but the same job is
     regularly split across two, and each machine keeps its own record. */
  const [machineCode, setMachineCode] = React.useState('')
  const [shift, setShift] = React.useState('A')
  const [dieNo, setDieNo] = React.useState('')
  const [rollNo, setRollNo] = React.useState('')
  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  /** The heater band to hold, for the polymer this job actually runs. */
  const formingWindow = formingWindowFor(job?.materialType)

  // Line clearance
  const [clearance, setClearance] = React.useState<RunLineClearance>({
    previousJobCardNo: '',
    previousJobName: '',
    productCode: '',
    operation: isForming ? 'Forming' : 'Cutting',
    areasChecked: {},
    operatorName: '',
    operatorSignedAt: null,
    supervisorName: '',
    supervisorSignedAt: null,
  })

  // First piece approval
  const [fpaResults, setFpaResults] = React.useState<Record<string, ParameterResult>>({})
  /** Every go at the first piece so far. The one on screen is the current go. */
  const [fpaAttempts, setFpaAttempts] = React.useState<RunFirstPieceAttempt[]>([])
  const [correctiveAction, setCorrectiveAction] = React.useState('')
  const [fpaOperator, setFpaOperator] = React.useState('')
  const [fpaQc, setFpaQc] = React.useState('')
  const [afterPowerFailure, setAfterPowerFailure] = React.useState(false)

  // Job start
  const [dieMountStart, setDieMountStart] = React.useState('')
  const [dieMountEnd, setDieMountEnd] = React.useState('')
  const [heatingMins, setHeatingMins] = React.useState('')
  const [machineStart, setMachineStart] = React.useState('')

  // In-process: one signed record per hourly check, not a tally
  const [checks, setChecks] = React.useState<RunInProcessCheck[]>([])
  const [draftCheck, setDraftCheck] = React.useState<RunInProcessCheck | null>(null)

  // Job end
  const [machineStop, setMachineStop] = React.useState('')
  const [jobEnd, setJobEnd] = React.useState('')
  const [startCounter, setStartCounter] = React.useState('')
  const [endCounter, setEndCounter] = React.useState('')
  const [issuedWeight, setIssuedWeight] = React.useState('')
  const [returnedWeight, setReturnedWeight] = React.useState('')
  const [cavities, setCavities] = React.useState('')
  const [formedSheets, setFormedSheets] = React.useState('')
  const [makeReady, setMakeReady] = React.useState('')
  const [wastageSheets, setWastageSheets] = React.useState('')
  const [cutQty, setCutQty] = React.useState('')
  const [wasteGrams, setWasteGrams] = React.useState('')
  const [wasteNos, setWasteNos] = React.useState('')
  const [rejectionAfterSorting, setRejectionAfterSorting] = React.useState('')
  const [perBag, setPerBag] = React.useState('')
  const [perBox, setPerBox] = React.useState('')

  /* ------------------------------------------------------ Runs left open */

  const [openDrafts, setOpenDrafts] = React.useState<RunDraft[]>([])
  /** The last run discarded on this screen, kept so it can be put back. */
  const [justDiscarded, setJustDiscarded] = React.useState<RunDraft | null>(null)
  const [resumedAt, setResumedAt] = React.useState<string | null>(null)

  const emptyClearance = (): RunLineClearance => ({
    previousJobCardNo: '',
    previousJobName: '',
    productCode: '',
    operation: isForming ? 'Forming' : 'Cutting',
    areasChecked: {},
    operatorName: '',
    operatorSignedAt: null,
    supervisorName: '',
    supervisorSignedAt: null,
  })

  /** Every field on the form in one bag, for keeping and putting back. */
  const collect = () => ({
    shift, dieNo, rollNo, clearance, fpaResults, fpaAttempts, fpaOperator, fpaQc, afterPowerFailure,
    machineCode, dieMountStart, dieMountEnd, heatingMins, machineStart, checks,
    machineStop, jobEnd, startCounter, endCounter, issuedWeight, returnedWeight,
    cavities, formedSheets, makeReady, wastageSheets,
    cutQty, wasteGrams, wasteNos, rejectionAfterSorting, perBag, perBox,
  })

  type RunValues = ReturnType<typeof collect>
  const text = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

  /** Put a stored run back on the form, or clear it when given nothing. */
  const apply = (v: Partial<RunValues>) => {
    setShift(text(v.shift, 'A'))
    setDieNo(text(v.dieNo))
    setRollNo(text(v.rollNo))
    setClearance(v.clearance ?? emptyClearance())
    setFpaResults(v.fpaResults ?? {})
    setFpaAttempts(Array.isArray(v.fpaAttempts) ? v.fpaAttempts : [])
    setCorrectiveAction('')
    setFpaOperator(text(v.fpaOperator))
    setFpaQc(text(v.fpaQc))
    setAfterPowerFailure(Boolean(v.afterPowerFailure))
    setDieMountStart(text(v.dieMountStart))
    setDieMountEnd(text(v.dieMountEnd))
    setHeatingMins(text(v.heatingMins))
    setMachineStart(text(v.machineStart))
    setChecks(Array.isArray(v.checks) ? v.checks : [])
    setDraftCheck(null)
    setMachineStop(text(v.machineStop))
    setJobEnd(text(v.jobEnd))
    setStartCounter(text(v.startCounter))
    setEndCounter(text(v.endCounter))
    setIssuedWeight(text(v.issuedWeight))
    setReturnedWeight(text(v.returnedWeight))
    setCavities(text(v.cavities))
    setFormedSheets(text(v.formedSheets))
    setMakeReady(text(v.makeReady))
    setWastageSheets(text(v.wastageSheets))
    setCutQty(text(v.cutQty))
    setWasteGrams(text(v.wasteGrams))
    setWasteNos(text(v.wasteNos))
    setRejectionAfterSorting(text(v.rejectionAfterSorting))
    setPerBag(text(v.perBag))
    setPerBox(text(v.perBox))
  }

  /**
   * Move to one run — a job card on a machine — picking it up where it was
   * left. A job with no machine chosen yet opens on the one its card names.
   */
  const selectRun = React.useCallback(
    (nextJob: string, nextMachine?: string) => {
      const card = JOB_CARDS.find((j) => j.jobCardNo === nextJob)
      const machine =
        nextMachine ??
        (isForming ? card?.formingMachineCode : card?.cuttingMachineCode) ??
        ''

      setJobCardNo(nextJob)
      setMachineCode(nextJob ? machine : '')

      const draft = nextJob ? loadDraft(section, nextJob, machine) : null
      if (draft) {
        apply(draft.values as Partial<RunValues>)
        setStep(draft.step)
        setResumedAt(draft.savedAt)
      } else {
        apply({})
        setStep(1)
        setResumedAt(null)
      }
      // The machine is part of the run's identity, so it survives apply().
      setMachineCode(nextJob ? machine : '')
    },
    // apply and emptyClearance are stable for the life of one open screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section, isForming],
  )

  /** Kept for the call sites that only know the job card. */
  const selectJob = React.useCallback((next: string) => selectRun(next), [selectRun])

  /* Opening the screen shows what was left open, and goes straight into a run
     when the operator picked one from the log. */
  React.useEffect(() => {
    if (!isOpen) return
    setOpenDrafts(listDrafts(section))
    if (resumeJobCardNo !== undefined) selectRun(resumeJobCardNo, resumeMachineCode)
  }, [isOpen, section, resumeJobCardNo, resumeMachineCode, selectRun])

  /* Closing is not abandoning. A run is worked across a whole shift, so what
     has been entered against a job card is kept and reopens where it was. */
  const handleClose = () => {
    if (jobCardNo) saveDraft({ section, jobCardNo, machineCode, step, values: collect() })
    onClose()
  }

  /**
   * Throw away an open run — but hold on to it, because a shift's work should
   * never be one mis-tap from gone. It goes back with a single press until the
   * operator moves on.
   */
  const forget = (job: string, machine: string) => {
    const removed = discardDraft(section, job, machine)
    setOpenDrafts(listDrafts(section))
    setJustDiscarded(removed)
    if (job === jobCardNo && machine === machineCode) selectJob('')
  }

  const undoDiscard = () => {
    if (!justDiscarded) return
    restoreDraft(justDiscarded)
    setOpenDrafts(listDrafts(section))
    setJustDiscarded(null)
  }

  const clearanceDone = lineClearanceComplete(clearance, LINE_CLEARANCE_AREAS)
  const fpaDone = firstPieceApproved(
    { results: fpaResults, producedByOperator: fpaOperator, verifiedByQc: fpaQc, approvedAt: null, afterPowerFailure, remarks: '' },
    parameters,
  )
  const started = Boolean(machineStart)

  /* A step opens only when everything before it is genuinely complete. */
  const canReach = (id: number) => {
    if (id <= 1) return true
    if (id === 2) return Boolean(jobCardNo)
    if (id === 3) return clearanceDone
    if (id === 4) return fpaDone
    if (id === 5) return started
    if (id === 6) return started
    return false
  }

  /* What is holding up the step being worked, rather than the run as a whole,
     so the note under the form answers the question the operator is asking. */
  const blockedReason = () => {
    if (step === 1) return jobCardNo ? null : 'Select the job card to continue'
    if (step === 2) return clearanceDone ? null : 'All six areas must be checked and both signatures taken'
    if (step === 3) {
      if (fpaDone) return null
      if (fpaDefects.length > 0) {
        return 'Record this rejected piece, correct the machine, and make a fresh one'
      }
      return 'Every parameter must be checked, none a defect, and QC named'
    }
    if (step === 4) return started ? null : 'Enter the machine start time to run the job'
    if (step === 5 && draftCheck && !draftComplete)
      return 'Mark every parameter on this check and name the QC executive who signed it'
    if (step === 6 && returnedOverIssued) return 'Returned reel weight cannot exceed what was issued'
    if (step === 6 && !canSave) return 'Enter the job end time and the quantities produced'
    return null
  }

  const toggleArea = (area: string) =>
    setClearance((c) => ({ ...c, areasChecked: { ...c.areasChecked, [area]: !c.areasChecked[area] } }))

  const setParameter = (parameter: string, value: ParameterResult) =>
    setFpaResults((r) => ({ ...r, [parameter]: value }))

  /* ------------------------------------------------- In-process checks */

  const lastCheck = checks.length > 0 ? checks[checks.length - 1] : null

  /* The QC executive who signed the last check is almost always the one
     signing this one: they are on the same shift, on the same line. */
  const startCheck = () =>
    setDraftCheck({
      checkNo: checks.length + 1,
      time: now(),
      inspector: lastCheck?.inspector ?? fpaQc,
      results: {},
    })

  const setCheckParameter = (parameter: string, value: ParameterResult) =>
    setDraftCheck((c) => (c ? { ...c, results: { ...c.results, [parameter]: value } } : c))

  /** Marks the whole format at once, which is what a clean check is. */
  const setAllCheckParameters = (value: ParameterResult) =>
    setDraftCheck((c) =>
      c
        ? {
            ...c,
            results: Object.fromEntries(parameters.map((parameter) => [parameter, value])),
          }
        : c,
    )

  /** Carries the previous check forward, defects and all, to be edited. */
  const copyPreviousCheck = () =>
    setDraftCheck((c) => (c && lastCheck ? { ...c, results: { ...lastCheck.results } } : c))

  /** The same two shortcuts on the first piece, which reads the same format. */
  const setAllFpaParameters = (value: ParameterResult) =>
    setFpaResults(Object.fromEntries(parameters.map((parameter) => [parameter, value])))

  const fpaDefects = parameters.filter((p) => fpaResults[p] === 'DEFECT')
  const fpaAllChecked = parameters.every((p) => fpaResults[p] && fpaResults[p] !== 'NOT_CHECKED')

  /**
   * A rejected first piece is recorded, the machine is corrected, and the next
   * piece is judged fresh. The operator and QC carry over — the same two people
   * are standing at the machine — but the marks do not, because this is a new
   * piece and not an edit of the one that failed.
   */
  const recordFailedAttempt = () => {
    if (fpaDefects.length === 0 || !fpaAllChecked || !fpaQc || !correctiveAction.trim()) return
    setFpaAttempts((a) => [
      ...a,
      {
        attemptNo: a.length + 1,
        at: now(),
        results: { ...fpaResults },
        producedByOperator: fpaOperator,
        verifiedByQc: fpaQc,
        outcome: 'FAILED',
        correctiveAction: correctiveAction.trim(),
        afterPowerFailure,
      },
    ])
    setFpaResults({})
    setCorrectiveAction('')
  }

  const canRecordFailure =
    fpaDefects.length > 0 && fpaAllChecked && Boolean(fpaQc) && correctiveAction.trim().length > 0

  /** A check is only a record once every parameter was looked at and QC signed. */
  const draftComplete =
    draftCheck !== null &&
    Boolean(draftCheck.inspector) &&
    parameters.every((p) => draftCheck.results[p] && draftCheck.results[p] !== 'NOT_CHECKED')

  const commitCheck = () => {
    if (!draftCheck || !draftComplete) return
    setChecks((c) => [...c, draftCheck])
    setDraftCheck(null)
  }

  /** Defects found across the shift, which is what a non-conformance is raised on. */
  const checkDefects = checks.flatMap((c) =>
    parameters.filter((p) => c.results[p] === 'DEFECT').map((p) => ({ checkNo: c.checkNo, time: c.time, parameter: p })),
  )

  /* The live grid, in the shape of the paper format: the FPA column, then the
     checks recorded so far, then the empty slots still to be filled. */
  const gridChecks: DefectCheck[] = [
    { id: 'FPA', time: fpaDone ? 'Approved' : '—', inspector: nameOf(fpaQc) || fpaQc, results: fpaResults },
    ...checks.map((c) => ({
      id: String(c.checkNo),
      time: c.time,
      inspector: nameOf(c.inspector) || c.inspector,
      results: c.results,
    })),
    ...Array.from({ length: Math.max(IN_PROCESS_CHECK_COUNT - checks.length, 0) }, (_, i) => ({
      id: String(checks.length + i + 1),
      time: '—',
      inspector: '',
      results: {},
    })),
  ]

  // Derived output, so the operator never adds up what the system can.
  const formedNum = Number(formedSheets) || 0
  const cavityNum = Number(cavities) || 0
  const totalPieces = formedNum * cavityNum
  const cutNum = Number(cutQty) || 0
  const rejectNum = Number(rejectionAfterSorting) || 0
  const finalFg = Math.max(cutNum - rejectNum, 0)
  const perBoxNum = Number(perBox) || 0
  const totalBoxes = perBoxNum > 0 ? Math.floor(finalFg / perBoxNum) : 0

  /* Counter strokes and the reel that fed them, from spec table 4. The counter
     is the machine's own count of sheets run; the reel weights are what the
     store issued against what came back, and the two have to tell the same
     story before the run posts. */
  const counterStrokes = Math.max((Number(endCounter) || 0) - (Number(startCounter) || 0), 0)
  const issuedKg = Number(issuedWeight) || 0
  const returnedKg = Number(returnedWeight) || 0
  const consumedKg = Math.max(issuedKg - returnedKg, 0)
  const gramsPerSheet = formedNum > 0 && consumedKg > 0 ? (consumedKg * 1000) / formedNum : 0
  const counterMismatch =
    isForming && counterStrokes > 0 && formedNum > 0 && Math.abs(counterStrokes - formedNum) > 0
  const returnedOverIssued = isForming && issuedKg > 0 && returnedKg > issuedKg

  const canSave =
    started &&
    Boolean(jobEnd) &&
    (isForming ? formedNum > 0 && !returnedOverIssued : cutNum > 0)

  /* A posted run is finished, so the open copy of it goes. */
  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      if (jobCardNo) discardDraft(section, jobCardNo, machineCode)
      selectJob('')
      onClose()
    }, 500)
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isForming ? 'Forming Run' : 'Cutting Run'}
      subtitle={`${documentNo} · quality checklist ${qcDocumentNo}`}
      badge={
        clearanceDone && fpaDone
          ? { label: 'Cleared to run', tone: 'success' }
          : { label: 'Gated', tone: 'error' }
      }
      size="master"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!canSave}
      saveLabel="Post run record"
      cancelLabel={jobCardNo ? 'Close and keep' : 'Cancel'}
      footerNote={blockedReason() ?? (step === 6 ? 'Ready to post' : `Step ${step} of ${STEPS.length} complete`)}
      footerActions={
        <>
          <Button variant="ghost" icon={ChevronLeft} disabled={step === 1 || saving} onClick={() => setStep((s) => Math.max(s - 1, 1))}>
            Back
          </Button>
          {step < STEPS.length ? (
            <Button
              variant="primary"
              icon={ChevronRight}
              disabled={!canReach(step + 1)}
              onClick={() => setStep((s) => Math.min(s + 1, STEPS.length))}
            >
              Next
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-5">
        <HeaderSteps
          steps={STEPS}
          currentStep={step}
          onStepClick={(id) => {
            if (canReach(id)) setStep(id)
          }}
        />
        {resumedAt ? (
          <p className="mt-2.5 text-xs text-fg-muted">
            Resumed from the run saved {savedAgo(resumedAt)}
          </p>
        ) : null}
      </div>

      {/* ------------------------------- Runs the operator left open */}
      {step === 1 && (openDrafts.length > 0 || justDiscarded) ? (
        <FormSection
          title="Runs left open"
          description="One per machine: two presses on the same job card keep two records, and neither overwrites the other."
        >
          <ul className="space-y-1.5">
            {openDrafts.map((draft) => {
              const isThisRun = draft.jobCardNo === jobCardNo && draft.machineCode === machineCode
              return (
                <li
                  key={`${draft.jobCardNo}|${draft.machineCode}`}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-bd-default px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-sm">{draft.jobCardNo}</span>
                    {draft.machineCode ? (
                      <span className="ml-2 font-mono text-xs text-primary">{draft.machineCode}</span>
                    ) : (
                      <span className="ml-2 text-xs text-fg-subtle">no machine recorded</span>
                    )}
                    <span className="ml-2 text-xs text-fg-muted">
                      {STEPS[Math.min(Math.max(draft.step, 1), STEPS.length) - 1].label} · saved{' '}
                      {savedAgo(draft.savedAt)}
                    </span>
                  </span>
                  <Button
                    variant="primary"
                    icon={RotateCcw}
                    disabled={isThisRun}
                    onClick={() => selectRun(draft.jobCardNo, draft.machineCode)}
                  >
                    {isThisRun ? 'Open' : 'Resume'}
                  </Button>
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => forget(draft.jobCardNo, draft.machineCode)}
                  >
                    Discard
                  </Button>
                </li>
              )
            })}
          </ul>

          {justDiscarded ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-warning/50 bg-warning-subtle px-3 py-2">
              <span className="min-w-0 flex-1 text-xs text-fg-muted">
                Discarded{' '}
                <span className="font-mono">
                  {justDiscarded.jobCardNo}
                  {justDiscarded.machineCode ? ` · ${justDiscarded.machineCode}` : ''}
                </span>
                . Nothing is posted, so the entry is gone once you leave this screen.
              </span>
              <Button icon={RotateCcw} onClick={undoDiscard}>
                Put it back
              </Button>
            </div>
          ) : null}
        </FormSection>
      ) : null}

      {/* ------------------------------------------------ 1. Job details */}
      {step === 1 ? (
        <FormSection title="Job details">
          <FormGrid cols={3}>
            <Select
              label="Job card"
              required
              placeholder="Select job card"
              value={jobCardNo}
              onChange={(e) => selectJob(e.target.value)}
              options={JOB_CARDS.map((j) => ({ value: j.jobCardNo, label: `${j.jobCardNo} — ${j.customerName}` }))}
            />
            <Select
              label="Shift"
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              options={[
                { value: 'A', label: 'Shift A' },
                { value: 'B', label: 'Shift B' },
              ]}
            />
            <Input label="Date" type="date" defaultValue="2026-09-09" />
            <DerivedField label="Job name" value={job?.artworkCode ?? '—'} />
            <DerivedField label="Client name" value={job?.customerName ?? '—'} />
            <DerivedField label="PO number" value={job?.soNumber ?? '—'} />
            {isForming ? (
              <>
                <Input label="Die no" mono value={dieNo} onChange={(e) => setDieNo(e.target.value)} placeholder="FD-0312" />
                <Input label="Vendor roll no" mono value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="RL-9241" />
                <Select
                  label="Forming line"
                  required
                  placeholder="Select the machine"
                  value={machineCode}
                  onChange={(e) => selectRun(jobCardNo, e.target.value)}
                  options={MACHINES.filter((m) => m.type === 'FORMING').map((m) => ({
                    value: m.machineCode,
                    label: `${m.machineCode} — ${m.machineName}`,
                  }))}
                  helper={
                    job && machineCode !== job.formingMachineCode
                      ? `Job card names ${job.formingMachineCode}; this run keeps its own record`
                      : 'Each machine keeps its own record of this job'
                  }
                />
                <DerivedField label="Material type" value={job?.materialType ?? '—'} />
                <DerivedField label="Micron" value={job ? `${job.thicknessMicrons} µm` : '—'} />
                <DerivedField label="Roll size" value="620 mm" />
              </>
            ) : (
              <>
                <Select
                  label="Cutting press"
                  required
                  placeholder="Select the machine"
                  value={machineCode}
                  onChange={(e) => selectRun(jobCardNo, e.target.value)}
                  options={MACHINES.filter((m) => m.type === 'CUTTING').map((m) => ({
                    value: m.machineCode,
                    label: `${m.machineCode} — ${m.machineName}`,
                  }))}
                  helper={
                    job && machineCode !== job.cuttingMachineCode
                      ? `Job card names ${job.cuttingMachineCode}; this run keeps its own record`
                      : 'Each machine keeps its own record of this job'
                  }
                />
                <Input label="Remark 1" placeholder="Optional" />
                <Input label="Remark 2" placeholder="Optional" />
              </>
            )}
          </FormGrid>
        </FormSection>
      ) : null}

      {/* --------------------------------------------- 2. Line clearance */}
      {step === 2 ? (
        <>
          <FormSection title="Previous job">
            <FormGrid cols={2}>
              <Input label="Previous job card no" mono value={clearance.previousJobCardNo} onChange={(e) => setClearance((c) => ({ ...c, previousJobCardNo: e.target.value }))} />
              <Input label="Job name" value={clearance.previousJobName} onChange={(e) => setClearance((c) => ({ ...c, previousJobName: e.target.value }))} />
              <Input label="Product code" mono value={clearance.productCode} onChange={(e) => setClearance((c) => ({ ...c, productCode: e.target.value }))} />
              <DerivedField label="Operation" value={clearance.operation} />
            </FormGrid>
          </FormSection>

          <FormSection title="Areas identified to check">
            <FormGrid cols={2}>
              {LINE_CLEARANCE_AREAS.map((area) => (
                <Checkbox
                  key={area}
                  label={area}
                  checked={Boolean(clearance.areasChecked[area])}
                  onChange={() => toggleArea(area)}
                />
              ))}
            </FormGrid>
            <p className="mt-3 rounded-md border border-bd-default bg-bg-subtle px-3 py-2 text-xs italic text-fg-muted">
              I have personally checked the above areas and the records of the previous product, to prevent any product
              mix.
            </p>
          </FormSection>

          <FormSection title="Signatures">
            <FormGrid cols={2}>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <EmployeePicker
                    label="Machine operator"
                    placeholder="Select operator"
                    value={clearance.operatorName}
                    onChange={(next) => setClearance((c) => ({ ...c, operatorName: next }))}
                    options={operatorOptions}
                  />
                </div>
                <Button
                  variant={clearance.operatorSignedAt ? 'ghost' : 'primary'}
                  disabled={!clearance.operatorName || Boolean(clearance.operatorSignedAt)}
                  onClick={() => setClearance((c) => ({ ...c, operatorSignedAt: now() }))}
                >
                  {clearance.operatorSignedAt ? `Signed ${clearance.operatorSignedAt}` : 'Sign'}
                </Button>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <EmployeePicker
                    label="Production / QC supervisor"
                    placeholder="Select supervisor"
                    value={clearance.supervisorName}
                    onChange={(next) => setClearance((c) => ({ ...c, supervisorName: next }))}
                    options={qcOptions}
                  />
                </div>
                <Button
                  variant={clearance.supervisorSignedAt ? 'ghost' : 'primary'}
                  disabled={!clearance.supervisorName || Boolean(clearance.supervisorSignedAt)}
                  onClick={() => setClearance((c) => ({ ...c, supervisorSignedAt: now() }))}
                >
                  {clearance.supervisorSignedAt ? `Signed ${clearance.supervisorSignedAt}` : 'Sign'}
                </Button>
              </div>
            </FormGrid>
          </FormSection>
        </>
      ) : null}

      {/* ------------------------------------------ 3. First piece approval */}
      {step === 3 ? (
        <>
          {fpaAttempts.length > 0 ? (
            <FormSection
              title={`First piece attempts · ${fpaAttempts.length} rejected`}
              description="Each rejected piece stays on the record, with what was done about it."
            >
              <ul className="space-y-1.5">
                {fpaAttempts.map((attempt) => {
                  const defects = parameters.filter((p) => attempt.results[p] === 'DEFECT')
                  return (
                    <li
                      key={attempt.attemptNo}
                      className="rounded-md border border-bd-default px-3 py-2"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">
                          Attempt {attempt.attemptNo}
                          <span className="ml-2 font-mono text-xs text-fg-muted">{attempt.at}</span>
                        </span>
                        <Badge tone="error">Rejected on {defects.length}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-error">{defects.join(', ')}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        Corrected: {attempt.correctiveAction} · verified by{' '}
                        {nameOf(attempt.verifiedByQc) || attempt.verifiedByQc}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </FormSection>
          ) : null}

          <FormSection
            title={
              fpaAttempts.length > 0
                ? `First piece approval · attempt ${fpaAttempts.length + 1} · ${qcDocumentNo}`
                : `First piece approval · ${qcDocumentNo}`
            }
          >
            <FormGrid cols={3}>
              <EmployeePicker
                label="Produced by operator"
                required
                placeholder="Select operator"
                value={fpaOperator}
                onChange={setFpaOperator}
                options={operatorOptions}
              />
              <EmployeePicker
                label="Verified by QC"
                required
                placeholder="Select QC executive"
                value={fpaQc}
                onChange={setFpaQc}
                options={qcOptions}
              />
              <div className="flex items-end">
                <Checkbox
                  label="After power failure"
                  hint="A fresh FPA is required before production resumes"
                  checked={afterPowerFailure}
                  onChange={(e) => setAfterPowerFailure(e.target.checked)}
                />
              </div>
            </FormGrid>
          </FormSection>

          <FormSection title="Quality parameters">
            <ParameterResults
              parameters={parameters}
              results={fpaResults}
              onChange={setParameter}
              onSetAll={setAllFpaParameters}
            />
            {fpaDefects.length > 0 ? (
              <div className="mt-3 rounded-md border border-error/50 bg-error-subtle p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-semibold text-error">
                      First piece rejected on {fpaDefects.join(', ')}
                    </h5>
                    <p className="mt-0.5 max-w-[74ch] text-xs text-fg-muted">
                      The job cannot start on this piece. Correct the machine, record what you
                      changed, and make a fresh first piece — the rejected one stays on the record.
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Input
                    label="Corrective action"
                    required
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder={
                      isForming
                        ? 'Zone 12 raised by 4 °C, cycle held 2 s longer'
                        : 'Die reseated and stroke depth reset'
                    }
                    helper="What was changed on the machine before the next piece"
                  />
                </div>
                <div className="mt-2.5">
                  <Button
                    variant="primary"
                    icon={RotateCcw}
                    disabled={!canRecordFailure}
                    onClick={recordFailedAttempt}
                  >
                    Record attempt {fpaAttempts.length + 1} and make a fresh piece
                  </Button>
                </div>
              </div>
            ) : null}
          </FormSection>
        </>
      ) : null}

      {/* -------------------------------------------------- 4. Job start */}
      {step === 4 ? (
        <FormSection title="Job start">
          <FormGrid cols={3}>
            {isForming ? (
              <>
                <Input label="Die mounting start" type="time" value={dieMountStart} onChange={(e) => setDieMountStart(e.target.value)} />
                <Input label="Die mounting end" type="time" value={dieMountEnd} onChange={(e) => setDieMountEnd(e.target.value)} />
                <Input label="Machine heating time" unit="minutes" type="number" value={heatingMins} onChange={(e) => setHeatingMins(e.target.value)} />
              </>
            ) : null}
            <Input
              label="Machine start time"
              type="time"
              required
              value={machineStart}
              onChange={(e) => setMachineStart(e.target.value)}
              helper="The job is running from this point; in-process checks begin"
            />
            <DerivedField label="Line clearance" value={clearanceDone ? 'Signed by both' : 'Not signed'} emphasis={clearanceDone} />
            <DerivedField label="First piece" value={fpaDone ? 'Approved by QC' : 'Not approved'} emphasis={fpaDone} />
          </FormGrid>
        </FormSection>
      ) : null}

      {/* ------------------------------------------------- 5. In-process */}
      {step === 5 ? (
        <>
          <FormSection title={`In-process checks · ${qcDocumentNo}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-fg-muted">
                {checks.length} of {IN_PROCESS_CHECK_COUNT} hourly checks recorded
              </span>
              <Button
                variant="primary"
                icon={CheckCircle2}
                disabled={Boolean(draftCheck) || checks.length >= IN_PROCESS_CHECK_COUNT}
                onClick={startCheck}
              >
                Record check {Math.min(checks.length + 1, IN_PROCESS_CHECK_COUNT)}
              </Button>
            </div>

            {draftCheck ? (
              <div className="mt-3 rounded-md border border-bd-strong p-3">
                <FormGrid cols={3}>
                  <DerivedField label="Check no" value={String(draftCheck.checkNo)} emphasis />
                  <Input
                    label="Time"
                    type="time"
                    value={draftCheck.time}
                    onChange={(e) => setDraftCheck((c) => (c ? { ...c, time: e.target.value } : c))}
                  />
                  <EmployeePicker
                    label="QC sign (verification)"
                    required
                    placeholder="Select QC executive"
                    value={draftCheck.inspector}
                    onChange={(next) => setDraftCheck((c) => (c ? { ...c, inspector: next } : c))}
                    options={qcOptions}
                  />
                </FormGrid>
                <div className="mt-3">
                  <ParameterResults
                    parameters={parameters}
                    results={draftCheck.results}
                    onChange={setCheckParameter}
                    onSetAll={setAllCheckParameters}
                    onCopyPrevious={lastCheck ? copyPreviousCheck : undefined}
                    copyLabel={lastCheck ? `Same as check ${lastCheck.checkNo}` : undefined}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" icon={CheckCircle2} disabled={!draftComplete} onClick={commitCheck}>
                    Save check {draftCheck.checkNo}
                  </Button>
                  <Button variant="ghost" icon={X} onClick={() => setDraftCheck(null)}>
                    Discard
                  </Button>
                </div>
              </div>
            ) : null}

            {checkDefects.length > 0 ? (
              <div className="mt-3 flex items-start gap-3 rounded-md border border-error/35 bg-error-subtle p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                <div>
                  <h5 className="text-sm font-semibold text-error">
                    {checkDefects.length} defect{checkDefects.length > 1 ? 's' : ''} logged this shift
                  </h5>
                  <ul className="mt-1 space-y-0.5 text-xs text-fg-muted">
                    {checkDefects.map((d) => (
                      <li key={`${d.checkNo}-${d.parameter}`}>
                        <span className="font-mono">Check {d.checkNo}, {d.time}</span> · {d.parameter}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-xs text-fg-muted">
                    A non-conformance is raised against this job card when the run posts, for the
                    supervisor to close out on the NC register.
                  </p>
                </div>
              </div>
            ) : null}
          </FormSection>

          <FormSection title={`Checklist as recorded · ${qcDocumentNo}`}>
            <DefectChecklist
              defects={parameters}
              checks={gridChecks}
              documentNo={qcDocumentNo}
              section={isForming ? 'Forming' : 'Cutting'}
            />
          </FormSection>

          {isForming ? (
            <FormSection title={`Zone temperature chart · ${PLANT.heaterZones} zones`}>
              {formingWindow ? (
                <ZoneTemperatures readings={ZONE_TEMPERATURES} min={formingWindow.min} max={formingWindow.max} />
              ) : (
                <div className="rounded-md border border-bd-default p-3 text-sm text-fg-muted">
                  SOP {DOCUMENTS.sopForming} names a forming window for PS, PET and PP only. A{' '}
                  {job?.materialType ?? 'this'} run is logged without a band, so the readings are kept
                  as a record but not judged against limits.
                </div>
              )}
            </FormSection>
          ) : null}
        </>
      ) : null}

      {/* ------------------------------------------ 6. Job end and output */}
      {step === 6 ? (
        <>
          <FormSection title="Job end">
            <FormGrid cols={3}>
              <Input label="Machine stop time" type="time" value={machineStop} onChange={(e) => setMachineStop(e.target.value)} />
              <Input label="Job end time" type="time" required value={jobEnd} onChange={(e) => setJobEnd(e.target.value)} />
              <DerivedField label="Machine start" value={machineStart || '—'} />
            </FormGrid>
          </FormSection>

          {isForming ? (
            <>
              <FormSection title="Forming output">
                <FormGrid cols={3}>
                  <Input label="No. of cavity" type="number" value={cavities} onChange={(e) => setCavities(e.target.value)} />
                  <DerivedField label="Order qty" value={job ? `${formatNumber(job.requiredSheetsQty)} sheets` : '—'} />
                  <Input label="Formed qty" unit="sheets" required type="number" value={formedSheets} onChange={(e) => setFormedSheets(e.target.value)} />
                  <Input label="Make ready wastage" unit="sheets" type="number" value={makeReady} onChange={(e) => setMakeReady(e.target.value)} />
                  <Input label="Wastage qty" unit="sheets" type="number" value={wastageSheets} onChange={(e) => setWastageSheets(e.target.value)} />
                  <DerivedField
                    label="Total qty in numbers"
                    value={totalPieces > 0 ? formatNumber(totalPieces) : '—'}
                    emphasis
                  />
                </FormGrid>
              </FormSection>

              <FormSection title="Machine counter">
                <FormGrid cols={3}>
                  <Input label="Start counter reading" mono type="number" value={startCounter} onChange={(e) => setStartCounter(e.target.value)} />
                  <Input label="End counter reading" mono type="number" value={endCounter} onChange={(e) => setEndCounter(e.target.value)} />
                  <DerivedField
                    label="Strokes on the counter"
                    value={counterStrokes > 0 ? formatNumber(counterStrokes) : '—'}
                    emphasis
                  />
                </FormGrid>
                {counterMismatch ? (
                  <p className="mt-2 text-xs text-warning">
                    The counter says {formatNumber(counterStrokes)} sheets, the operator entered{' '}
                    {formatNumber(formedNum)}. The difference of{' '}
                    {formatNumber(Math.abs(counterStrokes - formedNum))} should be explained in the remarks.
                  </p>
                ) : null}
              </FormSection>

              <FormSection title="Reel reconciliation">
                <FormGrid cols={3}>
                  <Input
                    label="Issued weight"
                    unit="kg"
                    type="number"
                    value={issuedWeight}
                    onChange={(e) => setIssuedWeight(e.target.value)}
                    helper={job ? `Estimated ${formatNumber(job.estReelWeightKg, 1)} kg on the job card` : undefined}
                  />
                  <Input
                    label="Returned to store"
                    unit="kg"
                    type="number"
                    value={returnedWeight}
                    onChange={(e) => setReturnedWeight(e.target.value)}
                    helper="Balance reel taken off the machine at job end"
                  />
                  <DerivedField label="Consumed" value={consumedKg > 0 ? `${formatNumber(consumedKg, 1)} kg` : '—'} emphasis />
                  <DerivedField
                    label="Grams per sheet"
                    value={gramsPerSheet > 0 ? `${formatNumber(gramsPerSheet, 1)} g` : '—'}
                  />
                </FormGrid>
                {returnedOverIssued ? (
                  <p className="mt-2 text-xs text-error">
                    Returned weight is more than what was issued. The run cannot post until this is corrected.
                  </p>
                ) : null}
              </FormSection>
            </>
          ) : (
            <>
              <FormSection title="Cutting output">
                <FormGrid cols={3}>
                  <DerivedField label="Formed qty" value={job ? formatNumber(job.requiredSheetsQty) : '—'} />
                  <Input label="Cut qty" unit="pieces" required type="number" value={cutQty} onChange={(e) => setCutQty(e.target.value)} />
                  <Input label="Waste sheet" unit="grams" type="number" value={wasteGrams} onChange={(e) => setWasteGrams(e.target.value)} />
                  <Input label="Waste in nos" type="number" value={wasteNos} onChange={(e) => setWasteNos(e.target.value)} />
                  <DerivedField
                    label="Per pcs weight"
                    value={cutNum > 0 && Number(wasteGrams) >= 0 ? `${formatNumber((Number(wasteGrams) || 0) / Math.max(cutNum, 1), 2)} g` : '—'}
                  />
                </FormGrid>
              </FormSection>

              <FormSection title="Sorting and packing">
                <FormGrid cols={3}>
                  <Input
                    label="Rejection qty after sorting"
                    unit="pieces"
                    type="number"
                    value={rejectionAfterSorting}
                    onChange={(e) => setRejectionAfterSorting(e.target.value)}
                    helper="Defective pieces pulled out at the sorting table"
                  />
                  <DerivedField label="Final FG qty" value={finalFg > 0 ? formatNumber(finalFg) : '—'} emphasis />
                  <Input label="Per bag qty" type="number" value={perBag} onChange={(e) => setPerBag(e.target.value)} />
                  <Input label="Per box qty" type="number" value={perBox} onChange={(e) => setPerBox(e.target.value)} />
                  <DerivedField
                    label="Total qty of boxes"
                    value={
                      totalBoxes > 0
                        ? `${formatNumber(totalBoxes)}${finalFg % perBoxNum ? ` + ${finalFg % perBoxNum} loose` : ''}`
                        : '—'
                    }
                    emphasis
                  />
                </FormGrid>
              </FormSection>
            </>
          )}
        </>
      ) : null}
    </StandardModal>
  )
}

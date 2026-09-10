'use client'

import * as React from 'react'
import { Lock } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import { EmployeePicker, ReelPicker } from './master-pickers'
import { Checkbox, DerivedField, FormGrid, FormSection, Input, Select } from '@/components/ui'
import { EMPLOYEES, JOB_CARDS, REELS, USERS } from '@/data'
import { formatKg, formatNumber } from '@/lib/utils'

export function FormingEntryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [jobCardNo, setJobCardNo] = React.useState('')
  const [reelId, setReelId] = React.useState('')
  const [operator, setOperator] = React.useState('')
  const [shift, setShift] = React.useState('A')
  const [issuedKg, setIssuedKg] = React.useState('')
  const [returnedKg, setReturnedKg] = React.useState('')
  const [startCounter, setStartCounter] = React.useState('')
  const [endCounter, setEndCounter] = React.useState('')
  const [clearanceSigned, setClearanceSigned] = React.useState(false)
  const [firstPieceApproved, setFirstPieceApproved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const issued = Number(issuedKg) || 0
  const returned = Number(returnedKg) || 0
  const start = Number(startCounter) || 0
  const end = Number(endCounter) || 0

  const consumed = issued - returned
  const sheets = end > start ? end - start : 0
  const gramsPerSheet = sheets > 0 && consumed > 0 ? (consumed * 1000) / sheets : 0

  const counterInvalid = Boolean(startCounter && endCounter && end <= start)
  const returnInvalid = returned > issued

  /* This is the gate. Nothing is posted until QC has signed both checks,
     which is exactly what the paper checklist failed to enforce. */
  const gateOpen = clearanceSigned && firstPieceApproved
  const canSave = Boolean(
    gateOpen && jobCardNo && reelId && operator && sheets > 0 && consumed > 0 && !counterInvalid && !returnInvalid,
  )

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
      title="Post Forming Entry"
      badge={gateOpen ? { label: 'Gate open', tone: 'success' } : { label: 'Gate locked', tone: 'error' }}
      size="xl"
      onSave={handleSave}
      saveLabel="Post entry"
      saving={saving}
      saveDisabled={!canSave}
      footerNote={
        gateOpen
          ? consumed > 0
            ? `Consuming ${formatKg(consumed)} for ${formatNumber(sheets)} sheets`
            : 'Enter weights and counter readings'
          : 'Both QC signatures are required before an entry can be posted'
      }
    >
      {!gateOpen ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-error/35 bg-error-subtle p-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <div>
            <h5 className="text-sm font-semibold text-error">Entry locked</h5>
            <p className="mt-0.5 max-w-[62ch] text-xs text-fg-muted">
              The tablet will not accept a counter reading until line clearance and first-piece approval are both
              signed. Signatures seal on save and cannot be edited afterwards.
            </p>
          </div>
        </div>
      ) : null}

      <FormSection title="Quality gate">
        <FormGrid cols={2}>
          <Checkbox
            label="Line clearance signed"
            hint="No residual material from the previous job on the bed, die or reel path"
            checked={clearanceSigned}
            onChange={(e) => setClearanceSigned(e.target.checked)}
          />
          <Checkbox
            label="First piece approved"
            hint="Depth, thickness and clarity verified on sample 1"
            checked={firstPieceApproved}
            onChange={(e) => setFirstPieceApproved(e.target.checked)}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Run">
        <FormGrid cols={3}>
          <Select
            label="Job card"
            required
            placeholder="Select job card"
            value={jobCardNo}
            onChange={(e) => setJobCardNo(e.target.value)}
            options={JOB_CARDS.map((j) => ({
              value: j.jobCardNo,
              label: `${j.jobCardNo} — ${j.customerName}`,
            }))}
          />
          <ReelPicker
            label="Issued reel"
            required
            placeholder="Select reel"
            value={reelId}
            onChange={(next) => {
              setReelId(next)
              const r = REELS.find((x) => x.reelId === next)
              if (r) setIssuedKg(String(r.grossWeightKg))
            }}
            options={REELS.filter(
              (r) => r.qcStatus === 'APPROVED' && (!job || r.materialType === job.materialType),
            ).map((r) => ({
              value: r.reelId,
              label: `${r.reelId} — ${r.materialType} ${r.thicknessMicrons} µm`,
            }))}
          />
          <DerivedField label="Machine" value={job?.formingMachineCode ?? '—'} />
          <EmployeePicker
            label="Operator"
            required
            placeholder="Select operator"
            value={operator}
            onChange={setOperator}
            options={EMPLOYEES.filter((e) => e.department === 'Production' && e.status === 'ACTIVE').map((e) => ({
              value: e.employeeId,
              label: `${USERS.find((u) => u.userId === e.userId)?.userName ?? e.employeeCode} — ${e.employeeCode}`,
            }))}
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
          <DerivedField label="Target pieces" value={job ? formatNumber(job.targetPiecesQty) : '—'} />
        </FormGrid>
      </FormSection>

      <FormSection title="Counter readings">
        <FormGrid cols={3}>
          <Input
            label="Start counter"
            required
            type="number"
            min={0}
            value={startCounter}
            onChange={(e) => setStartCounter(e.target.value)}
          />
          <Input
            label="End counter"
            required
            type="number"
            min={0}
            value={endCounter}
            onChange={(e) => setEndCounter(e.target.value)}
            error={counterInvalid ? 'End counter must be higher than the start' : false}
          />
          <DerivedField label="Formed sheets" value={sheets > 0 ? formatNumber(sheets) : '—'} emphasis />
        </FormGrid>
      </FormSection>

      <FormSection title="Material">
        <FormGrid cols={3}>
          <Input
            label="Issued weight"
            unit="kg"
            required
            type="number"
            step="0.1"
            min={0}
            value={issuedKg}
            onChange={(e) => setIssuedKg(e.target.value)}
          />
          <Input
            label="Returned to store"
            unit="kg"
            type="number"
            step="0.1"
            min={0}
            value={returnedKg}
            onChange={(e) => setReturnedKg(e.target.value)}
            error={returnInvalid ? 'Cannot return more than was issued' : false}
          />
          <DerivedField label="Consumed" value={consumed > 0 ? formatKg(consumed) : '—'} emphasis />
          <DerivedField
            label="Grams per sheet"
            value={gramsPerSheet > 0 ? `${formatNumber(gramsPerSheet, 1)} g` : '—'}
          />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

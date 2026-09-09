'use client'

import * as React from 'react'
import { Lock } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import { Checkbox, DerivedField, FormGrid, FormSection, Input, Select } from '@/components/ui'
import { ReconciliationBar } from '@/components/forming'
import { ARTWORKS, EMPLOYEES, FORMING_LOGS, JOB_CARDS, USERS } from '@/data'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { calculateNesting } from '@/lib/layout-calc'
import { formatKg, formatNumber, formatPercent } from '@/lib/utils'

export function PunchingEntryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [jobCardNo, setJobCardNo] = React.useState('')
  const [operator, setOperator] = React.useState('')
  const [shift, setShift] = React.useState('A')
  const [sheetsIn, setSheetsIn] = React.useState('')
  const [goodPcs, setGoodPcs] = React.useState('')
  const [rejectPcs, setRejectPcs] = React.useState('')
  const [skeletonKg, setSkeletonKg] = React.useState('')
  const [clearanceSigned, setClearanceSigned] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const artwork = ARTWORKS.find((a) => a.artworkCode === job?.artworkCode)
  const formingLog = FORMING_LOGS.find((f) => f.jobCardNo === jobCardNo)

  const nesting = artwork
    ? calculateNesting({
        openLengthMm: artwork.openLengthMm,
        openWidthMm: artwork.openWidthMm,
        deckleWidthMm: DECKLE_MM,
        bedPitchMm: PLANT.bedLengthMm,
      })
    : null

  const sheets = Number(sheetsIn) || 0
  const good = Number(goodPcs) || 0
  const rejects = Number(rejectPcs) || 0
  const skeleton = Number(skeletonKg) || 0

  const expectedPieces = nesting ? sheets * nesting.upsPerSheet : 0
  const accounted = good + rejects
  const pieceVariance = expectedPieces > 0 ? expectedPieces - accounted : 0

  const consumed = formingLog?.consumedWeightKg ?? 0
  const gramsPerPiece = accounted > 0 && consumed > 0 ? ((consumed - skeleton) * 1000) / accounted : 0
  const rejectKgDerived = (rejects * gramsPerPiece) / 1000
  const goodKg = consumed - skeleton - rejectKgDerived

  /* The nesting tells us roughly how much skeleton to expect. A run more than
     two points off usually means the scale reading or the sheet count is wrong. */
  const expectedSkeletonKg = nesting && consumed > 0 ? consumed * nesting.skeletonFraction : 0
  const skeletonDrift =
    expectedSkeletonKg > 0 ? ((skeleton - expectedSkeletonKg) / expectedSkeletonKg) * 100 : 0
  const skeletonOff = expectedSkeletonKg > 0 && skeleton > 0 && Math.abs(skeletonDrift) > 12

  const canSave = Boolean(clearanceSigned && jobCardNo && operator && sheets > 0 && good > 0)

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
      title="Post Punching Entry"
      badge={clearanceSigned ? { label: 'Gate open', tone: 'success' } : { label: 'Gate locked', tone: 'error' }}
      size="xl"
      onSave={handleSave}
      saveLabel="Post entry"
      saving={saving}
      saveDisabled={!canSave}
      footerNote={
        clearanceSigned
          ? good > 0
            ? `${formatNumber(good)} good, ${formatNumber(rejects)} rejected`
            : 'Enter the piece counts off the press'
          : 'Die line clearance is required before an entry can be posted'
      }
    >
      {!clearanceSigned ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-error/35 bg-error-subtle p-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <div>
            <h5 className="text-sm font-semibold text-error">Entry locked</h5>
            <p className="mt-0.5 max-w-[62ch] text-xs text-fg-muted">
              QC must clear the punching die before the press runs, so that trays from the previous job cannot be mixed
              into this batch.
            </p>
          </div>
        </div>
      ) : null}

      <FormSection title="Quality gate">
        <Checkbox
          label="Punching die line clearance signed"
          hint="Die cavity empty, no trays from the previous job in the collection bin"
          checked={clearanceSigned}
          onChange={(e) => setClearanceSigned(e.target.checked)}
        />
      </FormSection>

      <FormSection title="Run">
        <FormGrid cols={3}>
          <Select
            label="Job card"
            required
            placeholder="Select job card"
            value={jobCardNo}
            onChange={(e) => {
              setJobCardNo(e.target.value)
              const log = FORMING_LOGS.find((f) => f.jobCardNo === e.target.value)
              if (log?.outputFormedSheets) setSheetsIn(String(log.outputFormedSheets))
            }}
            options={JOB_CARDS.map((j) => ({
              value: j.jobCardNo,
              label: `${j.jobCardNo} — ${j.customerName}`,
            }))}
          />
          <Select
            label="Operator"
            required
            placeholder="Select operator"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
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
          <DerivedField label="Press" value={job?.punchingMachineCode ?? '—'} />
          <DerivedField label="Ups per sheet" value={nesting ? String(nesting.upsPerSheet) : '—'} />
          <DerivedField
            label="Strokes needed"
            value={sheets > 0 ? formatNumber(Math.ceil(sheets / PLANT.sheetsPerStroke)) : '—'}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Output">
        <FormGrid cols={3}>
          <Input
            label="Formed sheets fed"
            required
            type="number"
            min={0}
            value={sheetsIn}
            onChange={(e) => setSheetsIn(e.target.value)}
            helper={
              formingLog?.outputFormedSheets
                ? `Forming produced ${formatNumber(formingLog.outputFormedSheets)}`
                : undefined
            }
          />
          <Input
            label="Good pieces"
            required
            type="number"
            min={0}
            value={goodPcs}
            onChange={(e) => setGoodPcs(e.target.value)}
          />
          <Input
            label="Rejected pieces"
            type="number"
            min={0}
            value={rejectPcs}
            onChange={(e) => setRejectPcs(e.target.value)}
          />
          <DerivedField
            label="Pieces expected off the die"
            value={expectedPieces > 0 ? formatNumber(expectedPieces) : '—'}
          />
          <DerivedField
            label="Unaccounted pieces"
            value={expectedPieces > 0 ? formatNumber(pieceVariance) : '—'}
            emphasis={pieceVariance === 0 && expectedPieces > 0}
          />
          <Input
            label="Skeleton scrap"
            unit="kg"
            type="number"
            step="0.1"
            min={0}
            value={skeletonKg}
            onChange={(e) => setSkeletonKg(e.target.value)}
            error={skeletonOff ? `Nesting expects about ${formatKg(expectedSkeletonKg)}` : false}
            helper={
              !skeletonOff && expectedSkeletonKg > 0
                ? `Nesting allows ${formatPercent(nesting!.skeletonFraction * 100)} of the sheet`
                : undefined
            }
          />
        </FormGrid>
      </FormSection>

      {consumed > 0 && skeleton > 0 && accounted > 0 ? (
        <FormSection title="Reconciliation">
          <ReconciliationBar goodKg={goodKg} skeletonKg={skeleton} rejectKg={rejectKgDerived} />
          <div className="mt-3">
            <FormGrid cols={3}>
              <DerivedField label="Consumed at forming" value={formatKg(consumed)} />
              <DerivedField label="Weight per tray" value={`${formatNumber(gramsPerPiece, 2)} g`} />
              <DerivedField label="Good product" value={formatKg(goodKg)} emphasis />
            </FormGrid>
          </div>
        </FormSection>
      ) : null}
    </StandardModal>
  )
}

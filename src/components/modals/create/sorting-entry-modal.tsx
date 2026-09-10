'use client'

import * as React from 'react'
import { ClipboardCheck } from 'lucide-react'
import { StandardModal } from '@/components/modals/standard-modal'
import { EmployeePicker } from './master-pickers'
import { Button, DerivedField, FormGrid, FormSection, Input, Select } from '@/components/ui'
import { DOCUMENTS, SORTING_REJECT_REASONS } from '@/config/plant'
import { CUTTING_LOGS, EMPLOYEES, JOB_CARDS, USERS } from '@/data'
import { formatNumber } from '@/lib/utils'

function nameOf(employeeId: string) {
  const employee = EMPLOYEES.find((e) => e.employeeId === employeeId)
  return USERS.find((u) => u.userId === employee?.userId)?.userName ?? ''
}

const sorterOptions = EMPLOYEES.filter(
  (e) => e.department === 'Production' || e.department === 'Quality',
).map((e) => ({ value: e.employeeId, label: nameOf(e.employeeId) || e.employeeCode }))

/**
 * The sorting table between the press and packing.
 *
 * A job cannot be sorted before it has been cut, so the pieces available are
 * read from the cutting log rather than typed. Every reject is booked against
 * a reason, and the reasons have to add up to no more than what was sorted.
 */
export function SortingEntryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [jobCardNo, setJobCardNo] = React.useState('')
  const [sorter, setSorter] = React.useState('')
  const [shift, setShift] = React.useState('A')
  const [sortedQty, setSortedQty] = React.useState('')
  const [rejects, setRejects] = React.useState<Record<string, string>>({})

  const cut = CUTTING_LOGS.find((c) => c.jobCardNo === jobCardNo)
  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const available = cut?.goodPiecesOutput ?? 0

  const sorted = Number(sortedQty) || 0
  const rejected = SORTING_REJECT_REASONS.reduce((sum, r) => sum + (Number(rejects[r]) || 0), 0)
  const good = Math.max(sorted - rejected, 0)
  const pending = Math.max(available - sorted, 0)

  const overSorted = sorted > available
  const overRejected = rejected > sorted
  const canSave = Boolean(jobCardNo && sorter) && sorted > 0 && !overSorted && !overRejected

  const blockedReason = () => {
    if (!jobCardNo) return 'Select a job card that has been cut'
    if (!sorter) return 'Name the person who worked the table'
    if (sorted <= 0) return 'Enter how many pieces went through the table'
    if (overSorted) return `Only ${formatNumber(available)} pieces came off the press`
    if (overRejected) return 'Rejects cannot exceed the pieces sorted'
    return `${formatNumber(good)} good · ${formatNumber(pending)} still queued`
  }

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      onClose()
    }, 500)
  }

  // Only jobs the press has actually produced pieces for can be sorted.
  const jobOptions = CUTTING_LOGS.filter((c) => c.goodPiecesOutput > 0).map((c) => {
    const j = JOB_CARDS.find((x) => x.jobCardNo === c.jobCardNo)
    return { value: c.jobCardNo, label: `${c.jobCardNo} — ${j?.customerName ?? ''}` }
  })

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sorting Entry"
      subtitle={`Rejection record ${DOCUMENTS.productionSorting}`}
      size="lg"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!canSave}
      saveIcon={ClipboardCheck}
      saveLabel="Post sorting entry"
      footerNote={blockedReason()}
    >
      <FormSection title="Job">
        <FormGrid cols={3}>
          <Select
            label="Job card"
            required
            placeholder="Select job card"
            value={jobCardNo}
            onChange={(e) => setJobCardNo(e.target.value)}
            options={jobOptions}
          />
          <EmployeePicker
            label="Sorted by"
            required
            placeholder="Select operator"
            value={sorter}
            onChange={setSorter}
            options={sorterOptions}
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
          <DerivedField label="Customer" value={job?.customerName ?? '—'} />
          <DerivedField label="Pieces off the press" value={available > 0 ? formatNumber(available) : '—'} />
          <Input
            label="Pieces sorted"
            unit="pieces"
            required
            type="number"
            value={sortedQty}
            onChange={(e) => setSortedQty(e.target.value)}
            helper="Leave short of the press output if the table is still running"
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Rejections by reason">
        <FormGrid cols={2}>
          {SORTING_REJECT_REASONS.map((reason) => (
            <Input
              key={reason}
              label={reason}
              type="number"
              value={rejects[reason] ?? ''}
              onChange={(e) => setRejects((r) => ({ ...r, [reason]: e.target.value }))}
              placeholder="0"
            />
          ))}
        </FormGrid>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => setRejects({})} disabled={rejected === 0}>
            Clear rejections
          </Button>
        </div>
      </FormSection>

      <FormSection title="Outcome">
        <FormGrid cols={3}>
          <DerivedField label="Rejected" value={formatNumber(rejected)} />
          <DerivedField label="Good to packing" value={formatNumber(good)} emphasis />
          <DerivedField label="Still queued" value={formatNumber(pending)} />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

'use client'

import * as React from 'react'
import { AlertTriangle, Lock, PackageCheck } from 'lucide-react'
import { StandardModal } from '@/components/modals'
import { UserPicker } from './master-pickers'
import { DerivedField, FormGrid, FormSection, Input, Select } from '@/components/ui'
import { BINS, ITEMS, JOB_CARDS, USERS, issuableReels, nextIssueNo, reelIssuesFor } from '@/data'
import { formatNumber } from '@/lib/utils'
import type { MaterialType } from '@/types'

/* Material issue.

   The store hands material to the floor here and nowhere else. Only what QC
   approved is on offer — a held or rejected roll never appears in the list at
   all — and the issue always names the job card, because that is what lets the
   forming screen refuse a run on material nobody issued. */

const itemOf = (id: string) => ITEMS.find((i) => i.itemId === id)
const binCode = (id: string) => BINS.find((b) => b.binId === id)?.binCode ?? id

/** Item codes carry the polymer, and HIPS is abbreviated in them. */
function polymerFragment(materialType: MaterialType) {
  return materialType === 'HIPS' ? 'HIP' : materialType
}

export function MaterialIssueModal({
  isOpen,
  onClose,
  /** Opens with a job card already chosen, from the job's own screen. */
  jobCardNo: initialJobCardNo = '',
}: {
  isOpen: boolean
  onClose: () => void
  jobCardNo?: string
}) {
  const [jobCardNo, setJobCardNo] = React.useState(initialJobCardNo)
  const [reelId, setReelId] = React.useState('')
  const [quantity, setQuantity] = React.useState('')
  const [issuedTo, setIssuedTo] = React.useState('')
  const [remarks, setRemarks] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const reels = React.useMemo(() => issuableReels(), [])
  const reel = reels.find((r) => r.reelId === reelId)
  const item = reel ? itemOf(reel.itemId) : null
  const qty = Number(quantity) || 0

  /* The right polymer for the job comes first; the rest stay selectable, since
     a supervisor may knowingly issue something else. */
  const reelOptions = React.useMemo(() => {
    const fragment = job ? polymerFragment(job.materialType) : null
    const label = (r: (typeof reels)[number]) =>
      `${r.reelId} — ${itemOf(r.itemId)?.itemCode ?? r.itemId}, ${formatNumber(r.quantity, 1)} kg`
    if (!fragment) return reels.map((r) => ({ value: r.reelId, label: label(r) }))
    const matching = reels.filter((r) => itemOf(r.itemId)?.itemCode.includes(fragment))
    const others = reels.filter((r) => !itemOf(r.itemId)?.itemCode.includes(fragment))
    return [...matching, ...others].map((r) => ({ value: r.reelId, label: label(r) }))
  }, [job, reels])

  /* Opening from a job card's own row starts on that job, and reopening clears
     what the last issue left behind. */
  React.useEffect(() => {
    if (!isOpen) return
    setJobCardNo(initialJobCardNo)
    setReelId('')
    setQuantity('')
    setIssuedTo('')
    setRemarks('')
  }, [isOpen, initialJobCardNo])

  React.useEffect(() => {
    if (reel && !quantity) setQuantity(String(reel.quantity))
  }, [reel, quantity])

  const alreadyIssued = jobCardNo ? reelIssuesFor(jobCardNo) : []
  const overIssue = reel ? qty > reel.quantity : false
  const wrongPolymer = Boolean(
    job && item && !item.itemCode.includes(polymerFragment(job.materialType)),
  )
  const gaugeOff = Boolean(
    job && reel?.thicknessMicrons && Math.abs(reel.thicknessMicrons - job.thicknessMicrons) > job.thicknessMicrons * 0.05,
  )

  const canSave = Boolean(jobCardNo && reelId && qty > 0 && issuedTo && !overIssue)

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
      title="Issue Material to Job"
      badge={
        reel
          ? { label: reel.qcNumber ? `QC ${reel.qcNumber}` : 'Auto-approved', tone: 'success' }
          : { label: 'QC-approved stock only', tone: 'muted' }
      }
      size="lg"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!canSave}
      saveLabel="Issue material"
      saveIcon={PackageCheck}
      footerNote={
        reel
          ? `${formatNumber(qty, 1)} ${item?.uom ?? 'kg'} out of ${binCode(reel.binId)}, against ${reel.grnNumber}`
          : 'Only what QC approved can be issued'
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-md border border-bd-strong bg-bg-subtle p-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
        <div>
          <h5 className="text-sm font-semibold">This is the gate before forming</h5>
          <p className="mt-0.5 max-w-[70ch] text-xs text-fg-muted">
            The list below holds nothing but rolls QC approved and the store has not already issued. Forming cannot be
            posted against a job card until a reel has been issued to it here.
          </p>
        </div>
      </div>

      <FormSection title="Job card">
        <FormGrid cols={2}>
          <Select
            label="Against job card"
            required
            placeholder="Select a job card"
            value={jobCardNo}
            onChange={(e) => {
              setJobCardNo(e.target.value)
              setReelId('')
              setQuantity('')
            }}
            options={JOB_CARDS.filter((j) => j.stages.FORMING !== 'DONE').map((j) => ({
              value: j.jobCardNo,
              label: `${j.jobCardNo} — ${j.customerName}`,
            }))}
          />
          <DerivedField label="Issue no" value={nextIssueNo()} />
          <DerivedField
            label="Material the job needs"
            value={job ? `${job.materialType} · ${job.thicknessMicrons} µm` : '—'}
          />
          <DerivedField
            label="Estimated requirement"
            value={job ? `${formatNumber(job.estReelWeightKg, 1)} kg` : '—'}
          />
        </FormGrid>
        {alreadyIssued.length > 0 ? (
          <p className="mt-2 text-xs text-fg-subtle">
            Already issued to this job:{' '}
            {alreadyIssued.map((i) => `${i.reelId ?? i.itemId} (${formatNumber(i.quantity, 1)} kg)`).join(', ')}
          </p>
        ) : null}
      </FormSection>

      <FormSection title="From stock">
        <FormGrid cols={2}>
          <Select
            label="Reel"
            required
            placeholder={reelOptions.length > 0 ? 'Select an approved reel' : 'No approved reel free to issue'}
            value={reelId}
            onChange={(e) => {
              setReelId(e.target.value)
              setQuantity('')
            }}
            options={reelOptions}
            error={wrongPolymer ? `${job?.materialType} job, and this is not a ${job?.materialType} reel` : false}
            helper={
              !wrongPolymer && gaugeOff && reel
                ? `${reel.thicknessMicrons} µm against ${job?.thicknessMicrons} µm on the job`
                : undefined
            }
          />
          <Input
            label="Quantity"
            unit={item?.uom ?? 'KG'}
            required
            type="number"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={overIssue ? `Only ${formatNumber(reel?.quantity ?? 0, 1)} approved on this reel` : false}
          />
          <DerivedField label="Out of bin" value={reel ? binCode(reel.binId) : '—'} />
          <DerivedField
            label="Traceable to"
            value={reel ? `${reel.grnNumber} · ${reel.qcNumber ?? 'auto-approved'}` : '—'}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Handover">
        <FormGrid cols={2}>
          <UserPicker
            label="Issued to"
            required
            placeholder="Who is taking it"
            value={issuedTo}
            onChange={setIssuedTo}
            options={USERS.filter(
              (u) => u.status === 'ACTIVE' && (u.role === 'OPERATOR' || u.role === 'SUPERVISOR'),
            ).map((u) => ({ value: u.userName, label: `${u.userName} — ${u.designation}` }))}
          />
          <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
        </FormGrid>
        {wrongPolymer ? (
          <div className="mt-3 flex items-start gap-3 rounded-md border border-error/50 bg-error/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
            <p className="max-w-[70ch] text-xs text-fg-muted">
              The job card asks for {job?.materialType}. Issuing something else will not form to the same temperature
              profile, so the run is likely to be scrapped.
            </p>
          </div>
        ) : null}
      </FormSection>
    </StandardModal>
  )
}

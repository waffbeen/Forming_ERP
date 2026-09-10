'use client'

import * as React from 'react'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { StandardModal } from '@/components/modals/standard-modal'
import { EmployeePicker } from './master-pickers'
import {
  DerivedField, FormGrid, FormSection, Input, Select, SpecList, Textarea,
} from '@/components/ui'
import {
  CUTTING_DEFECTS, FORMING_DEFECTS, NC_DISPOSITIONS, NC_SOURCES, SORTING_REJECT_REASONS,
} from '@/config/plant'
import { EMPLOYEES, JOB_CARDS, USERS, nextNcNumber } from '@/data'
import { formatDate, formatNumber } from '@/lib/utils'
import { ncClosable } from '@/types/non-conformance'
import type { NonConformance, NcSeverity } from '@/types/non-conformance'

function nameOf(employeeId: string) {
  const employee = EMPLOYEES.find((e) => e.employeeId === employeeId)
  return USERS.find((u) => u.userId === employee?.userId)?.userName ?? employeeId
}

const qcOptions = EMPLOYEES.filter((e) => e.department === 'Quality').map((e) => ({
  value: e.employeeId,
  label: nameOf(e.employeeId) || e.employeeCode,
}))

const supervisorOptions = EMPLOYEES.filter((e) => e.department === 'Production').map((e) => ({
  value: e.employeeId,
  label: nameOf(e.employeeId) || e.employeeCode,
}))

const SECTIONS: NonConformance['section'][] = ['FORMING', 'CUTTING', 'SORTING', 'STORES', 'PACKING']

const SEVERITY: { value: NcSeverity; label: string }[] = [
  { value: 'MINOR', label: 'Minor - reworkable, no effect on fitness for use' },
  { value: 'MAJOR', label: 'Major - affects the batch, disposition required' },
  { value: 'CRITICAL', label: 'Critical - reportable to the customer' },
]

/** The parameter list the finding is worded against, by the section it was caught in. */
function parametersFor(section: NonConformance['section']): readonly string[] {
  if (section === 'FORMING') return FORMING_DEFECTS
  if (section === 'CUTTING') return CUTTING_DEFECTS
  if (section === 'SORTING') return SORTING_REJECT_REASONS
  return []
}

/**
 * Raising a non-conformance, and closing it out.
 *
 * The two halves are deliberately not the same form. Raising one is quick,
 * because it happens at the machine with the defect in hand. Closing one is
 * not: a cause, a corrective action, a preventive action and a name are all
 * required, which is what SOP-09 4.6.3 asks for and what an auditor reads.
 */
export function NcModal({
  isOpen,
  onClose,
  existing,
}: {
  isOpen: boolean
  onClose: () => void
  /** Passed to close out a raised finding; omitted to raise a new one. */
  existing?: NonConformance | null
}) {
  const closing = Boolean(existing)
  const [saving, setSaving] = React.useState(false)

  // Raising
  const [source, setSource] = React.useState<string>(NC_SOURCES[3])
  const [section, setSection] = React.useState<NonConformance['section']>('FORMING')
  const [jobCardNo, setJobCardNo] = React.useState('')
  const [parameter, setParameter] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [qty, setQty] = React.useState('')
  const [uom, setUom] = React.useState('pieces')
  const [severity, setSeverity] = React.useState<NcSeverity>('MAJOR')
  const [raisedBy, setRaisedBy] = React.useState('')
  const [responsible, setResponsible] = React.useState('')
  const [targetDate, setTargetDate] = React.useState('')

  // Closing out
  const [disposition, setDisposition] = React.useState('')
  const [rootCause, setRootCause] = React.useState('')
  const [corrective, setCorrective] = React.useState('')
  const [preventive, setPreventive] = React.useState('')
  const [closedBy, setClosedBy] = React.useState('')

  /* Reopening the screen on a different finding starts from what that finding
     already has, so a part-worked CAPA is not silently thrown away. */
  React.useEffect(() => {
    if (!isOpen) return
    setDisposition(existing?.disposition ?? '')
    setRootCause(existing?.rootCause ?? '')
    setCorrective(existing?.correctiveAction ?? '')
    setPreventive(existing?.preventiveAction ?? '')
    setClosedBy(existing?.closedBy ?? '')
  }, [isOpen, existing])

  const parameters = parametersFor(section)

  const canRaise =
    Boolean(source) && Boolean(parameter) && description.trim().length > 0 && Boolean(raisedBy) &&
    Boolean(responsible) && Boolean(targetDate)

  const canClose = existing
    ? ncClosable({
        ...existing,
        disposition: (disposition || null) as NonConformance['disposition'],
        rootCause,
        correctiveAction: corrective,
        preventiveAction: preventive,
        closedBy,
      })
    : false

  const missing = () => {
    if (!closing) {
      return canRaise
        ? null
        : 'Name the parameter, describe the finding, and set an owner and a target date'
    }
    if (!disposition) return 'Set what was done with the affected material'
    if (!rootCause.trim()) return 'A root cause is required before the finding can be closed'
    if (!corrective.trim()) return 'A corrective action is required'
    if (!preventive.trim()) return 'A preventive action is required, so the same finding does not recur'
    if (!closedBy) return 'The finding has to be closed by a named QC executive'
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
      title={closing ? `Close out ${existing?.ncNumber}` : 'Raise a non-conformance'}
      subtitle={
        closing
          ? 'Root cause, corrective and preventive action'
          : `${nextNcNumber()} · SOP DF/PRD/SOP-09 4.6.3 and SOP-05 5.5`
      }
      badge={
        closing
          ? { label: canClose ? 'Ready to close' : 'CAPA incomplete', tone: canClose ? 'success' : 'warning' }
          : { label: 'New finding', tone: 'error' }
      }
      size="lg"
      onSave={handleSave}
      saving={saving}
      saveDisabled={closing ? !canClose : !canRaise}
      saveLabel={closing ? 'Close the finding' : 'Raise the finding'}
      saveIcon={closing ? CheckCircle2 : ShieldAlert}
      footerNote={missing()}
    >
      {closing && existing ? (
        <>
          <FormSection title="The finding">
            <SpecList
              rows={[
                { label: 'Raised on', value: formatDate(existing.raisedOn) },
                { label: 'Caught at', value: existing.source, mono: false },
                { label: 'Section', value: existing.section },
                { label: 'Job card', value: existing.jobCardNo || existing.grnNumber },
                { label: 'Parameter', value: existing.parameter, mono: false },
                { label: 'Quantity affected', value: `${formatNumber(existing.qtyAffected, 1)} ${existing.qtyUom}` },
                { label: 'Raised by', value: existing.raisedBy, mono: false },
                { label: 'Target date', value: formatDate(existing.targetDate) },
              ]}
            />
            <p className="mt-2.5 rounded-md border border-bd-default bg-bg-subtle px-3 py-2 text-sm">
              {existing.description}
            </p>
          </FormSection>

          <FormSection title="Disposition of the affected material">
            <FormGrid cols={2}>
              <Select
                label="Disposition"
                required
                placeholder="Select what was done"
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
                options={NC_DISPOSITIONS.map((d) => ({ value: d, label: d }))}
              />
              <DerivedField
                label="Quantity"
                value={`${formatNumber(existing.qtyAffected, 1)} ${existing.qtyUom}`}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Corrective and preventive action">
            <Textarea
              label="Root cause"
              required
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Why it happened, not what happened"
            />
            <Textarea
              label="Corrective action"
              required
              rows={2}
              value={corrective}
              onChange={(e) => setCorrective(e.target.value)}
              placeholder="What was done about this batch"
            />
            <Textarea
              label="Preventive action"
              required
              rows={2}
              value={preventive}
              onChange={(e) => setPreventive(e.target.value)}
              placeholder="What was changed so it does not recur"
            />
            <FormGrid cols={2}>
              <EmployeePicker
                label="Closed by (QC)"
                required
                placeholder="Select QC executive"
                value={closedBy}
                onChange={setClosedBy}
                options={qcOptions}
              />
              <DerivedField label="Closed on" value={formatDate(new Date().toISOString().slice(0, 10))} />
            </FormGrid>
          </FormSection>
        </>
      ) : (
        <>
          <FormSection title="Where it was caught">
            <FormGrid cols={3}>
              <Select
                label="Source"
                required
                value={source}
                onChange={(e) => setSource(e.target.value)}
                options={NC_SOURCES.map((s) => ({ value: s, label: s }))}
              />
              <Select
                label="Section"
                required
                value={section}
                onChange={(e) => {
                  setSection(e.target.value as NonConformance['section'])
                  setParameter('')
                }}
                options={SECTIONS.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
              />
              <Select
                label="Job card"
                placeholder="Select job card"
                value={jobCardNo}
                onChange={(e) => setJobCardNo(e.target.value)}
                options={JOB_CARDS.map((j) => ({ value: j.jobCardNo, label: `${j.jobCardNo} — ${j.customerName}` }))}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="The finding">
            {parameters.length > 0 ? (
              <Select
                label="Quality parameter"
                required
                placeholder="Select the parameter that failed"
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                options={parameters.map((p) => ({ value: p, label: p }))}
              />
            ) : (
              <Input
                label="Quality parameter"
                required
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                placeholder="Thickness, weight against challan, and so on"
              />
            )}
            <Textarea
              label="Description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was seen, where on the piece, and at which check"
            />
            <FormGrid cols={3}>
              <Input
                label="Quantity affected"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <Select
                label="Unit"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                options={[
                  { value: 'pieces', label: 'Pieces' },
                  { value: 'sheets', label: 'Sheets' },
                  { value: 'kg', label: 'Kilograms' },
                ]}
              />
              <Select
                label="Severity"
                required
                value={severity}
                onChange={(e) => setSeverity(e.target.value as NcSeverity)}
                options={SEVERITY.map((s) => ({ value: s.value, label: s.label }))}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Ownership">
            <FormGrid cols={3}>
              <EmployeePicker
                label="Raised by (QC)"
                required
                placeholder="Select QC executive"
                value={raisedBy}
                onChange={setRaisedBy}
                options={qcOptions}
              />
              <EmployeePicker
                label="Responsible (production supervisor)"
                required
                placeholder="Select supervisor"
                value={responsible}
                onChange={setResponsible}
                options={supervisorOptions}
              />
              <Input
                label="Target close date"
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </FormGrid>
            <p className="mt-2.5 text-xs text-fg-muted">
              The job card cannot be closed and no COA can be released against it while this finding is open.
            </p>
          </FormSection>
        </>
      )}
    </StandardModal>
  )
}

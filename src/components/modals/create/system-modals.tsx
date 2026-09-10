'use client'

import * as React from 'react'
import { StandardModal } from '@/components/modals'
import {
  Checkbox, DerivedField, FormGrid, FormSection, Input, Select, SelectWithCreate,
} from '@/components/ui'
import { BINS, EMPLOYEES, USERS, WAREHOUSES } from '@/data'
import { formatKg } from '@/lib/utils'
import { formatDocumentNumber } from '@/types/masters'
import type { DocumentPrefix, PermissionKey, UserRole } from '@/types/masters'
import type { MasterModalProps } from './master-modals'

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

// ----------------------------------------------------------------------- Bin

export function BinModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    code ? { value: `NEW-BIN-${Date.now()}`, label: code } : null,
  )
  const [code, setCode] = React.useState(initialName ?? '')
  const [name, setName] = React.useState(initialName ?? '')
  const [warehouseId, setWarehouseId] = React.useState('')
  const [binType, setBinType] = React.useState('')
  const [capacity, setCapacity] = React.useState('')

  const warehouse = WAREHOUSES.find((w) => w.warehouseId === warehouseId)
  const siblings = BINS.filter((b) => b.warehouseId === warehouseId)
  const usedCapacity = siblings.reduce((s, b) => s + b.capacityKg, 0)

  /* Segregation bins are unique per warehouse: two approved bins in one store
     defeats the point of segregating on receipt. */
  const duplicateSegregation =
    ['QC_APPROVED', 'QUARANTINE', 'REJECTED'].includes(binType) &&
    siblings.some((b) => b.binType === binType)

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Bin"
      size="md"
      onSave={save}
      saving={saving}
      saveDisabled={!code || !warehouseId || !binType || duplicateSegregation}
      saveLabel="Create bin"
      footerNote={warehouse ? `${warehouse.warehouseName} holds ${siblings.length} bins, ${formatKg(usedCapacity)} capacity` : undefined}
    >
      <FormSection title="Location">
        <FormGrid cols={2}>
          <Input label="Bin code" required mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="RM-B" />
          <Input label="Bin name" value={name} onChange={(e) => setName(e.target.value)} placeholder="QC approved reels, Rack B" />
          <Select
            label="Warehouse"
            required
            placeholder="Select warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            options={WAREHOUSES.map((w) => ({ value: w.warehouseId, label: `${w.warehouseCode} — ${w.warehouseName}` }))}
          />
          <Select
            label="Bin type"
            required
            placeholder="Select type"
            value={binType}
            onChange={(e) => setBinType(e.target.value)}
            options={[
              { value: 'QC_APPROVED', label: 'QC approved' },
              { value: 'QUARANTINE', label: 'Quarantine, on hold' },
              { value: 'REJECTED', label: 'Rejected, return to supplier' },
              { value: 'FINISHED_GOODS', label: 'Finished goods' },
              { value: 'SCRAP', label: 'Scrap, awaiting grinding' },
              { value: 'GENERAL', label: 'General' },
            ]}
            error={duplicateSegregation ? `${warehouse?.warehouseName} already has a bin of this type` : false}
          />
          <Input
            label="Capacity"
            unit="kg"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            helper="Utilisation is tracked against this on the bin master"
          />
          <DerivedField label="Occupied" value="0.0 kg on creation" />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ---------------------------------------------------------------------- User

export function UserModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    name ? { value: `NEW-USR-${Date.now()}`, label: name } : null,
  )
  const [name, setName] = React.useState('')
  const [login, setLogin] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [contact, setContact] = React.useState('')
  const [designation, setDesignation] = React.useState('')
  const [role, setRole] = React.useState('')
  const [branch, setBranch] = React.useState('Vasai')
  const [unit, setUnit] = React.useState('Unit-1')
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [mustReset, setMustReset] = React.useState(true)

  /* Suggest a login from the name, the way the ERP does elsewhere. */
  React.useEffect(() => {
    if (!name) return
    const parts = name.trim().toLowerCase().split(/\s+/)
    if (parts.length >= 2) setLogin(`${parts[0]}.${parts[1][0]}`)
    else setLogin(parts[0])
  }, [name])

  const loginTaken = USERS.some((u) => u.loginUserName === login && login !== '')

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New User"
      badge={isAdmin ? { label: 'Administrator', tone: 'error' } : undefined}
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!name || !login || !role || loginTaken}
      saveLabel="Create user"
      footerNote={mustReset ? 'The user will be asked to set a password at first sign-in' : undefined}
    >
      <FormSection title="Identity">
        <FormGrid cols={2}>
          <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunita Rane" />
          <Input
            label="Login name"
            required
            mono
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            error={loginTaken ? 'This login name is already in use' : false}
            helper={!loginTaken && login ? 'Suggested from the full name; edit if needed' : undefined}
          />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sunita@desform.in" />
          <Input label="Contact no" mono value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 97694 20017" />
        </FormGrid>
      </FormSection>

      <FormSection title="Posting">
        <FormGrid cols={2}>
          <Input label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="QC Executive" />
          <Select
            label="Role"
            required
            placeholder="Select role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'ADMIN', label: 'Administrator' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'SUPERVISOR', label: 'Supervisor' },
              { value: 'OPERATOR', label: 'Operator' },
              { value: 'QC', label: 'Quality' },
              { value: 'STORE', label: 'Stores' },
              { value: 'ACCOUNTS', label: 'Accounts' },
            ]}
            helper="Decides which modules open; rights inside them come from the Module master"
          />
          <Input label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
          <Input label="Production unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Access">
        <FormGrid cols={2}>
          <Checkbox
            label="Administrator"
            hint="Full rights on every module, including the masters"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <Checkbox
            label="Force password reset at first sign-in"
            hint="Recommended for every new account"
            checked={mustReset}
            onChange={(e) => setMustReset(e.target.checked)}
          />
        </FormGrid>
      </FormSection>
    </StandardModal>
  )
}

// ------------------------------------------------------------------ Employee

const CERTIFICATIONS = [
  'IQC', 'Line clearance', 'First piece', 'In-process', 'FG inspection', 'COA',
  'TF-01', 'TF-02', 'TF-03', 'PN-01', 'PN-02',
  'Sorting', 'Carton close', 'GRN', 'Reel issue', 'Returns', 'Scheduling',
]

export function EmployeeModal({ isOpen, onClose, onCreated, initialName }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose, onCreated, () =>
    empCode ? { value: `NEW-EMP-${Date.now()}`, label: empCode } : null,
  )
  const [userId, setUserId] = React.useState('')
  const [empCode, setEmpCode] = React.useState(initialName ?? '')
  const [department, setDepartment] = React.useState('')
  const [shift, setShift] = React.useState('A')
  const [doj, setDoj] = React.useState('')
  const [reportsTo, setReportsTo] = React.useState('')
  const [certs, setCerts] = React.useState<string[]>([])

  /* A user may only have one employee record, so those already linked are out. */
  const availableUsers = USERS.filter(
    (u) => u.status === 'ACTIVE' && !EMPLOYEES.some((e) => e.userId === u.userId),
  )
  const user = USERS.find((u) => u.userId === userId)

  const toggleCert = (c: string) =>
    setCerts((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const signsGates = certs.some((c) =>
    ['IQC', 'Line clearance', 'First piece', 'In-process', 'FG inspection', 'COA'].includes(c),
  )

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Employee"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!userId || !empCode || !department}
      saveLabel="Create employee"
      footerNote={
        availableUsers.length === 0
          ? 'Every active user already has an employee record. Create a user first.'
          : signsGates
            ? 'This person will be able to sign quality gates'
            : undefined
      }
    >
      <FormSection title="Login">
        <FormGrid cols={2}>
          <SelectWithCreate
            label="User account"
            required
            placeholder={availableUsers.length ? 'Select an unlinked user' : 'No unlinked users available'}
            disabled={availableUsers.length === 0}
            value={userId}
            onChange={setUserId}
            options={availableUsers.map((u) => ({
              value: u.userId,
              label: `${u.userName} — ${u.loginUserName}`,
            }))}
            createLabel="New user"
            renderCreateModal={(props) => <UserModal {...props} />}
          />
          <Input label="Employee code" required mono value={empCode} onChange={(e) => setEmpCode(e.target.value)} placeholder="EMP-014" />
          <DerivedField label="Designation" value={user?.designation ?? '—'} />
          <DerivedField label="Role" value={user?.role ?? '—'} />
        </FormGrid>
      </FormSection>

      <FormSection title="Posting">
        <FormGrid cols={3}>
          <Select
            label="Department"
            required
            placeholder="Select department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { value: 'Production', label: 'Production' },
              { value: 'Quality', label: 'Quality' },
              { value: 'Stores', label: 'Stores' },
              { value: 'Dispatch', label: 'Dispatch' },
              { value: 'Planning', label: 'Planning' },
              { value: 'Administration', label: 'Administration' },
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
          <Input label="Date of joining" type="date" value={doj} onChange={(e) => setDoj(e.target.value)} />
          <Select
            label="Reports to"
            placeholder="None"
            value={reportsTo}
            onChange={(e) => setReportsTo(e.target.value)}
            options={EMPLOYEES.map((e) => ({
              value: e.employeeId,
              label: `${USERS.find((u) => u.userId === e.userId)?.userName ?? e.employeeCode} — ${e.department}`,
            }))}
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
    </StandardModal>
  )
}

// -------------------------------------------------------------------- Module

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'QC', 'STORE', 'ACCOUNTS']
const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operator',
  QC: 'Quality',
  STORE: 'Stores',
  ACCOUNTS: 'Accounts',
}
const PERMS: { key: PermissionKey; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'approve', label: 'Approve' },
]

export function ModuleModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState('')
  const [route, setRoute] = React.useState('')
  const [group, setGroup] = React.useState('')
  const [enabled, setEnabled] = React.useState(true)
  const [grid, setGrid] = React.useState<Record<string, boolean>>({ 'ADMIN:view': true, 'ADMIN:create': true, 'ADMIN:edit': true, 'ADMIN:approve': true })

  const toggle = (role: UserRole, perm: PermissionKey) => {
    const key = `${role}:${perm}`
    setGrid((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      // Every other right implies view, so granting one grants it.
      if (next[key] && perm !== 'view') next[`${role}:view`] = true
      // Removing view removes everything else for that role.
      if (!next[key] && perm === 'view') PERMS.forEach((p) => { next[`${role}:${p.key}`] = false })
      return next
    })
  }

  const rolesWithAccess = ROLES.filter((r) => grid[`${r}:view`]).length

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Module"
      size="lg"
      onSave={save}
      saving={saving}
      saveDisabled={!code || !name || !route}
      saveLabel="Create module"
      footerNote={`${rolesWithAccess} of ${ROLES.length} roles would have access`}
    >
      <FormSection title="Module">
        <FormGrid cols={2}>
          <Input label="Module code" required mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="MOD-RPT" />
          <Input label="Module name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Reports" />
          <Input label="Route" required mono value={route} onChange={(e) => setRoute(e.target.value)} placeholder="/reports" />
          <Select
            label="Group"
            placeholder="Select sidebar group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            options={[
              { value: 'Overview', label: 'Overview' },
              { value: 'Order to Cash', label: 'Order to Cash' },
              { value: 'Production', label: 'Production' },
              { value: 'Quality', label: 'Quality' },
              { value: 'Fulfilment', label: 'Fulfilment' },
              { value: 'System', label: 'System' },
            ]}
          />
        </FormGrid>
        <div className="mt-3">
          <Checkbox
            label="Enabled"
            hint="A disabled module is hidden from every role, whatever their permissions say"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </div>
      </FormSection>

      <FormSection title="Role permissions">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr>
                <th className="label-caps border-b border-r border-bd-default px-2 py-1.5 text-left">Role</th>
                {PERMS.map((p) => (
                  <th key={p.key} className="label-caps border-b border-bd-default px-2 py-1.5 text-center">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <tr key={role} className="border-b border-bd-subtle last:border-b-0">
                  <th scope="row" className="border-r border-bd-default px-2 py-1.5 text-left text-sm font-normal">
                    {ROLE_LABEL[role]}
                  </th>
                  {PERMS.map((p) => (
                    <td key={p.key} className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(grid[`${role}:${p.key}`])}
                        onChange={() => toggle(role, p.key)}
                        aria-label={`${ROLE_LABEL[role]} may ${p.label.toLowerCase()}`}
                        className="h-4 w-4 accent-[rgb(var(--color-primary))]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </StandardModal>
  )
}

// -------------------------------------------------------------------- Prefix

export function PrefixModal({ isOpen, onClose }: MasterModalProps) {
  const { saving, save } = useMockSave(onClose)
  const [documentKind, setDocumentKind] = React.useState('')
  const [documentName, setDocumentName] = React.useState('')
  const [prefix, setPrefix] = React.useState('')
  const [financialYear, setFinancialYear] = React.useState('2026-27')
  const [separator, setSeparator] = React.useState('-')
  const [padding, setPadding] = React.useState('4')
  const [startAt, setStartAt] = React.useState('1')
  const [resets, setResets] = React.useState(true)

  const preview: DocumentPrefix = {
    prefixId: 'preview',
    documentKind: 'SALES_ORDER',
    documentName,
    prefix: prefix || 'XX',
    financialYear,
    separator,
    padding: Number(padding) || 4,
    currentNumber: Number(startAt) || 1,
    resetsAnnually: resets,
    status: 'ACTIVE',
    createdBy: '',
    createdDate: '',
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Document Prefix"
      size="md"
      onSave={save}
      saving={saving}
      saveDisabled={!documentKind || !prefix}
      saveLabel="Create prefix"
      footerNote={`Next number would be ${formatDocumentNumber(preview, Number(startAt) || 1)}`}
    >
      <FormSection title="Document">
        <FormGrid cols={2}>
          <Select
            label="Document type"
            required
            placeholder="Select document"
            value={documentKind}
            onChange={(e) => {
              setDocumentKind(e.target.value)
              setDocumentName(e.target.selectedOptions?.[0]?.text ?? '')
            }}
            options={[
              { value: 'SALES_ORDER', label: 'Sales Order' },
              { value: 'JOB_CARD', label: 'Job Card' },
              { value: 'GRN', label: 'Goods Receipt Note' },
              { value: 'INVOICE', label: 'Tax Invoice' },
              { value: 'DELIVERY_NOTE', label: 'Delivery Note' },
              { value: 'COA', label: 'Certificate of Analysis' },
              { value: 'RECYCLING_NOTE', label: 'Recycling Transfer Note' },
              { value: 'ARTWORK', label: 'Artwork Code' },
              { value: 'PRODUCT', label: 'Product Code' },
              { value: 'GATE_PASS', label: 'Gate Pass' },
            ]}
          />
          <Input
            label="Display name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="Sales Order"
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Numbering">
        <FormGrid cols={2}>
          <Input label="Prefix" required mono value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="SO" />
          <Input label="Financial year" mono value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} placeholder="2026-27" />
          <Input label="Separator" mono value={separator} onChange={(e) => setSeparator(e.target.value)} placeholder="-" />
          <Input label="Padding" unit="digits" type="number" min={1} max={8} value={padding} onChange={(e) => setPadding(e.target.value)} />
          <Input label="Start at" type="number" min={1} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <DerivedField label="Next number" value={formatDocumentNumber(preview, Number(startAt) || 1)} emphasis />
        </FormGrid>
        <div className="mt-3">
          <Checkbox
            label="Reset the series each financial year"
            hint="Leave off for artwork and product codes, which must stay stable for the life of the design"
            checked={resets}
            onChange={(e) => setResets(e.target.checked)}
          />
        </div>
      </FormSection>
    </StandardModal>
  )
}

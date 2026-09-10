'use client'

import { MasterPage } from '@/components/layout'
import { Badge, Chip, Column, StackedCell } from '@/components/ui'
import { EmployeeModal } from '@/components/modals'
import { EMPLOYEES, USERS } from '@/data'
import { formatDate } from '@/lib/utils'
import type { Employee } from '@/types/masters'

const DEPT_TONE = {
  Production: 'primary',
  Quality: 'success',
  Stores: 'warning',
  Dispatch: 'info',
  Planning: 'muted',
  Administration: 'muted',
} as const

/** Certifications that let a person sign a quality gate. */
const GATE_CERTS = ['IQC', 'Line clearance', 'First piece', 'In-process', 'FG inspection', 'COA']

const userOf = (userId: string) => USERS.find((u) => u.userId === userId)

const columns: Column<Employee>[] = [
  {
    key: 'code',
    header: 'Employee',
    sortValue: (r) => r.employeeCode,
    render: (r) => <StackedCell top={r.employeeCode} bottom={userOf(r.userId)?.userName ?? '—'} mono />,
  },
  {
    key: 'user',
    header: 'Login',
    sortValue: (r) => userOf(r.userId)?.loginUserName ?? '',
    render: (r) => {
      const u = userOf(r.userId)
      return u ? (
        <StackedCell top={<span className="font-mono">{u.loginUserName}</span>} bottom={u.userCode} />
      ) : (
        <Badge tone="error">User missing</Badge>
      )
    },
  },
  { key: 'designation', header: 'Designation', render: (r) => userOf(r.userId)?.designation ?? '—' },
  { key: 'dept', header: 'Department', sortValue: (r) => r.department, render: (r) => <Badge tone={DEPT_TONE[r.department]}>{r.department}</Badge> },
  { key: 'shift', header: 'Shift', sortValue: (r) => r.shift, render: (r) => <span className="font-mono">{r.shift}</span> },
  { key: 'doj', header: 'Joined', sortValue: (r) => r.dateOfJoining, render: (r) => <span className="font-mono">{formatDate(r.dateOfJoining)}</span> },
  {
    key: 'reports',
    header: 'Reports to',
    render: (r) => {
      if (!r.reportsToEmployeeId) return <span className="text-fg-subtle">—</span>
      const mgr = EMPLOYEES.find((e) => e.employeeId === r.reportsToEmployeeId)
      return mgr ? (userOf(mgr.userId)?.userName ?? mgr.employeeCode) : '—'
    },
  },
  {
    key: 'certs',
    header: 'Certified for',
    render: (r) =>
      r.certifiedFor.length ? (
        <span className="flex flex-wrap gap-1">
          {r.certifiedFor.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
        </span>
      ) : (
        <span className="text-fg-subtle">None yet</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => r.status,
    render: (r) => (r.status === 'ACTIVE' ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>),
  },
]

export default function EmployeeMasterPage() {
  const production = EMPLOYEES.filter((e) => e.department === 'Production')
  const quality = EMPLOYEES.filter((e) => e.department === 'Quality')
  const canSignGates = EMPLOYEES.filter((e) => e.certifiedFor.some((c) => GATE_CERTS.includes(c)))

  return (
    <MasterPage
      title="Employees"
      entityName="employee"
      rows={EMPLOYEES}
      columns={columns}
      rowKey={(r) => r.employeeId}
      createModal={(props) => <EmployeeModal {...props} />}
    />
  )
}

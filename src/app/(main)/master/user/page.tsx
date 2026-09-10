'use client'

import { Users } from 'lucide-react'
import { MasterPage } from '@/components/layout'
import { Badge, Column, StackedCell } from '@/components/ui'
import { UserModal } from '@/components/modals'
import { EMPLOYEES, USERS } from '@/data'
import { formatDate } from '@/lib/utils'
import type { User, UserRole } from '@/types/masters'

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operator',
  QC: 'Quality',
  STORE: 'Stores',
  ACCOUNTS: 'Accounts',
}

const ROLE_TONE = {
  ADMIN: 'error',
  MANAGER: 'primary',
  SUPERVISOR: 'info',
  OPERATOR: 'muted',
  QC: 'success',
  STORE: 'warning',
  ACCOUNTS: 'muted',
} as const

const columns: Column<User>[] = [
  { key: 'code', header: 'User', sortValue: (r) => r.userCode, render: (r) => <StackedCell top={r.userCode} bottom={r.userName} mono /> },
  { key: 'login', header: 'Login name', sortValue: (r) => r.loginUserName, render: (r) => <span className="font-mono">{r.loginUserName}</span> },
  { key: 'email', header: 'Email', render: (r) => <span className="font-mono text-fg-muted">{r.email}</span> },
  { key: 'contact', header: 'Contact no', render: (r) => <span className="font-mono">{r.contactNo}</span> },
  { key: 'designation', header: 'Designation', sortValue: (r) => r.designation, render: (r) => r.designation },
  { key: 'role', header: 'Role', sortValue: (r) => r.role, render: (r) => <Badge tone={ROLE_TONE[r.role]}>{ROLE_LABEL[r.role]}</Badge> },
  { key: 'branch', header: 'Branch / unit', render: (r) => `${r.branch} · ${r.productionUnit}` },
  {
    key: 'employee',
    header: 'Employee record',
    render: (r) => {
      const emp = EMPLOYEES.find((e) => e.userId === r.userId)
      return emp ? (
        <span className="font-mono">{emp.employeeCode}</span>
      ) : (
        <span className="text-fg-subtle">Not linked</span>
      )
    },
  },
  {
    key: 'login-at',
    header: 'Last login',
    sortValue: (r) => r.lastLoginAt ?? '',
    render: (r) =>
      r.lastLoginAt ? (
        <span className="font-mono">{r.lastLoginAt}</span>
      ) : (
        <Badge tone="warning">Never signed in</Badge>
      ),
  },
  { key: 'created', header: 'Created', sortValue: (r) => r.createdDate, render: (r) => <span className="font-mono text-fg-muted">{formatDate(r.createdDate)}</span> },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => r.status,
    render: (r) => (
      <span className="flex items-center gap-1.5">
        {r.status === 'ACTIVE' ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>}
        {r.isAdmin ? <Badge tone="error">Admin</Badge> : null}
      </span>
    ),
  },
]

export default function UserMasterPage() {
  const active = USERS.filter((u) => u.status === 'ACTIVE')
  const admins = USERS.filter((u) => u.isAdmin)
  const pendingReset = USERS.filter((u) => u.mustResetPassword)
  const unlinked = USERS.filter((u) => !EMPLOYEES.some((e) => e.userId === u.userId))

  return (
    <MasterPage
      title="Users"
      entityName="user"
      rows={USERS}
      columns={columns}
      rowKey={(r) => r.userId}
      createModal={(props) => <UserModal {...props} />}
    />
  )
}

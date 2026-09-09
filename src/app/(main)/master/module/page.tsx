'use client'

import * as React from 'react'
import { Check, Minus, Plus, SlidersHorizontal, ToggleLeft, Upload, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge, Button, Column, DataTable, StackedCell, StatsCard, StatsGrid,
} from '@/components/ui'
import { DetailModal, ModuleModal } from '@/components/modals'
import { MODULES, USERS } from '@/data'
import { cn } from '@/lib/utils'
import type { AppModule, PermissionKey, UserRole } from '@/types/masters'

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'QC', 'STORE', 'ACCOUNTS']

const ROLE_SHORT: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operator',
  QC: 'Quality',
  STORE: 'Stores',
  ACCOUNTS: 'Accounts',
}

const PERMISSIONS: { key: PermissionKey; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'approve', label: 'Approve' },
]

/** How many of the four rights a role holds on a module. */
function grantCount(module: AppModule, role: UserRole) {
  return PERMISSIONS.filter((p) => module.rolePermissions[role][p.key]).length
}

export default function ModuleMasterPage() {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState(MODULES[1].moduleId)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const selected = MODULES.find((m) => m.moduleId === selectedId) ?? MODULES[0]

  const enabled = MODULES.filter((m) => m.enabled)
  const usersByRole = (role: UserRole) => USERS.filter((u) => u.role === role && u.status === 'ACTIVE').length

  const columns: Column<AppModule>[] = [
    { key: 'code', header: 'Module', sortValue: (r) => r.moduleName, render: (r) => <StackedCell top={r.moduleName} bottom={r.moduleCode} /> },
    { key: 'group', header: 'Group', sortValue: (r) => r.moduleGroup, render: (r) => r.moduleGroup },
    { key: 'route', header: 'Route', render: (r) => <span className="font-mono text-fg-muted">{r.route}</span> },
    {
      key: 'roles',
      header: 'Roles with access',
      align: 'right',
      sortValue: (r) => ROLES.filter((role) => r.rolePermissions[role].view).length,
      render: (r) => (
        <span className="font-mono">
          {ROLES.filter((role) => r.rolePermissions[role].view).length}
          <span className="text-fg-muted"> / {ROLES.length}</span>
        </span>
      ),
    },
    {
      key: 'enabled',
      header: 'State',
      sortValue: (r) => String(r.enabled),
      render: (r) => (r.enabled ? <Badge tone="success">Enabled</Badge> : <Badge tone="muted">Disabled</Badge>),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Masters"
        title="Modules"
        actions={
          <>
            <Button icon={Upload}>Import</Button>
            <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
              New module
            </Button>
          </>
        }
      />

      <StatsGrid>
        <StatsCard label="Modules" value={String(MODULES.length)} note={`${enabled.length} enabled`} icon={SlidersHorizontal} />
        <StatsCard label="Disabled" value={String(MODULES.length - enabled.length)} note="Hidden from every role" noteTone="warn" icon={ToggleLeft} />
        <StatsCard label="Roles" value={String(ROLES.length)} note="Permissions set per role" icon={Users} />
        <StatsCard label="Active users" value={String(USERS.filter((u) => u.status === 'ACTIVE').length)} note="Inherit their role's rights" icon={Users} />
      </StatsGrid>

      <>
        <DataTable
          title="Modules"
          rows={MODULES}
          columns={columns}
          rowKey={(r) => r.moduleId}
          selectedKey={selected.moduleId}
          onSelect={(r) => setSelectedId(r.moduleId)}
          onOpen={(r) => { setSelectedId(r.moduleId); setDetailOpen(true) }}
        />

        <DetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={selected.moduleName}
          subtitle={selected.route}
          badge={selected.enabled ? { label: 'Enabled', tone: 'success' } : { label: 'Disabled', tone: 'muted' }}
        >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className="label-caps border-b border-r border-bd-default bg-bg-grid-header px-3 py-2 text-left">
                  Role
                </th>
                {PERMISSIONS.map((p) => (
                  <th key={p.key} scope="col" className="label-caps border-b border-bd-default bg-bg-grid-header px-2 py-2 text-center">
                    {p.label}
                  </th>
                ))}
                <th scope="col" className="label-caps border-b border-bd-default bg-bg-grid-header px-3 py-2 text-right">
                  Users
                </th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => {
                const granted = grantCount(selected, role)
                return (
                  <tr key={role} className="border-b border-bd-subtle last:border-b-0">
                    <th
                      scope="row"
                      className={cn(
                        'border-r border-bd-default px-3 py-1.5 text-left text-sm font-normal',
                        granted === 0 && 'text-fg-subtle',
                      )}
                    >
                      {ROLE_SHORT[role]}
                    </th>
                    {PERMISSIONS.map((p) => {
                      const on = selected.rolePermissions[role][p.key]
                      return (
                        <td key={p.key} className="px-2 py-1.5 text-center">
                          {on ? (
                            <Check
                              className="mx-auto h-3.5 w-3.5 text-success"
                              aria-label={`${ROLE_SHORT[role]} can ${p.label.toLowerCase()}`}
                            />
                          ) : (
                            <Minus
                              className="mx-auto h-3.5 w-3.5 text-fg-subtle"
                              aria-label={`${ROLE_SHORT[role]} cannot ${p.label.toLowerCase()}`}
                            />
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-1.5 text-right font-mono text-sm text-fg-muted">{usersByRole(role)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </DetailModal>
      </>

      <ModuleModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

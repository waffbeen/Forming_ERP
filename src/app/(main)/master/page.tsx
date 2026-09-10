'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Badge, Panel, PanelBody, PanelHeader } from '@/components/ui'
import { NAV_SECTIONS } from '@/config/navigation'
import {
  ARTWORKS, BINS, CATEGORIES, CUSTOMERS, DIES, DOCUMENT_PREFIXES, EMPLOYEES, ITEMS, MACHINES,
  MATERIALS, MODULES, PRODUCTS, PROCESSES, QC_PARAMETERS, REELS, SUPPLIERS, USERS, WAREHOUSES,
} from '@/data'
import { formatNumber } from '@/lib/utils'

/**
 * What each master holds, and how many records are in it.
 *
 * The sidebar already lists the masters; what it cannot say is which of them
 * are actually filled in. A master nobody has populated is the reason a job
 * card cannot be raised later, so the count is the useful thing to show here.
 */
const HOLDINGS: Record<string, { count: number; holds: string }> = {
  '/master/client': { count: CUSTOMERS.length, holds: 'Who the plant sells to, and on what terms' },
  '/master/supplier': { count: SUPPLIERS.length, holds: 'Who the plant buys reel and packaging from' },
  '/master/category': { count: CATEGORIES.length, holds: 'How items and products are grouped' },
  '/master/item': { count: ITEMS.length, holds: 'Everything bought and held in the store' },
  '/master/product': { count: PRODUCTS.length, holds: 'Trays the plant already makes, ready to reorder' },
  '/master/artwork': { count: ARTWORKS.length, holds: "Customer designs, with the layout each is nested from" },
  '/master/process': { count: PROCESSES.length, holds: 'The steps a job passes through, and what each costs' },
  '/master/material': { count: MATERIALS.length, holds: 'Polymer grades, densities and rates per kilogram' },
  '/master/machine': { count: MACHINES.length, holds: 'Forming lines and presses, with their bed sizes' },
  '/master/die': { count: DIES.length, holds: 'Tooling, its cavity count and when it was last serviced' },
  '/master/item-qc-parameter': { count: QC_PARAMETERS.length, holds: 'What incoming goods are inspected against' },
  '/master/reel': { count: REELS.length, holds: 'Reel stock on the floor, by gauge and QC status' },
  '/master/warehouse': { count: WAREHOUSES.length + BINS.length, holds: 'Stores and the bins inside them' },
  '/master/user': { count: USERS.length, holds: 'Logins, roles and what each may reach' },
  '/master/employee': { count: EMPLOYEES.length, holds: 'People on the floor, each drawn from a user' },
  '/master/module': { count: MODULES.length, holds: 'Which parts of the system are switched on' },
  '/master/prefix': { count: DOCUMENT_PREFIXES.length, holds: 'How each document type is numbered, year by year' },
}

/* The sidebar is the single source of what masters exist, so this page follows
   it rather than keeping a second list that could drift out of step. */
const MASTER_SECTIONS = NAV_SECTIONS.filter((section) => section.title.startsWith('Masters'))

export default function MasterIndexPage() {
  const total = Object.values(HOLDINGS).reduce((sum, h) => sum + h.count, 0)
  const empty = Object.values(HOLDINGS).filter((h) => h.count === 0).length

  return (
    <>
      <PageHeader
        eyebrow="Masters"
        title="Master Data"
        actions={
          empty > 0 ? (
            <Badge tone="warning">
              {empty} master{empty > 1 ? 's' : ''} still empty
            </Badge>
          ) : (
            <Badge tone="success">{formatNumber(total)} records across every master</Badge>
          )
        }
      />

      <div className="flex flex-col gap-3.5">
        {MASTER_SECTIONS.map((section) => (
          <Panel key={section.title}>
            <PanelHeader title={section.title.replace('Masters · ', '')} />
            <PanelBody>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => {
                  const holding = HOLDINGS[item.href]
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex h-full items-start gap-3 rounded-md border border-bd-default bg-bg-surface p-3 transition-colors hover:border-primary hover:bg-bg-hover"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-bg-subtle text-fg-muted transition-colors group-hover:bg-primary group-hover:text-fg-inverse">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-fg-default">
                              {item.label}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                          </span>
                          <span className="mt-0.5 block text-xs text-fg-muted">
                            {holding?.holds ?? 'Reference data'}
                          </span>
                          <span className="mt-1.5 block font-mono text-xs text-fg-subtle">
                            {holding
                              ? holding.count > 0
                                ? `${formatNumber(holding.count)} records`
                                : 'Empty'
                              : '—'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </PanelBody>
          </Panel>
        ))}
      </div>
    </>
  )
}

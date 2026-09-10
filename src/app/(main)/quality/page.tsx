'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight, ClipboardCheck, FileCheck2, Gauge, ShieldAlert, type LucideIcon,
} from 'lucide-react'
import { PageHeader, Note } from '@/components/layout'
import { Badge, Panel, PanelBody, PanelHeader } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import {
  COAS, CUTTING_DEFECT_CHECKS, FORMING_DEFECT_CHECKS, JOB_CARDS, pendingQcLines,
} from '@/data'

/* Quality, as a directory rather than a workspace.

   Four different checks, done by four different people, at four different points
   in the run — the supervisor at the machine before it starts, the QC executive
   at the receiving bay, the QC executive on the line, the QA manager at the end.
   Putting them on one screen made it look like one person's job, which is
   exactly the confusion the paper formats already cause. Each has its own screen
   now, and this page only says who owns what and what is waiting. */

interface Area {
  href: string
  title: string
  owner: string
  /** What the person actually does there, in their own terms. */
  work: string
  when: string
  icon: LucideIcon
  pending: number
  pendingLabel: string
  tone: BadgeTone
}

export default function QualityPage() {
  const atGate = JOB_CARDS.filter(
    (j) => j.stages.FORMING === 'BLOCKED' || j.stages.FORMING === 'PENDING',
  ).length
  const pendingBatches = pendingQcLines().length
  const defects = [...FORMING_DEFECT_CHECKS, ...CUTTING_DEFECT_CHECKS].filter((c) =>
    Object.values(c.results).some((r) => r === 'DEFECT'),
  ).length
  const unsealed = COAS.filter((c) => !c.gdpAuditLock).length

  const areas: Area[] = [
    {
      href: '/quality/rm-qc',
      title: 'Raw Material QC',
      owner: 'QC executive, receiving bay',
      work: 'Inspects each received batch against the item’s format, then approves, holds or returns the quantity',
      when: 'On receipt, before anything becomes stock',
      icon: ClipboardCheck,
      pending: pendingBatches,
      pendingLabel: pendingBatches === 1 ? 'batch waiting' : 'batches waiting',
      tone: pendingBatches > 0 ? 'warning' : 'success',
    },
    {
      href: '/quality/line-clearance',
      title: 'Line Clearance',
      owner: 'Production / QC supervisor',
      work: 'Checks the six areas are physically cleared of the previous job and releases the machine',
      when: 'Before a run starts',
      icon: ShieldAlert,
      pending: atGate,
      pendingLabel: atGate === 1 ? 'job at the gate' : 'jobs at the gate',
      tone: atGate > 0 ? 'warning' : 'success',
    },
    {
      href: '/quality/in-process',
      title: 'In-Process Checks',
      owner: 'QC executive, on the line',
      work: 'Fills the hourly defect checklist and thickness log for the section that is running',
      when: 'Every hour, while the run is going',
      icon: Gauge,
      pending: defects,
      pendingLabel: defects === 1 ? 'defect logged' : 'defects logged',
      tone: defects > 0 ? 'warning' : 'success',
    },
    {
      href: '/quality/fg-coa',
      title: 'Finished Goods & COA',
      owner: 'QA manager',
      work: 'Verifies the run’s records match and releases the certificate the customer receives',
      when: 'After the job closes',
      icon: FileCheck2,
      pending: unsealed,
      pendingLabel: unsealed === 1 ? 'record open' : 'records open',
      tone: unsealed > 0 ? 'warning' : 'success',
    },
  ]

  return (
    <>
      <PageHeader eyebrow="Quality & Compliance" title="Quality Control" />

      <Panel>
        <PanelHeader
          title="Who checks what"
          description="Each check has its own screen, because each one is a different person’s signature"
        />
        <PanelBody>
          <ul className="space-y-2">
            {areas.map((area) => (
              <li key={area.href}>
                <Link
                  href={area.href}
                  className="group flex items-start gap-3 rounded-md border border-bd-default px-3 py-3 transition-colors hover:border-bd-strong hover:bg-bg-hover"
                >
                  <area.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold">{area.title}</span>
                      <span className="text-xs text-fg-muted">{area.owner}</span>
                      <Badge tone={area.tone}>
                        {area.pending} {area.pendingLabel}
                      </Badge>
                    </div>
                    <p className="mt-0.5 max-w-[80ch] text-xs text-fg-muted">{area.work}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle">{area.when}</p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </PanelBody>
      </Panel>

      <Note>
        The order matters as much as the split: material cannot be issued until incoming QC approves it, a run cannot
        start until the supervisor releases the machine, and a certificate cannot be released until the hourly checks
        behind it are complete.
      </Note>
    </>
  )
}

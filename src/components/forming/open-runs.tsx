'use client'

import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { Badge, Button, Panel, PanelBody, PanelHeader } from '@/components/ui'
import { savedAgo, type RunDraft } from '@/lib/run-drafts'
import { JOB_CARDS } from '@/data'

/* Runs left open on this terminal.

   A run is worked across a whole shift, and two machines on the same job card
   are two separate runs. Listing them on the page — rather than behind one
   Resume button that could only ever reopen the newest — is what stops the
   second press's record being the one nobody remembers to finish. */

const STEP_LABELS = [
  'Job details',
  'Line clearance',
  'First piece',
  'Job start',
  'In-process',
  'Job end',
]

export function OpenRuns({
  runs,
  onResume,
}: {
  runs: RunDraft[]
  /** Resumes one run: a job card on a machine. */
  onResume: (jobCardNo: string, machineCode: string) => void
}) {
  if (runs.length === 0) return null

  return (
    <Panel>
      <PanelHeader
        title={`Runs left open · ${runs.length}`}
        description="Part-worked records on this terminal. Each machine keeps its own."
        action={<Badge tone="warning">Not posted yet</Badge>}
      />
      <PanelBody>
        <ul className="space-y-1.5">
          {runs.map((run) => {
            const job = JOB_CARDS.find((j) => j.jobCardNo === run.jobCardNo)
            return (
              <li
                key={`${run.jobCardNo}|${run.machineCode}`}
                className="flex flex-wrap items-center gap-2 rounded-md border border-bd-default px-3 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-sm font-medium">{run.jobCardNo}</span>
                  {run.machineCode ? (
                    <span className="ml-2 font-mono text-xs text-primary">{run.machineCode}</span>
                  ) : (
                    <span className="ml-2 text-xs text-fg-subtle">no machine recorded</span>
                  )}
                  {job ? <span className="ml-2 text-sm">{job.customerName}</span> : null}
                  <span className="mt-0.5 block text-xs text-fg-muted">
                    {STEP_LABELS[Math.min(Math.max(run.step, 1), STEP_LABELS.length) - 1]} · saved{' '}
                    {savedAgo(run.savedAt)}
                  </span>
                </span>
                <Button
                  variant="primary"
                  icon={RotateCcw}
                  onClick={() => onResume(run.jobCardNo, run.machineCode)}
                >
                  Resume
                </Button>
              </li>
            )
          })}
        </ul>
      </PanelBody>
    </Panel>
  )
}

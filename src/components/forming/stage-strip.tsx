import { cn } from '@/lib/utils'
import type { JobStage, StageState } from '@/types'

const ORDER: JobStage[] = ['REEL_ISSUE', 'FORMING', 'CUTTING', 'SORTING', 'PACKING']

const LABELS: Record<JobStage, string> = {
  REEL_ISSUE: 'Reel issue',
  FORMING: 'Forming',
  CUTTING: 'Cutting',
  SORTING: 'Sorting',
  PACKING: 'Packing',
}

const STATE_CLASS: Record<StageState, string> = {
  DONE: 'bg-success',
  ACTIVE: 'bg-primary',
  BLOCKED: 'bg-error',
  PENDING: 'bg-bd-strong',
}

/** The gated steps of a job card, read left to right. */
export function StageStrip({ stages }: { stages: Record<JobStage, StageState> }) {
  return (
    <span className="inline-flex gap-0.5" aria-label="Job stage progress">
      {ORDER.map((stage) => (
        <i
          key={stage}
          title={`${LABELS[stage]} — ${stages[stage].toLowerCase()}`}
          className={cn('h-1.5 w-4 rounded-sm', STATE_CLASS[stages[stage]])}
        />
      ))}
    </span>
  )
}

export function StageLegend() {
  return (
    <span className="inline-flex flex-wrap items-center gap-3 text-xs text-fg-muted">
      {ORDER.map((stage, i) => (
        <span key={stage}>
          {i > 0 ? <span className="mr-3 text-fg-subtle">→</span> : null}
          {LABELS[stage]}
        </span>
      ))}
    </span>
  )
}

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'

/* Small figures for the dashboard.

   Every one of these is a magnitude against a whole — produced against
   ordered, running against the shift, one stage against the others — so they
   are all the same single-hue bar rather than a different colour per thing.
   Colour is never the only thing carrying a value here: each mark is directly
   labelled, which is what lets the status hues be used for status and nothing
   else.

   The plant's status colours fail a colourblind separation check when they sit
   next to each other, so nothing here stacks them in one bar. Where three
   states have to be compared they get a row each, labelled. */

const TONES = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  muted: 'bg-fg-subtle',
} as const

export type MeterTone = keyof typeof TONES

export interface MeterProps {
  value: number
  max: number
  /** What the bar is of, shown above it. */
  label?: React.ReactNode
  /** The number itself, already formatted. Falls back to value of max. */
  valueLabel?: React.ReactNode
  tone?: MeterTone
  /** A commitment to mark on the track, e.g. the quantity ordered. */
  target?: number
  /** Taller bars for the figure a screen is about. */
  size?: 'sm' | 'md'
  className?: string
}

export function Meter({
  value,
  max,
  label,
  valueLabel,
  tone = 'primary',
  target,
  size = 'sm',
  className,
}: MeterProps) {
  const share = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const targetShare = target && max > 0 ? Math.min(Math.max(target / max, 0), 1) : null

  return (
    <div className={cn('min-w-0', className)}>
      {label || valueLabel ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {label ? <span className="truncate text-xs text-fg-muted">{label}</span> : <span />}
          {valueLabel ? (
            <span className="shrink-0 font-mono text-xs font-medium">{valueLabel}</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-bg-subtle',
          size === 'md' ? 'h-2.5' : 'h-1.5',
        )}
        title={`${formatNumber(value, 1)} of ${formatNumber(max, 1)}`}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', TONES[tone])}
          style={{ width: `${share * 100}%` }}
        />
        {targetShare !== null ? (
          /* The commitment, marked on the track rather than drawn as a second
             bar, so there is still only one scale to read. */
          <span
            className="absolute top-0 h-full w-0.5 bg-fg-default/45"
            style={{ left: `calc(${targetShare * 100}% - 1px)` }}
            title={`Ordered ${formatNumber(target ?? 0)}`}
          />
        ) : null}
      </div>
    </div>
  )
}

/**
 * Where the work is sitting, stage by stage. The stages are ordered, so this is
 * columns left to right and every column carries its own count — the height is
 * the comparison, the label is the value.
 */
export function StageColumns({
  steps,
  format = (n: number) => String(n),
}: {
  steps: { label: string; count: number; tone?: MeterTone }[]
  /** How the figure above each column reads, where it is not a plain count. */
  format?: (value: number) => string
}) {
  const peak = Math.max(...steps.map((s) => s.count), 1)

  return (
    <ul className="flex items-end gap-2">
      {steps.map((step) => {
        const height = step.count === 0 ? 4 : Math.max((step.count / peak) * 88, 10)
        return (
          <li key={step.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="font-mono text-sm font-semibold">{format(step.count)}</span>
            <div
              className="flex w-full items-end justify-center"
              style={{ height: 92 }}
              title={`${format(step.count)} · ${step.label}`}
            >
              <div
                className={cn(
                  'w-full rounded-t-[4px]',
                  step.count === 0 ? 'bg-bd-default' : TONES[step.tone ?? 'primary'],
                )}
                style={{ height }}
              />
            </div>
            <span className="w-full truncate text-center text-2xs text-fg-muted" title={step.label}>
              {step.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

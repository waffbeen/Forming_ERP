'use client'

import { CheckCheck, Copy, Eraser } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ParameterResult } from '@/types/run-record'

const RESULTS: { value: ParameterResult; label: string; tone: string }[] = [
  { value: 'OK', label: 'OK', tone: 'border-success bg-success text-fg-inverse' },
  { value: 'DEFECT', label: 'Defect', tone: 'border-error bg-error text-fg-inverse' },
]

/**
 * One quality parameter per row, marked OK or Defect.
 *
 * The first piece and every hourly check are judged against the same list on
 * the client's format, so they are filled in on the same control here. Tapping
 * the mark already set clears it, because on a tablet an operator's mis-tap has
 * to be undoable without the row reading as inspected.
 *
 * A clean check is the normal case — nine of them a shift, ten parameters
 * each — so marking the whole list at once is one tap and the operator only
 * changes what actually went wrong. Nothing is filled in on their behalf: the
 * tap is still theirs, it is just not ten of them.
 */
export function ParameterResults({
  parameters,
  results,
  onChange,
  onSetAll,
  onCopyPrevious,
  copyLabel,
}: {
  parameters: readonly string[]
  results: Record<string, ParameterResult>
  onChange: (parameter: string, value: ParameterResult) => void
  /** Marks every parameter at once. Omit to hide the bulk controls. */
  onSetAll?: (value: ParameterResult) => void
  /** Carries the previous check forward, defects and all. */
  onCopyPrevious?: () => void
  copyLabel?: string
}) {
  const checked = parameters.filter((p) => results[p] && results[p] !== 'NOT_CHECKED').length
  const defects = parameters.filter((p) => results[p] === 'DEFECT')

  return (
    <>
      {onSetAll || onCopyPrevious ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {onSetAll ? (
            <>
              <Button icon={CheckCheck} onClick={() => onSetAll('OK')}>
                Mark all OK
              </Button>
              <Button
                icon={Eraser}
                disabled={checked === 0}
                onClick={() => onSetAll('NOT_CHECKED')}
              >
                Clear
              </Button>
            </>
          ) : null}
          {onCopyPrevious ? (
            <Button icon={Copy} onClick={onCopyPrevious}>
              {copyLabel ?? 'Same as previous'}
            </Button>
          ) : null}
          <span className="text-xs text-fg-subtle">then change only what went wrong</span>
        </div>
      ) : null}

      {/* Two columns on a wide screen: the whole format fits without scrolling. */}
      <ul className="grid grid-cols-1 gap-1.5 lg:grid-cols-2">
        {parameters.map((parameter) => {
          const value = results[parameter] ?? 'NOT_CHECKED'
          return (
            <li
              key={parameter}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-2',
                value === 'DEFECT' ? 'border-error/50 bg-error-subtle' : 'border-bd-default',
              )}
            >
              <span className="min-w-0 flex-1 text-sm">{parameter}</span>
              <span className="flex shrink-0 gap-1">
                {RESULTS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(parameter, value === option.value ? 'NOT_CHECKED' : option.value)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      value === option.value
                        ? option.tone
                        : 'border-bd-default text-fg-muted hover:bg-bg-hover hover:text-fg-default',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2.5 text-xs text-fg-muted">
        {checked} of {parameters.length} parameters checked
        {defects.length > 0 ? (
          <span className="text-error"> · {defects.length} defect{defects.length > 1 ? 's' : ''} found</span>
        ) : null}
      </p>
    </>
  )
}

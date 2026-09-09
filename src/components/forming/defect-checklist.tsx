'use client'

import * as React from 'react'
import { Check, Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DefectResult = 'OK' | 'DEFECT' | 'NOT_CHECKED'

export interface DefectCheck {
  /** 'FPA' for the first-piece column, otherwise the check number as a string. */
  id: string
  time: string
  inspector: string
  /** Keyed by defect label. Anything missing reads as not checked. */
  results: Record<string, DefectResult>
}

const CELL: Record<DefectResult, { className: string; icon: typeof Check; label: string }> = {
  OK: { className: 'text-success', icon: Check, label: 'OK' },
  DEFECT: { className: 'text-error', icon: X, label: 'Defect found' },
  NOT_CHECKED: { className: 'text-fg-subtle', icon: Minus, label: 'Not checked' },
}

/**
 * The in-process quality format as the floor actually fills it: one column per
 * check across the shift, one row per defect parameter, with the first-piece
 * approval column ahead of check 1.
 *
 * Reproducing the paper layout matters here. An auditor reads down a column to
 * see one inspection, and across a row to see whether a defect recurs.
 */
export function DefectChecklist({
  defects,
  checks,
  documentNo,
  section,
}: {
  defects: readonly string[]
  checks: DefectCheck[]
  documentNo: string
  section: string
}) {
  const defectCount = (defect: string) =>
    checks.filter((c) => c.results[defect] === 'DEFECT').length

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">
          {section} in-process checklist, document {documentNo}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="label-caps sticky left-0 z-10 border-b border-r border-bd-default bg-bg-grid-header px-3 py-2 text-left"
            >
              Quality parameter
            </th>
            {checks.map((check) => (
              <th
                key={check.id}
                scope="col"
                className={cn(
                  'label-caps border-b border-bd-default bg-bg-grid-header px-2 py-2 text-center',
                  check.id === 'FPA' && 'border-r border-r-bd-strong',
                )}
              >
                <span className="block">{check.id}</span>
                <span className="block font-mono text-2xs font-normal normal-case tracking-normal text-fg-subtle">
                  {check.time}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {defects.map((defect) => {
            const found = defectCount(defect)
            return (
              <tr key={defect} className="border-b border-bd-subtle last:border-b-0">
                <th
                  scope="row"
                  className={cn(
                    'sticky left-0 z-10 border-r border-bd-default bg-bg-surface px-3 py-1.5 text-left text-sm font-normal',
                    found > 0 && 'font-medium text-error',
                  )}
                >
                  {defect}
                </th>
                {checks.map((check) => {
                  const result = check.results[defect] ?? 'NOT_CHECKED'
                  const cell = CELL[result]
                  const Icon = cell.icon
                  return (
                    <td
                      key={check.id}
                      className={cn('px-2 py-1.5 text-center', check.id === 'FPA' && 'border-r border-bd-strong')}
                    >
                      <Icon
                        className={cn('mx-auto h-3.5 w-3.5', cell.className)}
                        aria-label={`${defect}, ${check.id}: ${cell.label}`}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <th
              scope="row"
              className="label-caps sticky left-0 z-10 border-r border-t border-bd-default bg-bg-subtle px-3 py-2 text-left"
            >
              QC sign
            </th>
            {checks.map((check) => (
              <td
                key={check.id}
                className={cn(
                  'border-t border-bd-default bg-bg-subtle px-2 py-2 text-center text-2xs text-fg-muted',
                  check.id === 'FPA' && 'border-r border-r-bd-strong',
                )}
              >
                {check.inspector
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

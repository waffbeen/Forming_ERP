'use client'

import * as React from 'react'
import { Check, Lock, LockOpen } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface SignatureLine {
  id: string
  label: string
  hint: string
  signedBy?: string
  signedAt?: string
}

/**
 * The GDP gate. Forming and punching stay locked until QC signs line
 * clearance and first-piece approval, and signatures seal on save so
 * nothing can be pre- or post-dated for an audit.
 */
export function SignatureGate({
  machineLabel,
  jobLabel,
  lines,
  areas,
  declaration,
  signAction = 'Sign line clearance',
  unlockedTitle = 'Machine unlocked',
  unlockedText = 'The operator tablet now accepts the start counter reading. Both signatures are sealed and cannot be edited.',
  lockedTitle = 'Run blocked',
  lockedText = 'Line clearance is unsigned. The tablet will not accept a counter reading until QC signs off here.',
}: {
  machineLabel: string
  jobLabel: string
  lines: SignatureLine[]
  /** The physical areas checked before the machine is released. */
  areas?: readonly string[]
  /** The declaration the signatories are attesting to. */
  declaration?: string
  signAction?: string
  unlockedTitle?: string
  unlockedText?: string
  lockedTitle?: string
  lockedText?: string
}) {
  const [signed, setSigned] = React.useState(false)
  const preSigned = lines.filter((l) => l.signedBy).length

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">{machineLabel}</h4>
          <p className="font-mono text-xs text-fg-muted">{jobLabel}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Check}
          disabled={signed}
          onClick={() => setSigned(true)}
        >
          {signed ? 'Signed 09:26' : signAction}
        </Button>
      </div>

      <div
        className={cn(
          'flex items-start gap-3 rounded-md border p-3',
          signed
            ? 'border-success/35 bg-success-subtle'
            : 'border-error/35 bg-error-subtle',
        )}
      >
        {signed ? (
          <LockOpen className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : (
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-error" />
        )}
        <div>
          <h5 className={cn('text-sm font-semibold', signed ? 'text-success' : 'text-error')}>
            {signed ? unlockedTitle : lockedTitle}
          </h5>
          <p className="mt-0.5 max-w-[60ch] text-xs text-fg-muted">{signed ? unlockedText : lockedText}</p>
        </div>
      </div>

      {areas?.length ? (
        <div className="mt-3 rounded-md border border-bd-default p-3">
          <p className="label-caps mb-2">Areas identified to check</p>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {areas.map((area) => (
              <li key={area} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    'grid h-4 w-4 shrink-0 place-items-center rounded border-[1.5px]',
                    signed ? 'border-success bg-success' : 'border-bd-strong',
                  )}
                >
                  {signed ? <Check className="h-3 w-3 text-fg-inverse" strokeWidth={3.2} /> : null}
                </span>
                {area}
              </li>
            ))}
          </ul>
          {declaration ? (
            <p className="mt-2.5 border-t border-bd-subtle pt-2 text-xs italic text-fg-muted">{declaration}</p>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-3 space-y-1.5">
        {lines.map((line, i) => {
          const isSigned = Boolean(line.signedBy) || signed
          const by = line.signedBy ?? (signed ? 'Meera S.' : null)
          const at = line.signedAt ?? (signed ? (i === preSigned ? '09:26' : '09:31') : null)
          return (
            <li
              key={line.id}
              className="flex items-center gap-2.5 rounded-md border border-bd-default bg-bg-surface px-3 py-2"
            >
              <span
                className={cn(
                  'grid h-4 w-4 shrink-0 place-items-center rounded border-[1.5px]',
                  isSigned ? 'border-success bg-success' : 'border-bd-strong bg-bg-surface',
                )}
              >
                {isSigned ? <Check className="h-3 w-3 text-fg-inverse" strokeWidth={3.2} /> : null}
              </span>
              <span className="text-sm font-medium">
                {line.label}
                <span className="block text-xs font-normal text-fg-muted">{line.hint}</span>
              </span>
              <span className="ml-auto text-right text-xs leading-tight text-fg-muted">
                {by ?? 'Pending'}
                <span className="block font-mono">{at ?? '—'}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

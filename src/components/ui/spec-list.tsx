import { cn } from '@/lib/utils'

export interface SpecRow {
  label: string
  value: React.ReactNode
  emphasis?: boolean
  mono?: boolean
}

/** Label/value pairs used across artwork, costing and reconciliation panels. */
export function SpecList({ rows, className }: { rows: SpecRow[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[minmax(0,auto)_auto] gap-x-4 gap-y-2 text-sm', className)}>
      {rows.map((row) => (
        <div key={row.label} className="contents">
          {/* Labels wrap rather than push the value out of the panel. */}
          <dt className="min-w-0 text-balance text-fg-muted">{row.label}</dt>
          <dd
            className={cn(
              'm-0 whitespace-nowrap text-right font-medium',
              row.mono !== false && 'font-mono',
              row.emphasis && 'font-semibold text-primary',
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('my-3 h-px bg-bd-subtle', className)} />
}

export function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-md border border-primary-line bg-primary-subtle px-3 py-2.5">
      <span className="text-sm text-fg-muted">{label}</span>
      <b className="font-mono text-lg font-semibold tracking-tight text-primary">{value}</b>
    </div>
  )
}

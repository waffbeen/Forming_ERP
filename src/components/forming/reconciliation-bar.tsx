import { formatNumber } from '@/lib/utils'

export interface ReconciliationBarProps {
  goodKg: number
  skeletonKg: number
  rejectKg: number
}

/** Every kilogram consumed lands in exactly one of three buckets. */
export function ReconciliationBar({ goodKg, skeletonKg, rejectKg }: ReconciliationBarProps) {
  const total = goodKg + skeletonKg + rejectKg
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0)

  return (
    <div>
      <div
        className="flex h-9 overflow-hidden rounded-md border border-bd-default"
        role="img"
        aria-label={`Of ${formatNumber(total, 1)} kilograms consumed, ${formatNumber(goodKg, 1)} became good trays, ${formatNumber(skeletonKg, 1)} skeleton trim and ${formatNumber(rejectKg, 1)} rejects.`}
      >
        <div className="grid place-items-center bg-primary px-2 text-xs font-semibold text-on-primary" style={{ flex: goodKg }}>
          <span className="truncate font-mono">{formatNumber(goodKg, 1)} kg good trays</span>
        </div>
        <div className="grid place-items-center bg-highlight px-1 text-xs font-semibold text-on-primary" style={{ flex: skeletonKg }}>
          <span className="truncate font-mono">{formatNumber(skeletonKg, 1)} skeleton</span>
        </div>
        <div className="bg-error" style={{ flex: Math.max(rejectKg, 0.4) }} />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-3.5 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
          Good trays {formatNumber(pct(goodKg), 1)} %
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-highlight" />
          Skeleton trim {formatNumber(pct(skeletonKg), 1)} %
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-error" />
          Rejects {formatNumber(pct(rejectKg), 1)} %
        </span>
      </div>
    </div>
  )
}

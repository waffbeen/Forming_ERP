import { cn } from '@/lib/utils'

export interface MicronMeterProps {
  reading: number
  specMicrons: number
  tolerancePct?: number
}

/** Places one thickness reading against its tolerance band. */
export function MicronMeter({ reading, specMicrons, tolerancePct = 5 }: MicronMeterProps) {
  const low = specMicrons * (1 - tolerancePct / 100)
  const high = specMicrons * (1 + tolerancePct / 100)
  const min = specMicrons * 0.9
  const max = specMicrons * 1.1
  const toPct = (v: number) => ((v - min) / (max - min)) * 100
  const inSpec = reading >= low && reading <= high

  return (
    <span className="flex items-center gap-2" title={`Spec ${Math.round(low)}–${Math.round(high)} µm`}>
      <span className="relative h-1.5 min-w-[70px] flex-1 rounded-sm bg-bd-strong">
        <span
          className="absolute inset-y-0 rounded-sm border-x border-success bg-success-subtle"
          style={{ left: `${toPct(low)}%`, width: `${toPct(high) - toPct(low)}%` }}
        />
        <span
          className={cn('absolute -top-[3px] h-3 w-[3px] rounded-sm', inSpec ? 'bg-primary' : 'bg-error')}
          style={{ left: `calc(${toPct(reading)}% - 1.5px)` }}
        />
      </span>
    </span>
  )
}

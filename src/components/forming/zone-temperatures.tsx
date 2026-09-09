'use client'

import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'

export interface ZoneTemperaturesProps {
  readings: number[]
  /** Forming window for the polymer being run, in °C. */
  min: number
  max: number
}

/**
 * The heater tunnel's zone temperature chart, logged once per run on the
 * client's forming record. Twenty-seven zones is too many to read as a table,
 * so it is drawn as a profile: the band is the polymer's forming window and any
 * zone outside it is the reason a sheet came out short or webbed.
 */
export function ZoneTemperatures({ readings, min, max }: ZoneTemperaturesProps) {
  const lo = Math.min(min, ...readings) - 10
  const hi = Math.max(max, ...readings) + 10
  const span = hi - lo || 1
  const height = (v: number) => ((v - lo) / span) * 100
  const outOfWindow = readings.filter((r) => r < min || r > max).length

  return (
    <div className="rounded-md border border-bd-default p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="label-caps">Zone temperature chart</p>
        <p className="text-xs text-fg-muted">
          {readings.length} zones ·{' '}
          <span className="font-mono">
            {min}–{max} °C
          </span>{' '}
          window ·{' '}
          {outOfWindow === 0 ? (
            <span className="text-success">all in window</span>
          ) : (
            <span className="text-error">{outOfWindow} outside</span>
          )}
        </p>
      </div>

      <div
        className="relative flex h-24 items-end gap-[2px]"
        role="img"
        aria-label={`Heater zone temperatures across ${readings.length} zones, forming window ${min} to ${max} degrees Celsius, ${outOfWindow} zones outside the window.`}
      >
        {/* Forming window band */}
        <div
          className="pointer-events-none absolute inset-x-0 rounded-sm bg-success-subtle"
          style={{ bottom: `${height(min)}%`, height: `${height(max) - height(min)}%` }}
        />
        {readings.map((reading, i) => {
          const bad = reading < min || reading > max
          return (
            <span
              key={i}
              title={`Zone ${String(i + 1).padStart(2, '0')}: ${reading} °C`}
              className={cn('relative flex-1 rounded-t-sm', bad ? 'bg-error' : 'bg-primary')}
              style={{ height: `${height(reading)}%` }}
            />
          )
        })}
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-2xs text-fg-subtle">
        <span>Zone 01</span>
        <span>
          avg {formatNumber(readings.reduce((s, r) => s + r, 0) / readings.length, 1)} °C
        </span>
        <span>Zone {String(readings.length).padStart(2, '0')}</span>
      </div>
    </div>
  )
}

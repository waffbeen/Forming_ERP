import { calculateNesting } from '@/lib/layout-calc'
import { formatNumber } from '@/lib/utils'

export interface NestingDiagramProps {
  openLengthMm: number
  openWidthMm: number
  deckleWidthMm: number
  bedPitchMm: number
  skeletonKg?: number
}

/**
 * Scale drawing of how the 2D expanded tray layout nests on one sheet.
 * The accent-coloured ground is the skeleton border that goes back to recycling.
 */
export function NestingDiagram({
  openLengthMm,
  openWidthMm,
  deckleWidthMm,
  bedPitchMm,
  skeletonKg,
}: NestingDiagramProps) {
  const nest = calculateNesting({ openLengthMm, openWidthMm, deckleWidthMm, bedPitchMm })
  const padLeft = 46
  const padTop = 34
  const padBottom = 46

  return (
    <figure className="m-0 rounded-md border border-bd-subtle bg-bg-subtle p-3">
      <svg
        viewBox={`${-padLeft} ${-padTop} ${deckleWidthMm + padLeft + 20} ${bedPitchMm + padTop + padBottom}`}
        className="mx-auto block h-auto max-h-[340px] w-full"
        role="img"
        aria-label={`Nesting layout: ${nest.upsPerSheet} trays of ${openLengthMm} by ${openWidthMm} millimetres arranged ${nest.across} across and ${nest.down} down on a ${deckleWidthMm} by ${bedPitchMm} millimetre sheet, leaving ${formatNumber(nest.skeletonFraction * 100, 1)} percent skeleton.`}
      >
        {/* Skeleton ground */}
        <rect
          x={0}
          y={0}
          width={deckleWidthMm}
          height={bedPitchMm}
          rx={6}
          fill="rgb(var(--color-highlight-subtle))"
          stroke="rgb(var(--color-highlight))"
          strokeWidth={2}
        />

        {/* Cavities in their nested positions */}
        {nest.positions.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx={10}
              fill="rgb(var(--color-primary-subtle))"
              stroke="rgb(var(--color-primary))"
              strokeWidth={2.2}
            />
            {/* Inner dashed outline suggests the drawn cavity inside the flange */}
            <rect
              x={p.x + p.w * 0.1}
              y={p.y + p.h * 0.11}
              width={p.w * 0.8}
              height={p.h * 0.78}
              rx={7}
              fill="none"
              stroke="rgb(var(--color-primary))"
              strokeWidth={1.2}
              strokeDasharray="7 5"
              opacity={0.6}
            />
            <text
              x={p.x + p.w / 2}
              y={p.y + p.h / 2 + 8}
              textAnchor="middle"
              fill="rgb(var(--color-primary))"
              fontFamily="var(--font-mono), monospace"
              fontSize={22}
              fontWeight={600}
            >
              {i + 1}
            </text>
          </g>
        ))}

        {/* Deckle dimension along the top */}
        <path
          d={`M0 -16h${deckleWidthMm}M0 -22v12M${deckleWidthMm} -22v12`}
          stroke="rgb(var(--fg-muted))"
          strokeWidth={1.6}
          fill="none"
        />
        <rect x={deckleWidthMm / 2 - 78} y={-30} width={156} height={26} fill="rgb(var(--bg-subtle))" />
        <text
          x={deckleWidthMm / 2}
          y={-11}
          textAnchor="middle"
          fill="rgb(var(--fg-muted))"
          fontFamily="var(--font-mono), monospace"
          fontSize={19}
        >
          {deckleWidthMm} mm deckle
        </text>

        {/* Bed pitch down the left */}
        <path
          d={`M-18 0v${bedPitchMm}M-24 0h12M-24 ${bedPitchMm}h12`}
          stroke="rgb(var(--fg-muted))"
          strokeWidth={1.6}
          fill="none"
        />
        <rect x={-40} y={bedPitchMm / 2 - 80} width={26} height={160} fill="rgb(var(--bg-subtle))" />
        <text
          x={-27}
          y={bedPitchMm / 2}
          textAnchor="middle"
          transform={`rotate(-90 -27 ${bedPitchMm / 2})`}
          fill="rgb(var(--fg-muted))"
          fontFamily="var(--font-mono), monospace"
          fontSize={19}
        >
          {bedPitchMm} mm bed pitch
        </text>

        {/* One cavity dimension, called out on the first tray */}
        {nest.positions[0] ? (
          <text
            x={nest.positions[0].x + nest.positions[0].w / 2}
            y={nest.positions[0].y + nest.positions[0].h - 12}
            textAnchor="middle"
            fill="rgb(var(--fg-muted))"
            fontFamily="var(--font-mono), monospace"
            fontSize={15}
          >
            {formatNumber(nest.positions[0].w)} × {formatNumber(nest.positions[0].h)}
          </text>
        ) : null}

        <text
          x={deckleWidthMm / 2}
          y={bedPitchMm + 32}
          textAnchor="middle"
          fill="rgb(var(--color-highlight))"
          fontFamily="var(--font-mono), monospace"
          fontSize={18}
        >
          skeleton border · {formatNumber(nest.skeletonFraction * 100, 1)} %
          {skeletonKg !== undefined ? ` · ${formatNumber(skeletonKg, 1)} kg` : ''}
        </text>
      </svg>

      <figcaption className="mt-2.5 flex flex-wrap gap-3.5 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm border-[1.5px] border-primary bg-primary-subtle" />
          Formed cavity — 2D expanded open layout
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm border-[1.5px] border-highlight bg-highlight-subtle" />
          Skeleton trim — 100 % recycled
        </span>
      </figcaption>
    </figure>
  )
}

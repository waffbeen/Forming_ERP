'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* The four figures the plant is judged on, on the screen everyone opens first.

   These are tinted rather than plain, and the tint is not decoration: it is the
   same status language the rest of the app uses, so a warm tile means something
   wants attention and a cool one means it is going to plan. Every tile carries
   its own words, so the tint is never the only thing saying which is which.

   Each one is a way in, not just a number — the whole tile is the link. */

const TINTS = {
  primary: 'bg-primary-subtle',
  info: 'bg-info-subtle',
  success: 'bg-success-subtle',
  warning: 'bg-warning-subtle',
  highlight: 'bg-highlight-subtle',
} as const

const ICON_INK = {
  primary: 'text-primary',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  highlight: 'text-highlight',
} as const

export type StatTint = keyof typeof TINTS

export function StatTile({
  href,
  tint = 'primary',
  icon: Icon,
  label,
  value,
  unit,
  foot,
}: {
  href: string
  tint?: StatTint
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  foot: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex min-w-0 flex-col rounded-2xl border border-bd-subtle p-4 transition-shadow hover:shadow-md',
        TINTS[tint],
      )}
    >
      <span className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-surface/80">
          <Icon className={cn('h-3.5 w-3.5', ICON_INK[tint])} />
        </span>
        <span className="min-w-0 truncate text-xs font-medium text-fg-muted">{label}</span>
      </span>

      <span className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-semibold tabular-nums leading-none">{value}</span>
        {unit ? <span className="text-xs text-fg-muted">{unit}</span> : null}
      </span>

      <span className="mt-2 text-xs text-fg-muted">{foot}</span>

      <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-bg-surface/80 text-fg-muted transition-transform group-hover:-translate-y-0.5 group-hover:text-fg-default">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

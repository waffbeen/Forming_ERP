import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  label: string
  value: string
  unit?: string
  note?: string
  noteTone?: 'default' | 'good' | 'warn' | 'bad'
  icon?: LucideIcon
}

const noteTones = {
  default: 'text-fg-subtle',
  good: 'text-success',
  warn: 'text-warning',
  bad: 'text-error',
}

export function StatsCard({ label, value, unit, note, noteTone = 'default', icon: Icon }: StatsCardProps) {
  return (
    <article className="flex flex-col gap-0.5 rounded-lg border border-bd-default bg-bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-fg-muted">
        {Icon ? <Icon className="h-3.5 w-3.5 text-primary" /> : null}
        {label}
      </div>
      <p className="font-mono text-2xl font-semibold leading-tight tracking-tight">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-fg-muted">{unit}</span> : null}
      </p>
      {note ? <p className={cn('text-xs', noteTones[noteTone])}>{note}</p> : null}
    </article>
  )
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
}

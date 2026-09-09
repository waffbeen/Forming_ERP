import { cn } from '@/lib/utils'

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'muted'

const tones: Record<BadgeTone, string> = {
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  error: 'bg-error-subtle text-error',
  info: 'bg-info-subtle text-info',
  primary: 'bg-primary-subtle text-primary',
  muted: 'bg-bg-subtle text-fg-muted border-bd-default',
}

export interface BadgeProps {
  tone?: BadgeTone
  dot?: boolean
  children: React.ReactNode
  className?: string
}

export function Badge({ tone = 'muted', dot = true, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border border-bd-default bg-bg-subtle px-2 py-0.5 text-xs text-fg-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

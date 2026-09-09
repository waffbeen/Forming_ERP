import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'quiet' | 'destructive'
  size?: 'sm' | 'md'
  icon?: LucideIcon
}

const variants = {
  primary: 'bg-primary text-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover',
  ghost: 'bg-bg-surface text-fg-default border-bd-default hover:bg-bg-hover',
  quiet: 'bg-transparent text-fg-muted border-transparent hover:bg-bg-hover hover:text-fg-default',
  destructive: 'bg-error text-fg-inverse border-error hover:opacity-90',
}

const sizes = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-sm gap-1.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'md', icon: Icon, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md border font-medium transition-colors',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Dropdown } from 'indas-ui'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-md border bg-bg-surface px-2.5 py-1.5 text-sm text-fg-default ' +
  'placeholder:text-fg-subtle transition-colors ' +
  'disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-fg-muted'

function stateClass(error?: string | boolean) {
  return error ? 'border-error focus:border-error' : 'border-bd-default focus:border-primary'
}

// ---------------------------------------------------------------- Field shell

export interface FieldProps {
  label?: React.ReactNode
  htmlFor?: string
  required?: boolean
  error?: string | boolean
  helper?: React.ReactNode
  /** Unit shown to the right of the label, e.g. "kg", "µm", "mm". */
  unit?: string
  children: React.ReactNode
  className?: string
}

export function Field({ label, htmlFor, required, error, helper, unit, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="flex items-baseline gap-1 text-xs font-medium text-fg-default">
          {label}
          {required ? <span className="text-error">*</span> : null}
          {unit ? <span className="ml-auto font-mono text-2xs font-normal text-fg-subtle">{unit}</span> : null}
        </label>
      ) : null}
      {children}
      {typeof error === 'string' && error ? (
        <p className="text-xs text-error">{error}</p>
      ) : helper ? (
        <p className="text-xs text-fg-subtle">{helper}</p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------- Input

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: string | boolean
  helper?: React.ReactNode
  unit?: string
  leftIcon?: LucideIcon
  /** Numeric and code fields read better in the mono face. */
  mono?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, unit, leftIcon: LeftIcon, mono, required, ...props }, ref) => {
    const generatedId = React.useId()
    const id = props.id ?? generatedId

    const field = (
      <div className="relative">
        {LeftIcon ? (
          <LeftIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
        ) : null}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldBase,
            stateClass(error),
            LeftIcon && 'pl-8',
            (mono || props.type === 'number') && 'font-mono',
            className,
          )}
          {...props}
        />
      </div>
    )

    if (!label && !helper && !error) return field

    return (
      <Field label={label} htmlFor={id} required={required} error={error} helper={helper} unit={unit}>
        {field}
      </Field>
    )
  },
)
Input.displayName = 'Input'

// --------------------------------------------------------------------- Select

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label?: React.ReactNode
  error?: string | boolean
  helper?: React.ReactNode
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
  id?: string
}

/**
 * Renders indas-ui's Dropdown, which brings search, clear and keyboard
 * handling. The onChange signature is kept event-shaped so callers read the
 * same as any other field in a form.
 */
export function Select({
  className,
  label,
  error,
  helper,
  options,
  placeholder,
  required,
  disabled,
  value,
  onChange,
  id,
}: SelectProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId

  return (
    <Field label={label} htmlFor={fieldId} required={required} error={error} helper={helper}>
      <Dropdown
        id={fieldId}
        options={options}
        value={value === undefined ? undefined : String(value)}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        className={className}
        aria-label={typeof label === 'string' ? label : undefined}
        // Search only earns its keep once the list is long enough to scan.
        searchable={options.length > 8}
        clearable={!required}
        emptyMessage="Nothing matches"
        preserveOrder
        onValueChange={(next) =>
          onChange?.({
            target: { value: Array.isArray(next) ? (next[0] ?? '') : String(next ?? '') },
          } as React.ChangeEvent<HTMLSelectElement>)
        }
      />
    </Field>
  )
}

// ------------------------------------------------------------------- Textarea

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode
  error?: string | boolean
  helper?: React.ReactNode
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, required, rows = 3, ...props }, ref) => {
    const generatedId = React.useId()
    const id = props.id ?? generatedId

    return (
      <Field label={label} htmlFor={id} required={required} error={error} helper={helper}>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={cn(fieldBase, stateClass(error), 'resize-y', className)}
          {...props}
        />
      </Field>
    )
  },
)
Textarea.displayName = 'Textarea'

// ------------------------------------------------------------------- Checkbox

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode
  hint?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, ...props }, ref) => {
    const generatedId = React.useId()
    const id = props.id ?? generatedId

    return (
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-start gap-2.5 rounded-md border border-bd-default px-3 py-2 hover:bg-bg-hover',
          className,
        )}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--color-primary))]"
          {...props}
        />
        <span className="text-sm font-medium">
          {label}
          {hint ? <span className="block text-xs font-normal text-fg-muted">{hint}</span> : null}
        </span>
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'

// ----------------------------------------------------------------- Form shell

/** A titled block of fields inside a modal body. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('mb-5 last:mb-0', className)}>
      <div className="mb-2.5 border-b border-bd-subtle pb-1.5">
        <h4 className="label-caps">{title}</h4>
        {description ? <p className="mt-0.5 text-xs text-fg-subtle">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

/** Responsive field grid. Children can span with `className="sm:col-span-2"`. */
export function FormGrid({
  cols = 2,
  children,
  className,
}: {
  cols?: 1 | 2 | 3 | 4
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        // Four across suits a line-item row, where the fields are narrow.
        cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Read-only value derived by the system, never typed in by the user. */
export function DerivedField({
  label,
  value,
  unit,
  emphasis,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  emphasis?: boolean
}) {
  return (
    <Field label={label} unit={unit}>
      <output
        className={cn(
          'block rounded-md border border-dashed border-bd-strong bg-bg-subtle px-2.5 py-1.5 font-mono text-sm',
          emphasis ? 'font-semibold text-primary' : 'text-fg-default',
        )}
      >
        {value}
      </output>
    </Field>
  )
}

'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Dropdown } from 'indas-ui'
import { Field } from './form'
import type { SelectOption } from './form'

export interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called by the modal on save, with the record it created. */
  onCreated: (option: SelectOption) => void
  /** Whatever the user had typed into the dropdown before opening the modal. */
  initialName?: string
}

export interface SelectWithCreateProps {
  label?: React.ReactNode
  error?: string | boolean
  helper?: React.ReactNode
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  value?: string
  onChange?: (value: string) => void
  id?: string
  /** Tooltip on the add button, e.g. "New item". */
  createLabel: string
  /** The master's own create modal, rendered only while it is open. */
  renderCreateModal: (props: CreateModalProps) => React.ReactNode
}

/**
 * A dropdown that can create the thing it is selecting.
 *
 * If the record does not exist yet, the user adds it without losing the form
 * they are part-way through: the master's own create modal opens over the top,
 * and the new record comes back selected. Anything added this way is held for
 * the life of the form, since there is no API behind the masters yet.
 */
export function SelectWithCreate({
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
  createLabel,
  renderCreateModal,
}: SelectWithCreateProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId

  const [added, setAdded] = React.useState<SelectOption[]>([])
  const [modalOpen, setModalOpen] = React.useState(false)
  const [typedName, setTypedName] = React.useState('')

  const allOptions = React.useMemo(() => [...added, ...options], [added, options])

  const accept = (option: SelectOption) => {
    setAdded((prev) => (prev.some((o) => o.value === option.value) ? prev : [option, ...prev]))
    onChange?.(option.value)
    setModalOpen(false)
    setTypedName('')
  }

  return (
    <>
      <Field label={label} htmlFor={fieldId} required={required} error={error} helper={helper}>
        <Dropdown
          id={fieldId}
          options={allOptions}
          value={value === undefined || value === '' ? undefined : value}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          aria-label={typeof label === 'string' ? label : undefined}
          searchable
          clearable={!required}
          emptyMessage="Nothing matches"
          preserveOrder
          createOptionLabel={createLabel}
          // Typing a name that matches nothing offers to create it.
          onCreateOption={(input) => {
            setTypedName(input)
            setModalOpen(true)
            // The real record comes back from the modal; this keeps the
            // dropdown quiet until it does.
            return { value: '', label: input }
          }}
          trailingAction={
            <button
              type="button"
              onClick={() => {
                setTypedName('')
                setModalOpen(true)
              }}
              title={createLabel}
              aria-label={createLabel}
              className="grid h-5 w-5 place-items-center rounded text-fg-muted transition-colors hover:bg-primary-subtle hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          }
          onValueChange={(next) => {
            const picked = Array.isArray(next) ? (next[0] ?? '') : String(next ?? '')
            // Ignore the placeholder row onCreateOption returns.
            if (picked !== '') onChange?.(picked)
          }}
        />
      </Field>

      {modalOpen
        ? renderCreateModal({
            isOpen: modalOpen,
            onClose: () => setModalOpen(false),
            onCreated: accept,
            initialName: typedName,
          })
        : null}
    </>
  )
}

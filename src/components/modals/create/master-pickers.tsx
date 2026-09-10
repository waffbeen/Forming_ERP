'use client'

import * as React from 'react'
import { SelectWithCreate } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import {
  ArtworkModal, CustomerModal, DieModal, MachineModal, MaterialModal, OperatorModal, ReelModal,
} from './master-modals'
import { CategoryModal, ItemModal, ProcessModal, ProductModal, SupplierModal } from './business-modals'
import { BinModal, EmployeeModal, UserModal } from './system-modals'

/* ============================================================
   Master pickers.

   Every field that chooses a master record can also create one. A
   record missing from a list is the commonest reason a form gets
   abandoned half-filled, so the add button opens that master's own
   create screen over the top and hands the new record straight back
   to the field that asked for it.

   Each picker is a thin binding of a dropdown to a master's create
   modal. They live in one file so a field cannot quietly be wired to
   the wrong screen, and so a master added later gets its picker in
   one place rather than in every form that needs it.
   ============================================================ */

/** What a picker takes, on top of the master it is bound to. */
export interface PickerProps {
  label?: React.ReactNode
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  helper?: React.ReactNode
  error?: string | boolean
  id?: string
}

/** Binds a dropdown to one master's create screen. */
function picker(createLabel: string, Modal: React.ComponentType<{
  isOpen: boolean
  onClose: () => void
  onCreated?: (option: SelectOption) => void
  initialName?: string
}>) {
  return function MasterPicker(props: PickerProps) {
    return (
      <SelectWithCreate
        {...props}
        createLabel={createLabel}
        renderCreateModal={(modalProps) => <Modal {...modalProps} />}
      />
    )
  }
}

export const CustomerPicker = picker('New client', CustomerModal)
export const SupplierPicker = picker('New supplier', SupplierModal)
export const ArtworkPicker = picker('New artwork', ArtworkModal)
export const MaterialPicker = picker('New material grade', MaterialModal)
export const MachinePicker = picker('New machine', MachineModal)
export const DiePicker = picker('New die', DieModal)
export const ReelPicker = picker('New reel', ReelModal)
export const ItemPicker = picker('New item', ItemModal)
export const CategoryPicker = picker('New category', CategoryModal)
export const ProductPicker = picker('New product', ProductModal)
export const ProcessPicker = picker('New process', ProcessModal)
export const BinPicker = picker('New bin', BinModal)
export const UserPicker = picker('New user', UserModal)
export const EmployeePicker = picker('New employee', EmployeeModal)
export const OperatorPicker = picker('New operator', OperatorModal)

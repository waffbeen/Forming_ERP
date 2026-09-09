'use client'

import { StandardModal } from './standard-modal'
import type { ModalSize } from './standard-modal'
import type { BadgeTone } from '@/components/ui'

export interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: { label: string; tone?: BadgeTone }
  size?: ModalSize
  children: React.ReactNode
}

/**
 * Read-only counterpart to StandardModal, opened by clicking a grid row.
 *
 * Detail used to sit in a panel beside every grid, which cost the grid half its
 * width on every screen. Putting it behind a row click gives the grid the full
 * page and shows the detail only when somebody asks for it.
 */
export function DetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  size = 'lg',
  children,
}: DetailModalProps) {
  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badge={badge}
      size={size}
      cancelLabel="Close"
    >
      {children}
    </StandardModal>
  )
}

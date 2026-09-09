'use client'

import * as React from 'react'
import { Save, XCircle, type LucideIcon } from 'lucide-react'
import { StandardModal as IndasStandardModal } from 'indas-ui/modals'
import { Button } from 'indas-ui'
import type { BadgeTone } from '@/components/ui'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'master'

export interface StandardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: { label: string; tone?: BadgeTone }
  size?: ModalSize
  children: React.ReactNode

  onSave?: () => void
  saveLabel?: string
  cancelLabel?: string
  saveIcon?: LucideIcon
  saving?: boolean
  saveDisabled?: boolean
  /** Extra content on the left of the footer, e.g. a running total. */
  footerNote?: React.ReactNode
  /** Rendered before Cancel, for step navigation and the like. */
  footerActions?: React.ReactNode
  showFooter?: boolean
}

/** This app's sizes onto the library's. */
const SIZES: Record<ModalSize, 'sm' | 'md' | 'lg' | 'xl' | 'full'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  master: 'full',
}

/** Semantic tone onto the library Badge's visual variants. */
const BADGE_VARIANTS: Record<BadgeTone, 'default' | 'outline' | 'secondary' | 'destructive'> = {
  primary: 'default',
  success: 'default',
  info: 'secondary',
  warning: 'secondary',
  error: 'destructive',
  muted: 'outline',
}

/**
 * Wraps indas-ui's StandardModal so every create screen in this app keeps one
 * API. The library's own footer has no disabled state and no room for a note,
 * so the footer actions are supplied here instead.
 */
export function StandardModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  size = 'lg',
  children,
  onSave,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  saveIcon = Save,
  saving = false,
  saveDisabled = false,
  footerNote,
  footerActions,
  showFooter = true,
}: StandardModalProps) {
  const footer = (
    <>
      {footerNote ? <div className="mr-auto text-xs text-fg-muted">{footerNote}</div> : null}
      {footerActions}
      <Button variant="outline" icon={XCircle} onClick={onClose} disabled={saving}>
        {cancelLabel}
      </Button>
      {onSave ? (
        <Button variant="primary" icon={saveIcon} onClick={onSave} disabled={saving || saveDisabled}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
      ) : null}
    </>
  )

  return (
    <IndasStandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badge={badge ? { label: badge.label, variant: BADGE_VARIANTS[badge.tone ?? 'primary'] } : undefined}
      size={SIZES[size]}
      showFooter={showFooter}
      footerActions={footer}
      ariaDescription={subtitle}
    >
      {children}
    </IndasStandardModal>
  )
}

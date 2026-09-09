import { Badge, type BadgeTone } from '@/components/ui'
import type { OrderStatus, QcStatus } from '@/types'
import { titleCase } from './utils'

const ORDER_TONES: Record<OrderStatus, BadgeTone> = {
  PLANNED: 'muted',
  AWAITING_ARTWORK: 'warning',
  READY_TO_RELEASE: 'success',
  IN_PRODUCTION: 'info',
  DISPATCHED: 'primary',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONES[status]}>{titleCase(status)}</Badge>
}

const QC_TONES: Record<QcStatus, BadgeTone> = {
  APPROVED: 'success',
  QUARANTINE: 'warning',
  REJECTED: 'error',
}

export function QcStatusBadge({ status }: { status: QcStatus }) {
  return <Badge tone={QC_TONES[status]}>{titleCase(status)}</Badge>
}

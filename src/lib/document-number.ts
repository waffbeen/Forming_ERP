import { DOCUMENT_PREFIXES } from '@/data/masters-extended'
import type { DocumentKind } from '@/types/masters'

/* Document numbers.

   Nothing in this plant is numbered by hand. Every document that leaves a
   screen — a requisition, an order, a receipt, an issue, an inspection — takes
   its number from the prefix master: the prefix, the period, and the next in
   the series, padded to a fixed width so a sorted list reads in order.

   Thomson does the same and for the same reason: a number typed by a person is
   a number that collides, repeats, or skips, and every one of those is an audit
   finding. The master is the single place the format is decided, so changing a
   prefix there changes it on every screen at once.

   The running number is read off the documents that already exist rather than
   stored, so a demo cannot drift out of step with its own data. A live system
   would take it from the master's own counter under a lock. */

/** The period segment, as the documents in this plant already carry it: YYMM. */
function periodOf(date: Date) {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${yy}${mm}`
}

export interface DocumentNumberOptions {
  /** Numbers already issued in this series, to continue rather than collide. */
  existing?: string[]
  /** The date the document is being raised on. */
  on?: Date
}

/**
 * The next number in a series.
 *
 * Returns null when nothing is configured for the document, which is a real
 * answer: it means somebody has to set the prefix up before the screen can
 * issue one, and a screen that made one up anyway would hide that.
 */
export function nextDocumentNumber(
  kind: DocumentKind,
  { existing = [], on = new Date() }: DocumentNumberOptions = {},
): string | null {
  const rule = DOCUMENT_PREFIXES.find((p) => p.documentKind === kind && p.status === 'ACTIVE')
  if (!rule) return null

  const period = periodOf(on)
  const head = `${rule.prefix}${rule.separator}${period}${rule.separator}`

  /* Continue the series that is actually on the documents. A number already
     issued this period beats the master's counter, which a demo cannot keep. */
  const used = existing
    .filter((n) => n.startsWith(head))
    .map((n) => Number(n.slice(head.length)))
    .filter((n) => Number.isFinite(n))

  const next = Math.max(rule.currentNumber, ...used, 0) + 1
  return `${head}${String(next).padStart(rule.padding, '0')}`
}

/** What a screen shows before the document exists, when nothing is configured. */
export const NO_SERIES = 'No prefix configured'

/**
 * The number a screen displays while the document is being filled in. It is the
 * number the document will take, not a promise of one — which is why the field
 * is derived rather than typed.
 */
export function previewNumber(kind: DocumentKind, existing: string[] = []) {
  return nextDocumentNumber(kind, { existing }) ?? NO_SERIES
}

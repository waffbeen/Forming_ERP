/* ============================================================
   Runs left open.

   A run is worked over a shift, not filled in one sitting. The line is
   cleared in the morning, the first piece goes to QC, the machine runs
   for hours, and the quantities are only known at the end. An operator
   who closes the screen in between has not abandoned the job, so the
   part-worked record is kept and reopened where it was left rather than
   thrown away and keyed in again from the paper.

   This is browser-local: the draft lives on the machine it was entered
   on, which is how a shop-floor terminal is used anyway. Posting the run
   clears it.
   ============================================================ */

import type { RunSection } from '@/types/run-record'

export interface RunDraft {
  section: RunSection
  jobCardNo: string
  /** The step the operator was on when they closed the screen. */
  step: number
  savedAt: string
  /** Every field on the form, as the modal holds them. */
  values: Record<string, unknown>
}

const KEY = 'forming-erp:run-drafts:v1'

/* Storage can be unavailable or full, and a half-written run is never worth
   an exception on the shop floor, so every access fails quietly. */
function readAll(): RunDraft[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as RunDraft[]) : []
  } catch {
    return []
  }
}

function writeAll(drafts: RunDraft[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(drafts))
  } catch {
    /* Nothing useful to do: the run stays in the form the operator is looking at. */
  }
}

/** Open runs for one section, most recently worked first. */
export function listDrafts(section: RunSection): RunDraft[] {
  return readAll()
    .filter((d) => d.section === section)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export function loadDraft(section: RunSection, jobCardNo: string): RunDraft | null {
  return readAll().find((d) => d.section === section && d.jobCardNo === jobCardNo) ?? null
}

/** One open run per job card per section, so reopening cannot fork it. */
export function saveDraft(draft: Omit<RunDraft, 'savedAt'>): RunDraft {
  const saved: RunDraft = { ...draft, savedAt: new Date().toISOString() }
  const rest = readAll().filter(
    (d) => !(d.section === saved.section && d.jobCardNo === saved.jobCardNo),
  )
  writeAll([...rest, saved])
  return saved
}

export function discardDraft(section: RunSection, jobCardNo: string) {
  writeAll(readAll().filter((d) => !(d.section === section && d.jobCardNo === jobCardNo)))
}

/** How long a run has been sitting open, in words an operator would use. */
export function savedAgo(savedAt: string, from: Date = new Date()) {
  const minutes = Math.max(Math.round((from.getTime() - new Date(savedAt).getTime()) / 60000), 0)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

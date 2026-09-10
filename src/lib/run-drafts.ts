/* ============================================================
   Runs left open.

   A run is worked over a shift, not filled in one sitting. The line is
   cleared in the morning, the first piece goes to QC, the machine runs
   for hours, and the quantities are only known at the end. An operator
   who closes the screen in between has not abandoned the job, so the
   part-worked record is kept and reopened where it was left rather than
   thrown away and keyed in again from the paper.

   A run is identified by the job card AND the machine, because the same
   job is regularly split across two presses and each machine keeps its
   own record: two machines running means two open runs, not one that
   overwrites the other.

   This is browser-local: the draft lives on the machine it was entered
   on, which is how a shop-floor terminal is used anyway. Posting the run
   clears it, and discarding one hands it back so it can be put straight
   back if the operator did not mean it.
   ============================================================ */

import type { RunSection } from '@/types/run-record'

export interface RunDraft {
  section: RunSection
  jobCardNo: string
  /** The press or forming line this run is on. */
  machineCode: string
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
    if (!Array.isArray(parsed)) return []
    /* Runs saved before a machine was recorded against them still open: they
       read as belonging to no machine rather than being thrown away. */
    return (parsed as RunDraft[]).map((d) => ({ ...d, machineCode: d.machineCode ?? '' }))
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

const sameRun = (d: RunDraft, section: RunSection, jobCardNo: string, machineCode: string) =>
  d.section === section && d.jobCardNo === jobCardNo && d.machineCode === machineCode

/** Open runs for one section, most recently worked first. */
export function listDrafts(section: RunSection): RunDraft[] {
  return readAll()
    .filter((d) => d.section === section)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export function loadDraft(section: RunSection, jobCardNo: string, machineCode: string): RunDraft | null {
  return readAll().find((d) => sameRun(d, section, jobCardNo, machineCode)) ?? null
}

/** Every machine this job card is already open on, in this section. */
export function draftsForJob(section: RunSection, jobCardNo: string): RunDraft[] {
  return listDrafts(section).filter((d) => d.jobCardNo === jobCardNo)
}

/**
 * One open run per job card per machine, so reopening cannot fork it and a
 * second press cannot overwrite the first one's record.
 */
export function saveDraft(draft: Omit<RunDraft, 'savedAt'>): RunDraft {
  const saved: RunDraft = { ...draft, savedAt: new Date().toISOString() }
  const rest = readAll().filter(
    (d) => !sameRun(d, saved.section, saved.jobCardNo, saved.machineCode),
  )
  writeAll([...rest, saved])
  return saved
}

/**
 * Removes an open run and hands it back, so a discard can be undone. Nothing
 * on the floor should be one mis-tap away from a shift's work disappearing.
 */
export function discardDraft(
  section: RunSection,
  jobCardNo: string,
  machineCode: string,
): RunDraft | null {
  const all = readAll()
  const removed = all.find((d) => sameRun(d, section, jobCardNo, machineCode)) ?? null
  writeAll(all.filter((d) => !sameRun(d, section, jobCardNo, machineCode)))
  return removed
}

/** Puts a discarded run back exactly as it was, timestamp included. */
export function restoreDraft(draft: RunDraft) {
  const rest = readAll().filter(
    (d) => !sameRun(d, draft.section, draft.jobCardNo, draft.machineCode),
  )
  writeAll([...rest, draft])
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

import type {
  JobClosure, ProductionEntry, ProductionWorkOrder, ScheduleSlot, WorkflowStage,
} from '@/types/production'
import { JOB_CARDS, FORMING_LOGS, PUNCHING_LOGS } from './transactions'
import { PROCESSES } from './masters-extended'

const BY = 'Pooja Gupta'

/* A job card yields one work order per machine-bound process step: forming
   first, then punching. Everything after this point works on work orders, not
   on the job card, which is what lets the two steps sit on different machines
   in different shifts. */
const MACHINE_PROCESSES = PROCESSES.filter((p) => p.machineType !== 'NONE').sort(
  (a, b) => a.sequenceNo - b.sequenceNo,
)

/** How far each job has actually got, used to place its work orders. */
const STAGE_BY_JOB: Record<string, { forming: WorkflowStage; punching: WorkflowStage }> = {
  'JC-2609-124': { forming: 'COMPLETED', punching: 'IN_PRODUCTION' },
  'JC-2609-123': { forming: 'IN_PRODUCTION', punching: 'SCHEDULED' },
  'JC-2609-121': { forming: 'CLOSED', punching: 'CLOSED' },
  'JC-2609-118': { forming: 'SCHEDULED', punching: 'RELEASED_FOR_SCHEDULE' },
  'JC-2609-116': { forming: 'RELEASED_FOR_SCHEDULE', punching: 'CREATED' },
  'JC-2609-112': { forming: 'COMPLETED', punching: 'IN_PRODUCTION' },
}

const PRIORITY_BY_JOB: Record<string, ProductionWorkOrder['priority']> = {
  'JC-2609-124': 'URGENT',
  'JC-2609-118': 'CRITICAL',
}

let pwoSeq = 200

export const WORK_ORDERS: ProductionWorkOrder[] = JOB_CARDS.flatMap((job) =>
  MACHINE_PROCESSES.map((process) => {
    const isForming = process.machineType === 'FORMING'
    const stage = STAGE_BY_JOB[job.jobCardNo]?.[isForming ? 'forming' : 'punching'] ?? 'CREATED'
    const released = stage !== 'CREATED'

    // Forming is measured in sheets, punching in the pieces it cuts out.
    const targetQty = isForming ? job.requiredSheetsQty : job.targetPiecesQty
    const produced = isForming
      ? (FORMING_LOGS.find((f) => f.jobCardNo === job.jobCardNo)?.outputFormedSheets ?? 0)
      : (PUNCHING_LOGS.find((p) => p.jobCardNo === job.jobCardNo)?.goodPiecesOutput ?? 0)

    pwoSeq += 1

    return {
      pwoId: `W${pwoSeq}`,
      pwoNumber: `PWO-2609-${String(pwoSeq).padStart(4, '0')}`,
      pwoDate: '2026-09-06',
      jobCardNo: job.jobCardNo,
      soNumber: job.soNumber,
      customerName: job.customerName,
      artworkCode: job.artworkCode,
      processCode: process.processCode,
      processName: process.processName,
      sequenceNo: process.sequenceNo,
      targetQty,
      producedQty: produced,
      unit: process.endUnit,
      machineType: process.machineType,
      priority: PRIORITY_BY_JOB[job.jobCardNo] ?? 'NORMAL',
      deliveryDate: '2026-09-18',
      workflowStage: stage,
      isReleasedForSchedule: released,
      releasedOn: released ? '2026-09-07' : null,
      releasedByUserId: released ? 'U12' : null,
      status: 'ACTIVE',
      createdBy: BY,
      createdDate: '2026-09-06',
    }
  }),
)

// -------------------------------------------------------------- Scheduling

/** Only released work orders reach the schedule, and only once. */
const SCHEDULABLE = WORK_ORDERS.filter(
  (w) => w.isReleasedForSchedule && w.workflowStage !== 'RELEASED_FOR_SCHEDULE',
)

/** Work orders queue per machine and shift, in the order they will run. */
const seqByQueue = new Map<string, number>()

export const SCHEDULE_SLOTS: ScheduleSlot[] = SCHEDULABLE.map((wo, i) => {
  const job = JOB_CARDS.find((j) => j.jobCardNo === wo.jobCardNo)
  const machineCode =
    wo.machineType === 'FORMING' ? (job?.formingMachineCode ?? 'TF-01') : (job?.punchingMachineCode ?? 'PN-01')
  const scheduledDate = ['2026-09-08', '2026-09-09', '2026-09-10'][i % 3]
  const shift: ScheduleSlot['shift'] = i % 2 === 0 ? 'A' : 'B'

  const queue = `${machineCode}|${scheduledDate}|${shift}`
  const sequenceNo = (seqByQueue.get(queue) ?? 0) + 1
  seqByQueue.set(queue, sequenceNo)

  const process = PROCESSES.find((p) => p.processCode === wo.processCode)

  return {
    slotId: `SL${i + 1}`,
    pwoNumber: wo.pwoNumber,
    jobCardNo: wo.jobCardNo,
    machineCode,
    scheduledDate,
    shift,
    sequenceNo,
    plannedQty: wo.targetQty,
    plannedMinutes: process?.standardTimeMins ?? 120,
    startedAt: wo.workflowStage === 'SCHEDULED' ? null : `${scheduledDate} 07:30`,
    completedAt:
      wo.workflowStage === 'COMPLETED' || wo.workflowStage === 'CLOSED'
        ? `${scheduledDate} 15:10`
        : null,
    scheduledByUserId: 'U12',
    status: 'ACTIVE',
    createdBy: BY,
    createdDate: '2026-09-07',
  }
})

// ---------------------------------------------------------- Production entry

/** Work orders that have actually run produce an entry for the shift. */
export const PRODUCTION_ENTRIES: ProductionEntry[] = WORK_ORDERS.filter(
  (w) => w.producedQty > 0,
).map((wo, i) => {
  const slot = SCHEDULE_SLOTS.find((s) => s.pwoNumber === wo.pwoNumber)
  const rejected =
    wo.machineType === 'PUNCHING'
      ? (PUNCHING_LOGS.find((p) => p.jobCardNo === wo.jobCardNo)?.rejectedPiecesQty ?? 0)
      : 0
  const process = PROCESSES.find((p) => p.processCode === wo.processCode)
  const planned = process?.standardTimeMins ?? 120
  const downtime = i % 3 === 0 ? 25 : 0

  return {
    entryId: `PE${i + 1}`,
    entryDate: slot?.scheduledDate ?? '2026-09-09',
    pwoNumber: wo.pwoNumber,
    jobCardNo: wo.jobCardNo,
    processCode: wo.processCode,
    machineCode: slot?.machineCode ?? '—',
    shift: slot?.shift ?? 'A',
    operatorEmployeeId: wo.machineType === 'FORMING' ? 'E06' : 'E08',
    producedQty: wo.producedQty,
    rejectedQty: rejected,
    runMinutes: planned + downtime,
    downtimeMinutes: downtime,
    downtimeReason: downtime ? 'Heater zone reset after a profile drift' : '',
    status:
      wo.workflowStage === 'COMPLETED' || wo.workflowStage === 'CLOSED' ? 'COMPLETED' : 'RUNNING',
  }
})

// ---------------------------------------------------------------- Job close

export const JOB_CLOSURES: JobClosure[] = [
  {
    closureId: 'JCL1',
    jobCardNo: 'JC-2609-121',
    closedOn: '2026-09-09',
    closedByUserId: 'U02',
    reason: 'COMPLETED',
    orderedQty: 90000,
    producedQty: PUNCHING_LOGS.find((p) => p.jobCardNo === 'JC-2609-121')?.goodPiecesOutput ?? 0,
    shortfallQty: 0,
    remarks: 'Dispatched in full against SO-2609-029',
    status: 'ACTIVE',
    createdBy: 'Yuvraj Bhaigude',
    createdDate: '2026-09-09',
  },
]

// ------------------------------------------------------------------ Helpers

/** Remaining quantity on a work order, never below zero. */
export function remainingQty(wo: ProductionWorkOrder) {
  return Math.max(wo.targetQty - wo.producedQty, 0)
}

/** Share of the target a work order has produced, 0-1. */
export function completionOf(wo: ProductionWorkOrder) {
  return wo.targetQty > 0 ? Math.min(wo.producedQty / wo.targetQty, 1) : 0
}

/** Work orders waiting for the planner to release them to scheduling. */
export function awaitingRelease() {
  return WORK_ORDERS.filter((w) => !w.isReleasedForSchedule)
}

/** Released work orders that have not been given a machine slot yet. */
export function awaitingSchedule() {
  return WORK_ORDERS.filter(
    (w) => w.isReleasedForSchedule && !SCHEDULE_SLOTS.some((s) => s.pwoNumber === w.pwoNumber),
  )
}

/** Jobs whose every work order is finished but which nobody has closed. */
export function readyToClose() {
  const closed = new Set(JOB_CLOSURES.map((c) => c.jobCardNo))
  return JOB_CARDS.filter((job) => {
    if (closed.has(job.jobCardNo)) return false
    const orders = WORK_ORDERS.filter((w) => w.jobCardNo === job.jobCardNo)
    return orders.length > 0 && orders.every((w) => w.workflowStage === 'COMPLETED')
  })
}

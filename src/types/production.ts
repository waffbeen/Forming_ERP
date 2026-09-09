/* Production chain, following the Indas Estimo sequence.

   A job card does not go straight to a machine. It becomes a work order per
   process step, the work order is released for scheduling, scheduling puts it
   on a machine in a shift, the floor logs entries against it, and the job is
   closed once every step is accounted for. */

import type { MasterBase } from './masters'

// ------------------------------------------------------------- Work order

/**
 * Where a work order sits in the chain. It only moves forward, and each move
 * is what the next screen filters on.
 */
export type WorkflowStage =
  | 'CREATED'
  | 'RELEASED_FOR_SCHEDULE'
  | 'SCHEDULED'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'CLOSED'

export type WorkOrderPriority = 'NORMAL' | 'URGENT' | 'CRITICAL'

export interface ProductionWorkOrder extends MasterBase {
  pwoId: string
  pwoNumber: string
  pwoDate: string
  jobCardNo: string
  soNumber: string
  customerName: string
  artworkCode: string
  /** The process master step this work order covers. */
  processCode: string
  processName: string
  /** Sequence within the job, so forming always precedes cutting. */
  sequenceNo: number
  /** What this step has to produce, in the process's own end unit. */
  targetQty: number
  producedQty: number
  unit: 'KG' | 'SHEET' | 'PIECE' | 'BOX'
  machineType: 'FORMING' | 'CUTTING' | 'NONE'
  priority: WorkOrderPriority
  deliveryDate: string
  workflowStage: WorkflowStage
  /** Set when the planner releases it; scheduling only sees released orders. */
  isReleasedForSchedule: boolean
  releasedOn: string | null
  releasedByUserId: string | null
}

// -------------------------------------------------------------- Scheduling

export type ShiftCode = 'A' | 'B' | 'GENERAL'

/**
 * One work order placed on one machine, in one shift, at a position in that
 * machine's queue. Sequence is per machine and per date, so two orders cannot
 * hold the same slot.
 */
export interface ScheduleSlot extends MasterBase {
  slotId: string
  pwoNumber: string
  jobCardNo: string
  machineCode: string
  scheduledDate: string
  shift: ShiftCode
  /** Position in that machine's queue for the shift, starting at 1. */
  sequenceNo: number
  plannedQty: number
  /** Estimated run time from the process master's standard time. */
  plannedMinutes: number
  startedAt: string | null
  completedAt: string | null
  scheduledByUserId: string
}

// ---------------------------------------------------------- Production entry

export type EntryStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED'

/**
 * A shift's output against one work order. Forming and cutting keep their own
 * detailed screens; this is the common ledger that rolls their output up to the
 * work order so remaining quantity is answerable in one place.
 */
export interface ProductionEntry {
  entryId: string
  entryDate: string
  pwoNumber: string
  jobCardNo: string
  processCode: string
  machineCode: string
  shift: ShiftCode
  operatorEmployeeId: string
  /** Good output this entry, in the work order's unit. */
  producedQty: number
  rejectedQty: number
  /** Minutes the machine actually ran, against the plan. */
  runMinutes: number
  downtimeMinutes: number
  downtimeReason: string
  status: EntryStatus
}

// ---------------------------------------------------------------- Job close

export type CloseReason = 'COMPLETED' | 'SHORT_CLOSED' | 'CANCELLED'

/**
 * Closing a job seals it. Nothing can be logged against a closed job, which is
 * what stops a finished run quietly accumulating more output.
 */
export interface JobClosure extends MasterBase {
  closureId: string
  jobCardNo: string
  closedOn: string
  closedByUserId: string
  reason: CloseReason
  orderedQty: number
  producedQty: number
  /** Positive when the plant produced less than the order asked for. */
  shortfallQty: number
  remarks: string
}

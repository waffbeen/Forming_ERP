/* The shop-floor run record, field for field from the client's own formats.

   A run is worked in order and each stage gates the next: line clearance is
   signed before the first piece is made, the first piece is approved before
   the job starts, and the job cannot be ended until it has started. That
   sequence is the point of the paper record, so it is the shape of this one.

   Forming  DP/PR/F-03 production record, DP/QC/F-01 quality checklist
   Cutting DP/PR/F-04 production record, DP/QC/F-02 quality checklist */

export type RunSection = 'FORMING' | 'CUTTING'

export type RunStage =
  | 'JOB_DETAILS'
  | 'LINE_CLEARANCE'
  | 'FIRST_PIECE'
  | 'JOB_START'
  | 'IN_PROCESS'
  | 'JOB_END'

/** Every quality parameter reads one of these on a check. */
export type ParameterResult = 'OK' | 'DEFECT' | 'NOT_CHECKED'

// ------------------------------------------------------------ Job details

export interface RunJobDetails {
  date: string
  shift: 'A' | 'B'
  jobCardNo: string
  jobName: string
  clientName: string
  poNumber: string
  /** Forming only: the die on the bed and the roll being run. */
  dieNo?: string
  vendorName?: string
  vendorRollNo?: string
  rollSizeMm?: number
  micron?: number
  materialType?: string
  colour?: string
  /** Cutting only. */
  remark1?: string
  remark2?: string
}

// --------------------------------------------------------- Line clearance

/**
 * Six named areas are physically checked before a job may start, and both the
 * machine operator and the production/QC supervisor sign against the same
 * declaration. One signature is not enough.
 */
export interface RunLineClearance {
  previousJobCardNo: string
  previousJobName: string
  productCode: string
  operation: string
  /** Keyed by the area name, from LINE_CLEARANCE_AREAS. */
  areasChecked: Record<string, boolean>
  operatorName: string
  operatorSignedAt: string | null
  supervisorName: string
  supervisorSignedAt: string | null
}

// ------------------------------------------------------ First piece approval

/**
 * The operator produces the first piece and the QC executive verifies it
 * against every parameter for the section. Required again after any power
 * failure, per revision 01 of both SOPs.
 */
export interface RunFirstPiece {
  /** Keyed by parameter name, from FORMING_DEFECTS or CUTTING_DEFECTS. */
  results: Record<string, ParameterResult>
  producedByOperator: string
  verifiedByQc: string
  approvedAt: string | null
  /** Set when this FPA follows a power interruption rather than a job start. */
  afterPowerFailure: boolean
  remarks: string
}

// ---------------------------------------------------------- In-process check

/** One hourly check across the section's parameters. */
export interface RunInProcessCheck {
  checkNo: number
  time: string
  inspector: string
  results: Record<string, ParameterResult>
}

// ------------------------------------------------------------------ Output

/** Forming record DP/PR/F-03: times, sheet counts and the heater profile. */
export interface FormingRunOutput {
  dieMountingStart: string
  dieMountingEnd: string
  machineHeatingMinutes: number
  machineStartTime: string
  machineStopTime: string
  jobEndTime: string
  cavities: number
  orderQtySheets: number
  formedQtySheets: number
  /** Sheets scrapped bringing the profile up to temperature. */
  makeReadyWastageSheets: number
  wastageQtySheets: number
  /** Formed sheets multiplied by the cavities on the die. */
  totalQtyNumbers: number
  /** One reading per heater zone on the tunnel. */
  zoneTemperatures: number[]
}

/**
 * Cutting record DP/PR/F-04. Sorting is part of this record, not a step of
 * its own: the press output is sorted, rejects come off, and what is left is
 * the finished goods quantity that gets bagged and boxed.
 */
export interface CuttingRunOutput {
  machineStartTime: string
  machineEndTime: string
  formedQty: number
  cutQty: number
  wasteSheetGrams: number
  wasteNos: number
  perPieceWeightG: number
  rejectionQtyAfterSorting: number
  finalFgQty: number
  perBagQty: number
  perBoxQty: number
  totalBoxes: number
}

// --------------------------------------------------------------- Run record

export interface RunRecord {
  runId: string
  section: RunSection
  documentNo: string
  stage: RunStage
  jobDetails: RunJobDetails
  lineClearance: RunLineClearance
  firstPiece: RunFirstPiece
  /** Every go at the first piece, in order; the last one is the live state. */
  firstPieceAttempts: RunFirstPieceAttempt[]
  checks: RunInProcessCheck[]
  formingOutput?: FormingRunOutput
  cuttingOutput?: CuttingRunOutput
  operatorSignedAt: string | null
  supervisorSignedAt: string | null
}

// ----------------------------------------------------------------- Gating

/** Line clearance passes only with all six areas ticked and both signatures. */
export function lineClearanceComplete(lc: RunLineClearance, areas: readonly string[]) {
  return (
    areas.every((a) => lc.areasChecked[a]) &&
    Boolean(lc.operatorSignedAt) &&
    Boolean(lc.supervisorSignedAt)
  )
}

/** FPA passes only when every parameter has been looked at and none failed. */
export function firstPieceApproved(fpa: RunFirstPiece, parameters: readonly string[]) {
  return (
    parameters.every((p) => fpa.results[p] && fpa.results[p] !== 'NOT_CHECKED') &&
    parameters.every((p) => fpa.results[p] !== 'DEFECT') &&
    Boolean(fpa.verifiedByQc)
  )
}

// ------------------------------------------------- First piece attempts

/**
 * One go at the first piece.
 *
 * A rejected first piece is not a dead end and it is not nothing: the machine
 * is corrected — a zone turned up, the die reseated, the cycle lengthened — and
 * a fresh piece is made and checked again. The format has to carry what was
 * wrong and what was done about it, which is why a failed attempt is a record
 * in its own right rather than something the operator clears and forgets.
 *
 * The job starts on the latest attempt passing, not on there never having been
 * a failure.
 */
export interface RunFirstPieceAttempt {
  attemptNo: number
  /** Time of day the piece was judged, as the operator would write it. */
  at: string
  results: Record<string, ParameterResult>
  producedByOperator: string
  verifiedByQc: string
  outcome: 'PASSED' | 'FAILED'
  /** What was changed on the machine before the next piece was made. */
  correctiveAction: string
  afterPowerFailure: boolean
}

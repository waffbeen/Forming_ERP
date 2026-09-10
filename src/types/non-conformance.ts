/* The non-conformance register.

   Both SOPs end the same way: "Document any non-conformities and report to the
   Production Supervisor for corrective action" (SOP-09 4.6.3, SOP-05 5.5). On
   paper that was a remark in the margin of whichever checklist caught it, which
   is exactly what an auditor cannot follow. Here every QC gate in the plant
   raises into one register, and a job cannot be closed nor a COA released while
   one of its non-conformances is still open. */

import type { NcDisposition, NcSource } from '@/config/plant'

export type NcSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL'
export type NcStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'

export interface NonConformance {
  ncId: string
  ncNumber: string
  raisedOn: string
  /** The gate that caught it, from NC_SOURCES. */
  source: NcSource
  /** Blank when the finding is against a receipt rather than a job. */
  jobCardNo: string
  /** Blank for an IQC finding, which is against a GRN instead. */
  grnNumber: string
  section: 'FORMING' | 'CUTTING' | 'SORTING' | 'STORES' | 'PACKING'
  /** The quality parameter that failed, worded as it is on the checklist. */
  parameter: string
  description: string
  /** Pieces, sheets or kg depending on where it was caught. */
  qtyAffected: number
  qtyUom: string
  severity: NcSeverity
  disposition: NcDisposition | null
  rootCause: string
  correctiveAction: string
  preventiveAction: string
  raisedBy: string
  /** The production supervisor answerable for closing it out. */
  responsible: string
  targetDate: string
  status: NcStatus
  closedBy: string
  closedOn: string | null
}

/** A non-conformance is closed only with a cause, both actions and a sign-off. */
export function ncClosable(nc: NonConformance) {
  return (
    Boolean(nc.disposition) &&
    nc.rootCause.trim().length > 0 &&
    nc.correctiveAction.trim().length > 0 &&
    nc.preventiveAction.trim().length > 0 &&
    Boolean(nc.closedBy)
  )
}

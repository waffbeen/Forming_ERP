/* Procurement and inventory.

   The chain is deliberately one way: a requisition asks for material, a
   purchase order commits to a supplier, a goods receipt note books what
   physically arrived, and only an IQC-approved GRN line moves stock into a
   bin. Nothing reaches inventory without a GRN behind it. */

import type { MasterBase } from './masters'

// ------------------------------------------------------- Purchase requisition

export type PrStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ORDERED' | 'CLOSED'

export interface PurchaseRequisitionLine {
  lineId: string
  itemId: string
  /** In the item's own unit: kilograms for reels, numbers for packing. */
  quantity: number
  requiredBy: string
  /** Set when the line is raised against a specific job card. */
  forJobCardNo: string | null
  remarks: string
}

export interface PurchaseRequisition extends MasterBase {
  prId: string
  prNumber: string
  prDate: string
  raisedByUserId: string
  department: string
  /** Approver, once somebody has acted on it. */
  approvedByUserId: string | null
  approvedOn: string | null
  prStatus: PrStatus
  lines: PurchaseRequisitionLine[]
}

// ------------------------------------------------------------- Purchase order

export type PoStatus = 'OPEN' | 'PART_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED'

export interface PurchaseOrderLine {
  lineId: string
  itemId: string
  /** Traces back to the requisition line this came from, when there was one. */
  prLineId: string | null
  orderedQty: number
  /** Booked against GRNs as material arrives. */
  receivedQty: number
  ratePerUom: number
  /** Reel-specific: what gauge and deckle was ordered. */
  thicknessMicrons: number | null
  deckleWidthMm: number | null
}

export interface PurchaseOrder extends MasterBase {
  poId: string
  poNumber: string
  poDate: string
  supplierId: string
  prNumber: string | null
  expectedDate: string
  /** Percent, applied on the line total. */
  gstPercent: number
  poStatus: PoStatus
  lines: PurchaseOrderLine[]
}

// --------------------------------------------------------- Goods receipt note

export type GrnLineStatus = 'PENDING_QC' | 'APPROVED' | 'QUARANTINE' | 'REJECTED'

export interface GrnLine {
  lineId: string
  poLineId: string
  itemId: string
  /** What the delivery note claimed, and what the scale actually read. */
  challanQty: number
  receivedQty: number
  /** Reels are received as individual rolls, each with its own barcode. */
  reelId: string | null
  thicknessMicrons: number | null
  /** IQC outcome, which decides the bin the line lands in. */
  qcStatus: GrnLineStatus
  binId: string | null
  qcRemarks: string
}

export interface GoodsReceiptNote extends MasterBase {
  grnId: string
  grnNumber: string
  grnDate: string
  poNumber: string
  supplierId: string
  supplierChallanNo: string
  supplierInvoiceNo: string
  receivedByUserId: string
  inspectedByUserId: string | null
  lines: GrnLine[]
}

// ----------------------------------------------------------------- Inventory

export type StockMoveKind =
  | 'GRN_RECEIPT'
  | 'ISSUE_TO_JOB'
  | 'RETURN_FROM_JOB'
  | 'SCRAP_TRANSFER'
  | 'ADJUSTMENT'

/**
 * One row per movement. Stock on hand is the running sum of these rather than
 * a stored number, so a balance can always be explained by the moves behind it.
 */
export interface StockMovement {
  movementId: string
  movedOn: string
  kind: StockMoveKind
  itemId: string
  binId: string
  /** Positive into the bin, negative out of it, in the item's own unit. */
  quantity: number
  /** Whichever document caused the move: a GRN, a job card, a transfer note. */
  reference: string
  reelId: string | null
  byUserId: string
}

export interface StockBalance {
  itemId: string
  binId: string
  quantity: number
}

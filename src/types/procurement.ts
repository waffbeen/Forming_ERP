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

/** What the store does with a quantity RM QC would not pass. */
export type RejectDisposition = 'RETURN_TO_SUPPLIER' | 'SCRAP'

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
  /**
   * The strictest outcome QC recorded against the line, which is what the
   * receipt register flags. A line split three ways reads as rejected even
   * though most of it passed, because the rejection is the part that needs
   * somebody to act.
   */
  qcStatus: GrnLineStatus
  /** Where the material was put away, and where an approved quantity counts. */
  binId: string | null
  qcRemarks: string

  /**
   * The stock gate. A receipt books what physically arrived; none of it counts
   * as stock until QC finalises the line, and then only `approvedQty` does.
   */
  isQcApproved: boolean
  /**
   * The RM QC report behind the decision. Null on a line QC never touched:
   * either still pending, or auto-approved because the item has no QC
   * parameters configured against it.
   */
  qcNumber: string | null
  /**
   * The three-way split QC signs off. All three are zero until the line is
   * finalised; from then on they sum to exactly `receivedQty`.
   */
  approvedQty: number
  holdQty: number
  rejectedQty: number
  /** Set once the store decides what happens to `rejectedQty`. */
  rejectDisposition: RejectDisposition | null
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

// ---------------------------------------------------------------- RM QC

/**
 * One characteristic on the incoming inspection format, defined per item
 * category so a polymer reel and a carton are not asked the same questions.
 *
 * A numeric characteristic is judged against its limits; an attribute one is
 * judged by eye against a list of acceptable answers.
 */
export interface QcParameter {
  parameterId: string
  /** Category the format belongs to, matching the item's own category. */
  categoryId: string
  characteristic: string
  specification: string
  /** How it is measured: the instrument or the reference method. */
  method: string
  uom: string | null
  /** Numeric characteristics only, and the reading is judged against them. */
  lowerLimit: number | null
  upperLimit: number | null
  /** What the reading should sit at, where there is a target to sit at. */
  nominal: number | null
  /**
   * Where the limits are a band around what the order asked for rather than
   * fixed numbers. Gauge works this way: a 300 micron reel and a 450 micron
   * reel are both allowed five per cent either side of their own order.
   */
  tolerancePctOfOrder: number | null
  /**
   * Answers an attribute characteristic may be closed with, the first of which
   * is the acceptable one. Null on a numeric characteristic.
   */
  acceptanceOptions: string[] | null
}

export type QcResult = 'PASS' | 'FAIL'

/** One characteristic as the inspector actually filled it in. */
export interface QcCharacteristicResult {
  parameterId: string
  /** One reading per sample drawn, in the order they were drawn. */
  readings: number[]
  /** Attribute characteristics carry the chosen answer instead of readings. */
  acceptanceStatus: string | null
  result: QcResult
  remark: string
}

/**
 * The inspection record for one received batch. It is written before any
 * quantity is signed off, and its number is what the GRN line then carries as
 * evidence, so an approval can never exist without an inspection behind it.
 */
export interface RmQcReport {
  qcNumber: string
  grnNumber: string
  grnLineId: string
  itemId: string
  reelId: string | null
  inspectedOn: string
  inspectedByUserId: string
  /** How much was drawn, and how many pieces were drawn from it. */
  sampleSize: string
  sampleCount: number
  characteristics: QcCharacteristicResult[]
  /** Fails on any characteristic, so the overall verdict is derived. */
  overallResult: QcResult
  remarks: string
}

/**
 * Where the QC screen shows a receipt, following the same three questions the
 * store asks: has it been inspected, did anything stay back, was anything sent
 * away. A receipt QC never had to touch appears in none of them.
 */
export type RmQcTab = 'PENDING' | 'PROCESSED' | 'HOLD' | 'REJECTED'

// -------------------------------------------------------- Material issue

/**
 * QC-approved raw material handed to the floor against one job card. This is
 * the only route from a bin to a machine: forming cannot start on a reel the
 * store has not issued, and the issue can only draw on approved stock.
 */
export interface MaterialIssue {
  issueId: string
  issueNo: string
  issuedOn: string
  jobCardNo: string
  itemId: string
  reelId: string | null
  /** Bin the material came out of, always a QC-approved one. */
  binId: string
  quantity: number
  /** The receipt and inspection the material is traceable back to. */
  grnNumber: string
  qcNumber: string | null
  /** Store keeper who issued it, and the operator who took it. */
  issuedByUserId: string
  issuedToEmployee: string
  remarks: string
}

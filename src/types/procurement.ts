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
  /**
   * The batch this line is. Reels arrive as individual rolls, each with its own
   * barcode, its own weight and its own inspection — so one purchase order line
   * becomes as many receipt lines as there were reels on the vehicle, and QC
   * runs against each of them rather than against a total.
   */
  reelId: string | null
  /** Which reel of the consignment this is, as the store counted them off. */
  batchNo?: number
  /** How many came in on this consignment, for the line to be read against. */
  batchesOnConsignment?: number
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

/**
 * The ten things the gate looks at before anything is booked in, taken from
 * Thomson's own inward check and worded for what arrives here: reels on a
 * vehicle rather than paper on a pallet.
 *
 * A failed check does not stop the receipt — the material is already at the
 * gate and refusing to record it helps nobody — but it is on the record, and
 * incoming QC sees it against the batch.
 */
export const INWARD_CHECKS = [
  'Vehicle as per the order',
  'Load stacked and aligned',
  'Documents match the consignment',
  'Packing and labelling intact',
  'Vehicle clean and dry',
  'No damage: dents, wet or cuts',
  'Reel count matches the challan',
  'Gauge marked on every reel',
  'Weight matches the challan',
  'Reported inside the delivery window',
] as const

export type InwardCheck = (typeof INWARD_CHECKS)[number]

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

  /* ------------------------------------------------ what came with the load */

  /** The supplier's own despatch document, and the date on it. */
  deliveryNoteNo?: string
  deliveryNoteDate?: string
  /** Statutory, and the first thing an auditor asks for. */
  eWayBillNo?: string
  eWayBillDate?: string
  /** Certificate of conformity for the batch, where the grade needs one. */
  cocNo?: string
  vehicleNo?: string
  transporter?: string
  /** Where the vehicle was unloaded, which is not always where stock ends up. */
  unloadingWarehouseId?: string
  /** The gate's inward check, keyed by the check's own wording. */
  inwardChecks?: Record<string, boolean>
  /** Freight and anything else on the invoice that is not the goods. */
  freightAmount?: number
  otherCharges?: number
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
 * How a characteristic is answered, which is also what decides how it is
 * judged. The master sets this per characteristic, so the inspection screen
 * never has to guess what kind of question it is asking.
 */
export type QcFieldType =
  /** Readings against limits: fails if any single sample falls outside. */
  | 'NUMERIC'
  /** One of a fixed list, the first of which is the acceptable answer. */
  | 'COMBO'
  /** A yes/no the inspector ticks; unticked is a fail. */
  | 'CHECKBOX'
  /**
   * A recorded observation with no verdict of its own — a batch number off the
   * supplier's label, say. It is evidence on the report, never a pass or fail,
   * so it cannot silently let a bad batch through.
   */
  | 'TEXT'

/**
 * One characteristic on the incoming inspection format, defined per item
 * category so a polymer reel and a carton are not asked the same questions.
 *
 * This is the master the QC screen is built from: change a row here and the
 * next inspection asks the new question. Nothing about the format is written
 * into the screen itself.
 */
export interface QcParameter {
  parameterId: string
  /** Category the format belongs to, matching the item's own category. */
  categoryId: string
  characteristic: string
  specification: string
  /** How it is answered, and therefore how it is judged. */
  fieldType: QcFieldType
  /** How it is measured: the instrument or the reference method. */
  method: string
  /** The instrument itself, which an auditor asks for by name. */
  measuringEquipment: string
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

/**
 * How much to draw, and how many samples from it, for one category's format.
 * It sits beside the characteristics rather than on them: an inspector draws
 * one set of samples and reads every characteristic off the same set.
 */
export interface QcSamplePlan {
  categoryId: string
  /** What is drawn, in the store's own words. */
  sampleSize: string
  /** How many are drawn, and therefore how many readings each numeric row takes. */
  sampleCount: number
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

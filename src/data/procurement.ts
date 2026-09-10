import type {
  GoodsReceiptNote, PurchaseOrder, PurchaseRequisition, StockBalance, StockMovement,
} from '@/types/procurement'
import { ITEMS } from './masters-extended'

const BY = 'Prakash Naik'

// ------------------------------------------------------ Purchase requisitions

export const PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
  {
    prId: 'PR1', prNumber: 'PR-2609-0044', prDate: '2026-09-05', raisedByUserId: 'U12',
    department: 'Planning', approvedByUserId: 'U02', approvedOn: '2026-09-05',
    prStatus: 'ORDERED', status: 'ACTIVE', createdBy: 'Pooja Gupta', createdDate: '2026-09-05',
    lines: [
      { lineId: 'PR1L1', itemId: 'IT1', quantity: 1200, requiredBy: '2026-09-14', forJobCardNo: 'JC-2609-124', remarks: 'Covers the Vadilal repeat and buffer' },
      { lineId: 'PR1L2', itemId: 'IT4', quantity: 900, requiredBy: '2026-09-16', forJobCardNo: null, remarks: 'Stock below reorder level' },
    ],
  },
  {
    prId: 'PR2', prNumber: 'PR-2609-0046', prDate: '2026-09-07', raisedByUserId: 'U10',
    department: 'Stores', approvedByUserId: 'U02', approvedOn: '2026-09-07',
    prStatus: 'ORDERED', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-07',
    lines: [
      { lineId: 'PR2L1', itemId: 'IT5', quantity: 800, requiredBy: '2026-09-12', forJobCardNo: null, remarks: 'Carton stock for September dispatches' },
      { lineId: 'PR2L2', itemId: 'IT7', quantity: 240, requiredBy: '2026-09-12', forJobCardNo: null, remarks: 'Below reorder level' },
    ],
  },
  {
    prId: 'PR3', prNumber: 'PR-2609-0049', prDate: '2026-09-08', raisedByUserId: 'U12',
    department: 'Planning', approvedByUserId: null, approvedOn: null,
    prStatus: 'SUBMITTED', status: 'ACTIVE', createdBy: 'Pooja Gupta', createdDate: '2026-09-08',
    lines: [
      { lineId: 'PR3L1', itemId: 'IT2', quantity: 1500, requiredBy: '2026-09-20', forJobCardNo: 'JC-2609-116', remarks: 'Cipla blister run, 450 micron amber' },
    ],
  },
  {
    prId: 'PR4', prNumber: 'PR-2609-0051', prDate: '2026-09-09', raisedByUserId: 'U02',
    department: 'Production', approvedByUserId: null, approvedOn: null,
    prStatus: 'SUBMITTED', status: 'ACTIVE', createdBy: 'Yuvraj Bhaigude', createdDate: '2026-09-09',
    lines: [
      { lineId: 'PR4L1', itemId: 'IT9', quantity: 8, requiredBy: '2026-09-18', forJobCardNo: null, remarks: 'Zone heaters, two spares below level' },
      { lineId: 'PR4L2', itemId: 'IT10', quantity: 6, requiredBy: '2026-09-18', forJobCardNo: null, remarks: 'Thermocouples for TF-03 overhaul' },
    ],
  },
  {
    prId: 'PR5', prNumber: 'PR-2609-0052', prDate: '2026-09-09', raisedByUserId: 'U10',
    department: 'Stores', approvedByUserId: null, approvedOn: null,
    prStatus: 'DRAFT', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-09',
    lines: [
      { lineId: 'PR5L1', itemId: 'IT3', quantity: 600, requiredBy: '2026-09-26', forJobCardNo: null, remarks: 'Himalaya order, pending artwork approval' },
    ],
  },
]

// ----------------------------------------------------------- Purchase orders

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    poId: 'PO1', poNumber: 'PO-2609-0088', poDate: '2026-09-05', supplierId: 'SP1',
    prNumber: 'PR-2609-0044', expectedDate: '2026-09-12', gstPercent: 18,
    poStatus: 'RECEIVED', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-05',
    lines: [
      { lineId: 'PO1L1', itemId: 'IT1', prLineId: 'PR1L1', orderedQty: 1200, receivedQty: 1200, ratePerUom: 105, thicknessMicrons: 300, deckleWidthMm: 620 },
    ],
  },
  {
    poId: 'PO2', poNumber: 'PO-2609-0091', poDate: '2026-09-05', supplierId: 'SP2',
    prNumber: 'PR-2609-0044', expectedDate: '2026-09-15', gstPercent: 18,
    poStatus: 'RECEIVED', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-05',
    lines: [
      { lineId: 'PO2L1', itemId: 'IT4', prLineId: 'PR1L2', orderedQty: 900, receivedQty: 900, ratePerUom: 118, thicknessMicrons: 280, deckleWidthMm: 620 },
    ],
  },
  {
    poId: 'PO3', poNumber: 'PO-2609-0094', poDate: '2026-09-07', supplierId: 'SP5',
    prNumber: 'PR-2609-0046', expectedDate: '2026-09-11', gstPercent: 12,
    poStatus: 'RECEIVED', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-07',
    lines: [
      { lineId: 'PO3L1', itemId: 'IT5', prLineId: 'PR2L1', orderedQty: 800, receivedQty: 800, ratePerUom: 68, thicknessMicrons: null, deckleWidthMm: null },
      { lineId: 'PO3L2', itemId: 'IT7', prLineId: 'PR2L2', orderedQty: 240, receivedQty: 240, ratePerUom: 32, thicknessMicrons: null, deckleWidthMm: null },
    ],
  },
  {
    poId: 'PO4', poNumber: 'PO-2609-0096', poDate: '2026-09-07', supplierId: 'SP3',
    prNumber: null, expectedDate: '2026-09-10', gstPercent: 18,
    poStatus: 'PART_RECEIVED', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-07',
    lines: [
      { lineId: 'PO4L1', itemId: 'IT3', prLineId: null, orderedQty: 900, receivedQty: 675, ratePerUom: 128, thicknessMicrons: 250, deckleWidthMm: 600 },
    ],
  },
  {
    poId: 'PO6', poNumber: 'PO-2609-0101', poDate: '2026-09-08', supplierId: 'SP4',
    prNumber: null, expectedDate: '2026-09-16', gstPercent: 18,
    poStatus: 'RECEIVED', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-08',
    lines: [
      { lineId: 'PO6L1', itemId: 'IT11', prLineId: null, orderedQty: 1800, receivedQty: 1800, ratePerUom: 134, thicknessMicrons: 400, deckleWidthMm: 620 },
    ],
  },
  {
    poId: 'PO5', poNumber: 'PO-2609-0099', poDate: '2026-09-08', supplierId: 'SP4',
    prNumber: null, expectedDate: '2026-09-20', gstPercent: 18,
    poStatus: 'PART_RECEIVED', status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-08',
    lines: [
      { lineId: 'PO5L1', itemId: 'IT2', prLineId: null, orderedQty: 1400, receivedQty: 1020, ratePerUom: 112, thicknessMicrons: 450, deckleWidthMm: 640 },
    ],
  },
]

// -------------------------------------------------------- Goods receipt notes

/**
 * A receipt records what arrived; RM QC decides how much of it counts. Every
 * line therefore carries the three-way split QC signed off on, and the number
 * of the inspection report behind it.
 *
 * A line with `qcNumber: null` and `isQcApproved: true` was auto-approved at
 * save: its item category has no QC parameters configured, so there is nothing
 * to inspect and the full quantity goes straight to the store. Those lines show
 * on no QC tab, by design.
 */
export const GRNS: GoodsReceiptNote[] = [
  {
    grnId: 'G1', grnNumber: 'GRN-2609-0188', grnDate: '2026-09-04', poNumber: 'PO-2609-0088',
    supplierId: 'SP1', supplierChallanNo: 'SP/CH/26/4471', supplierInvoiceNo: 'SP/INV/26/2210',
    receivedByUserId: 'U10', inspectedByUserId: 'U04',
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-04',
    lines: [
      { lineId: 'G1L1', poLineId: 'PO1L1', itemId: 'IT1', challanQty: 340, receivedQty: 340, reelId: 'RL-9241', thicknessMicrons: 301, qcStatus: 'APPROVED', binId: 'BN1', qcRemarks: 'Within tolerance', isQcApproved: true, qcNumber: 'RMQC-2609-0071', approvedQty: 340, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
      { lineId: 'G1L2', poLineId: 'PO1L1', itemId: 'IT1', challanQty: 860, receivedQty: 860, reelId: null, thicknessMicrons: 300, qcStatus: 'APPROVED', binId: 'BN1', qcRemarks: 'Balance of the order, three rolls', isQcApproved: true, qcNumber: 'RMQC-2609-0072', approvedQty: 860, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
    ],
  },
  {
    grnId: 'G2', grnNumber: 'GRN-2609-0201', grnDate: '2026-09-08', poNumber: 'PO-2609-0091',
    supplierId: 'SP2', supplierChallanNo: 'KE/CH/26/1180', supplierInvoiceNo: 'KE/INV/26/0904',
    receivedByUserId: 'U10', inspectedByUserId: 'U04',
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-08',
    lines: [
      { lineId: 'G2L1', poLineId: 'PO2L1', itemId: 'IT4', challanQty: 610, receivedQty: 610, reelId: 'RL-9253', thicknessMicrons: 279, qcStatus: 'APPROVED', binId: 'BN1', qcRemarks: 'Within tolerance', isQcApproved: true, qcNumber: 'RMQC-2609-0078', approvedQty: 610, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
    ],
  },
  {
    grnId: 'G3', grnNumber: 'GRN-2609-0194', grnDate: '2026-09-07', poNumber: 'PO-2609-0096',
    supplierId: 'SP3', supplierChallanNo: 'NF/CH/26/8802', supplierInvoiceNo: 'NF/INV/26/3315',
    receivedByUserId: 'U10', inspectedByUserId: 'U04',
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-07',
    lines: [
      { lineId: 'G3L1', poLineId: 'PO4L1', itemId: 'IT3', challanQty: 295, receivedQty: 295, reelId: 'RL-9247', thicknessMicrons: 243, qcStatus: 'QUARANTINE', binId: 'BN2', qcRemarks: 'Gauge 243 against 250 ordered, held for supplier decision', isQcApproved: true, qcNumber: 'RMQC-2609-0074', approvedQty: 0, holdQty: 295, rejectedQty: 0, rejectDisposition: null },
      { lineId: 'G3L2', poLineId: 'PO4L1', itemId: 'IT3', challanQty: 380, receivedQty: 380, reelId: 'RL-9258', thicknessMicrons: 598, qcStatus: 'QUARANTINE', binId: 'BN2', qcRemarks: 'Wrong gauge supplied, 598 against 250', isQcApproved: true, qcNumber: 'RMQC-2609-0075', approvedQty: 0, holdQty: 380, rejectedQty: 0, rejectDisposition: null },
    ],
  },
  {
    grnId: 'G4', grnNumber: 'GRN-2609-0195', grnDate: '2026-09-07', poNumber: 'PO-2609-0096',
    supplierId: 'SP3', supplierChallanNo: 'NF/CH/26/8809', supplierInvoiceNo: 'NF/INV/26/3319',
    receivedByUserId: 'U10', inspectedByUserId: 'U04',
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-07',
    lines: [
      { lineId: 'G4L1', poLineId: 'PO4L1', itemId: 'IT3', challanQty: 260, receivedQty: 260, reelId: 'RL-9248', thicknessMicrons: 176, qcStatus: 'REJECTED', binId: 'BN3', qcRemarks: 'Below the 180 micron plant floor, return to supplier', isQcApproved: true, qcNumber: 'RMQC-2609-0076', approvedQty: 0, holdQty: 0, rejectedQty: 260, rejectDisposition: 'RETURN_TO_SUPPLIER' },
    ],
  },
  {
    grnId: 'G5', grnNumber: 'GRN-2609-0199', grnDate: '2026-09-08', poNumber: 'PO-2609-0099',
    supplierId: 'SP4', supplierChallanNo: 'GP/CH/26/5540', supplierInvoiceNo: 'GP/INV/26/1177',
    receivedByUserId: 'U10', inspectedByUserId: 'U04',
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-08',
    lines: [
      { lineId: 'G5L1', poLineId: 'PO5L1', itemId: 'IT2', challanQty: 520, receivedQty: 520, reelId: 'RL-9251', thicknessMicrons: 452, qcStatus: 'APPROVED', binId: 'BN1', qcRemarks: 'Within tolerance', isQcApproved: true, qcNumber: 'RMQC-2609-0079', approvedQty: 520, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
    ],
  },
  {
    grnId: 'G6', grnNumber: 'GRN-2609-0204', grnDate: '2026-09-09', poNumber: 'PO-2609-0101',
    supplierId: 'SP4', supplierChallanNo: 'GP/CH/26/5552', supplierInvoiceNo: 'GP/INV/26/1189',
    receivedByUserId: 'U10', inspectedByUserId: 'U04',
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-09',
    lines: [
      { lineId: 'G6L1', poLineId: 'PO6L1', itemId: 'IT11', challanQty: 900, receivedQty: 900, reelId: 'RL-9256', thicknessMicrons: 401, qcStatus: 'APPROVED', binId: 'BN1', qcRemarks: 'Within tolerance', isQcApproved: true, qcNumber: 'RMQC-2609-0080', approvedQty: 900, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
    ],
  },
  {
    /* Cartons and tape: nothing is configured against the packing category, so
       both lines auto-approved at save and never reached the QC screen. */
    grnId: 'G7', grnNumber: 'GRN-2609-0207', grnDate: '2026-09-06', poNumber: 'PO-2609-0094',
    supplierId: 'SP5', supplierChallanNo: 'AP/CH/26/2201', supplierInvoiceNo: 'AP/INV/26/0778',
    receivedByUserId: 'U10', inspectedByUserId: null,
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-06',
    lines: [
      { lineId: 'G7L1', poLineId: 'PO3L1', itemId: 'IT5', challanQty: 800, receivedQty: 800, reelId: null, thicknessMicrons: null, qcStatus: 'APPROVED', binId: 'BN5', qcRemarks: 'Count verified against the challan', isQcApproved: true, qcNumber: null, approvedQty: 800, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
      { lineId: 'G7L2', poLineId: 'PO3L2', itemId: 'IT7', challanQty: 240, receivedQty: 240, reelId: null, thicknessMicrons: null, qcStatus: 'APPROVED', binId: 'BN5', qcRemarks: 'Count verified against the challan', isQcApproved: true, qcNumber: null, approvedQty: 240, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
    ],
  },
  {
    /* Inspected and split three ways: most of the roll passed, 80 kg is held
       against a haze query and 40 kg goes back to the supplier. */
    grnId: 'G8', grnNumber: 'GRN-2609-0208', grnDate: '2026-09-09', poNumber: 'PO-2609-0099',
    supplierId: 'SP4', supplierChallanNo: 'GP/CH/26/5561', supplierInvoiceNo: 'GP/INV/26/1194',
    receivedByUserId: 'U10', inspectedByUserId: 'U05',
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-09',
    lines: [
      { lineId: 'G8L1', poLineId: 'PO5L1', itemId: 'IT2', challanQty: 500, receivedQty: 500, reelId: 'RL-9259', thicknessMicrons: 449, qcStatus: 'REJECTED', binId: 'BN1', qcRemarks: 'Haze on the outer wraps: 80 kg held for a supplier response, 40 kg returned', isQcApproved: true, qcNumber: 'RMQC-2609-0081', approvedQty: 380, holdQty: 80, rejectedQty: 40, rejectDisposition: 'RETURN_TO_SUPPLIER' },
    ],
  },
  {
    /* Booked yesterday evening, still to be inspected. */
    grnId: 'G9', grnNumber: 'GRN-2609-0209', grnDate: '2026-09-09', poNumber: 'PO-2609-0091',
    supplierId: 'SP2', supplierChallanNo: 'KE/CH/26/1196', supplierInvoiceNo: '',
    receivedByUserId: 'U10', inspectedByUserId: null,
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-09',
    lines: [
      { lineId: 'G9L1', poLineId: 'PO2L1', itemId: 'IT4', challanQty: 290, receivedQty: 290, reelId: 'RL-9260', thicknessMicrons: 281, qcStatus: 'PENDING_QC', binId: null, qcRemarks: '', isQcApproved: false, qcNumber: null, approvedQty: 0, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
    ],
  },
  {
    /* Two rolls off this morning vehicle, waiting on the inspection table. */
    grnId: 'G10', grnNumber: 'GRN-2609-0210', grnDate: '2026-09-10', poNumber: 'PO-2609-0101',
    supplierId: 'SP4', supplierChallanNo: 'GP/CH/26/5573', supplierInvoiceNo: '',
    receivedByUserId: 'U10', inspectedByUserId: null,
    status: 'ACTIVE', createdBy: BY, createdDate: '2026-09-10',
    lines: [
      { lineId: 'G10L1', poLineId: 'PO6L1', itemId: 'IT11', challanQty: 450, receivedQty: 450, reelId: 'RL-9261', thicknessMicrons: 402, qcStatus: 'PENDING_QC', binId: null, qcRemarks: '', isQcApproved: false, qcNumber: null, approvedQty: 0, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
      { lineId: 'G10L2', poLineId: 'PO6L1', itemId: 'IT11', challanQty: 450, receivedQty: 450, reelId: 'RL-9262', thicknessMicrons: 396, qcStatus: 'PENDING_QC', binId: null, qcRemarks: '', isQcApproved: false, qcNumber: null, approvedQty: 0, holdQty: 0, rejectedQty: 0, rejectDisposition: null },
    ],
  },
]

// ---------------------------------------------------------- Stock movements

/**
 * Receipts are generated from the GRN lines RM QC has finalised, and only for
 * the quantity it approved. So nothing appears in a bin without a goods receipt
 * behind it, and a held or returned quantity never counts as stock at all.
 * Issues and returns are booked separately as the floor consumes material.
 */
const RECEIPTS: StockMovement[] = GRNS.flatMap((grn) =>
  grn.lines
    .filter((line) => line.isQcApproved && line.approvedQty > 0 && line.binId)
    .map((line, i) => ({
      movementId: `MV-${grn.grnNumber}-${i + 1}`,
      movedOn: grn.grnDate,
      kind: 'GRN_RECEIPT' as const,
      itemId: line.itemId,
      binId: line.binId as string,
      quantity: line.approvedQty,
      reference: grn.grnNumber,
      reelId: line.reelId,
      byUserId: grn.receivedByUserId,
    })),
)

/**
 * What was already on the shelf when the system went live. Without these the
 * ledger would start every item at zero and read as if the plant had nothing.
 */
const OPENING_BALANCES: StockMovement[] = [
  { movementId: 'MV-OPN-0001', movedOn: '2026-09-01', kind: 'ADJUSTMENT', itemId: 'IT6', binId: 'BN5', quantity: 5600, reference: 'Opening balance', reelId: null, byUserId: 'U10' },
  { movementId: 'MV-OPN-0002', movedOn: '2026-09-01', kind: 'ADJUSTMENT', itemId: 'IT8', binId: 'BN6', quantity: 35, reference: 'Opening balance', reelId: null, byUserId: 'U10' },
  { movementId: 'MV-OPN-0003', movedOn: '2026-09-01', kind: 'ADJUSTMENT', itemId: 'IT9', binId: 'BN6', quantity: 4, reference: 'Opening balance', reelId: null, byUserId: 'U10' },
  { movementId: 'MV-OPN-0004', movedOn: '2026-09-01', kind: 'ADJUSTMENT', itemId: 'IT10', binId: 'BN6', quantity: 14, reference: 'Opening balance', reelId: null, byUserId: 'U10' },
]

const FLOOR_MOVES: StockMovement[] = [
  { movementId: 'MV-ISS-0311', movedOn: '2026-09-08', kind: 'ISSUE_TO_JOB', itemId: 'IT1', binId: 'BN1', quantity: -340, reference: 'JC-2609-124', reelId: 'RL-9241', byUserId: 'U10' },
  { movementId: 'MV-RET-0311', movedOn: '2026-09-09', kind: 'RETURN_FROM_JOB', itemId: 'IT1', binId: 'BN1', quantity: 16, reference: 'JC-2609-124', reelId: 'RL-9241', byUserId: 'U10' },
  { movementId: 'MV-ISS-0312', movedOn: '2026-09-08', kind: 'ISSUE_TO_JOB', itemId: 'IT4', binId: 'BN1', quantity: -610, reference: 'JC-2609-121', reelId: 'RL-9253', byUserId: 'U10' },
  { movementId: 'MV-RET-0312', movedOn: '2026-09-09', kind: 'RETURN_FROM_JOB', itemId: 'IT4', binId: 'BN1', quantity: 275.1, reference: 'JC-2609-121', reelId: 'RL-9253', byUserId: 'U10' },
  { movementId: 'MV-ISS-0313', movedOn: '2026-09-09', kind: 'ISSUE_TO_JOB', itemId: 'IT11', binId: 'BN1', quantity: -900, reference: 'JC-2609-112', reelId: 'RL-9256', byUserId: 'U10' },
  { movementId: 'MV-ISS-0316', movedOn: '2026-09-08', kind: 'ISSUE_TO_JOB', itemId: 'IT2', binId: 'BN1', quantity: -520, reference: 'JC-2609-118', reelId: 'RL-9251', byUserId: 'U10' },
  { movementId: 'MV-RET-0313', movedOn: '2026-09-09', kind: 'RETURN_FROM_JOB', itemId: 'IT11', binId: 'BN1', quantity: 34.7, reference: 'JC-2609-112', reelId: 'RL-9256', byUserId: 'U10' },
  { movementId: 'MV-ISS-0314', movedOn: '2026-09-06', kind: 'ISSUE_TO_JOB', itemId: 'IT5', binId: 'BN5', quantity: -300, reference: 'JC-2609-121', reelId: null, byUserId: 'U10' },
  { movementId: 'MV-ISS-0315', movedOn: '2026-09-09', kind: 'ISSUE_TO_JOB', itemId: 'IT5', binId: 'BN5', quantity: -125, reference: 'JC-2609-124', reelId: null, byUserId: 'U10' },
  { movementId: 'MV-SCR-0117', movedOn: '2026-09-09', kind: 'SCRAP_TRANSFER', itemId: 'IT1', binId: 'BN7', quantity: 52.0, reference: 'RCY-2609-0117', reelId: null, byUserId: 'U09' },
  { movementId: 'MV-SCR-0116', movedOn: '2026-09-08', kind: 'SCRAP_TRANSFER', itemId: 'IT4', binId: 'BN7', quantity: 70.5, reference: 'RCY-2609-0116', reelId: null, byUserId: 'U09' },
  { movementId: 'MV-ADJ-0021', movedOn: '2026-09-06', kind: 'ADJUSTMENT', itemId: 'IT7', binId: 'BN5', quantity: -4, reference: 'Cycle count 06 Sep', reelId: null, byUserId: 'U10' },
]

export const STOCK_MOVEMENTS: StockMovement[] = [...OPENING_BALANCES, ...RECEIPTS, ...FLOOR_MOVES].sort(
  (a, b) => b.movedOn.localeCompare(a.movedOn),
)

/**
 * Stock on hand is the running sum of the movements, never a stored figure, so
 * any balance can be explained by the rows behind it.
 */
export const STOCK_BALANCES: StockBalance[] = (() => {
  const map = new Map<string, StockBalance>()
  for (const move of STOCK_MOVEMENTS) {
    const key = `${move.itemId}|${move.binId}`
    const current = map.get(key) ?? { itemId: move.itemId, binId: move.binId, quantity: 0 }
    current.quantity += move.quantity
    map.set(key, current)
  }
  return [...map.values()].map((b) => ({ ...b, quantity: Number(b.quantity.toFixed(1)) }))
})()

/** Total on hand for one item across every bin. */
export function stockOnHand(itemId: string) {
  return Number(
    STOCK_BALANCES.filter((b) => b.itemId === itemId)
      .reduce((sum, b) => sum + b.quantity, 0)
      .toFixed(1),
  )
}

/** Quantity ordered but not yet received, per item. */
export function onOrderQty(itemId: string) {
  return Number(
    PURCHASE_ORDERS.filter((po) => po.poStatus === 'OPEN' || po.poStatus === 'PART_RECEIVED')
      .flatMap((po) => po.lines)
      .filter((line) => line.itemId === itemId)
      .reduce((sum, line) => sum + (line.orderedQty - line.receivedQty), 0)
      .toFixed(1),
  )
}

/**
 * Bins holding a negative quantity. Stock cannot physically go below zero, so
 * anything here means a movement was booked against the wrong item or bin, and
 * the screens surface it rather than quietly showing a minus sign.
 */
export function negativeBalances() {
  return STOCK_BALANCES.filter((b) => b.quantity < 0)
}

/** Items whose free stock has fallen below the reorder level. */
export function itemsBelowReorder() {
  return ITEMS.filter((item) => stockOnHand(item.itemId) < item.reorderLevel)
}

/* Domain types for the thermoforming ERP frontend.
   Field names follow the agreed database spec so the API layer can map 1:1. */

export type MaterialType = 'PVC' | 'PET' | 'HIPS' | 'PP'
export type TrayType = 'TRANSPARENT' | 'HIPS_WHITE' | 'AMBER' | 'GREEN'
export type QcStatus = 'QUARANTINE' | 'APPROVED' | 'REJECTED'
export type SignOff = 'PENDING' | 'APPROVED' | 'REJECTED'

export type OrderStatus =
  | 'PLANNED'
  | 'AWAITING_ARTWORK'
  | 'READY_TO_RELEASE'
  | 'IN_PRODUCTION'
  | 'DISPATCHED'

export type JobStage = 'REEL_ISSUE' | 'FORMING' | 'CUTTING' | 'SORTING' | 'PACKING'
export type StageState = 'DONE' | 'ACTIVE' | 'BLOCKED' | 'PENDING'

export interface Customer {
  customerId: string
  customerCode: string
  customerName: string
  segment: 'Pharmaceutical' | 'Food' | 'Cosmetics'
  city: string
  gstin: string
  paymentTerms: string
  activeArtworks: number
}

export interface ArtworkMaster {
  artworkId: string
  artworkCode: string
  customerId: string
  customerName: string
  clientProductRef: string
  trayType: TrayType
  materialType: MaterialType
  thicknessMicrons: number
  openLengthMm: number
  openWidthMm: number
  depthMm: number
  cavityUpsPerSheet: number
  drawingRef: string
  approved: boolean
}

export interface MaterialGrade {
  materialId: string
  materialType: MaterialType
  grade: string
  densityGCm3: number
  minMicrons: number
  maxMicrons: number
  ratePerKg: number
  scrapRatePerKg: number
  colours: string[]
}

export interface Reel {
  reelId: string
  grnNumber: string
  materialType: MaterialType
  thicknessMicrons: number
  deckleWidthMm: number
  grossWeightKg: number
  netWeightKg: number
  qcStatus: QcStatus
  storageLocation: string
  receivedOn: string
  supplier: string
}

export interface Machine {
  machineId: string
  machineCode: string
  machineName: string
  type: 'FORMING' | 'CUTTING'
  bedLengthMm: number
  bedWidthMm: number
  sheetsPerStroke: number
  strokesPerMin: number
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE'
}

export interface Die {
  dieId: string
  dieCode: string
  artworkCode: string
  type: 'FORMING' | 'CUTTING'
  cavities: number
  lastServicedOn: string
  strokesSinceService: number
  serviceDueAt: number
  location: string
}

export interface Operator {
  operatorId: string
  employeeCode: string
  name: string
  role: 'Operator' | 'QC Inspector' | 'Packer' | 'Store Keeper' | 'Planner'
  shift: 'A' | 'B' | 'General'
  certifiedFor: string[]
}

/* ============================================================
   Enquiry to order.

   A customer asks, the plant costs it, the customer accepts, and the
   order is raised. Each of those is its own record because each can
   end where it stands: an enquiry can be lost before it is costed, an
   estimation can be rejected on rate. A repeat order for a design that
   is already costed skips the middle and is raised direct.
   ============================================================ */

export type EnquirySource = 'EMAIL' | 'PHONE' | 'PLANT_VISIT' | 'REFERRAL'
export type EnquiryStatus = 'OPEN' | 'ESTIMATED' | 'CONVERTED' | 'LOST'

export interface SalesEnquiry {
  enquiryId: string
  enquiryNo: string
  enquiryDate: string
  /** Null while the enquiry is from a prospect who is not a customer yet. */
  customerId: string | null
  customerName: string
  contactPerson: string
  productDescription: string
  /** Set once the design resolves to a costed artwork master. */
  artworkCode: string | null
  materialType: MaterialType
  thicknessMicrons: number
  openLengthMm: number
  openWidthMm: number
  depthMm: number
  expectedQtyPcs: number
  /** What the customer says they want to pay, if they have said. */
  targetRatePerPc: number | null
  requiredBy: string
  source: EnquirySource
  status: EnquiryStatus
  remarks: string
}

export type EstimationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'LOST' | 'CONVERTED'

/**
 * A costed offer. The weights, sheet count and landed cost are derived from
 * the open layout by the same engine the job card uses, so the rate quoted to
 * the customer and the cost booked in production cannot drift apart. Only the
 * margin and the conversion rate are a commercial decision.
 */
export interface Estimation {
  estimationId: string
  estimationNo: string
  estimationDate: string
  /** Null when the plant is costing a design nobody has formally asked for. */
  enquiryNo: string | null
  customerId: string | null
  customerName: string
  artworkCode: string | null
  productDescription: string
  materialType: MaterialType
  thicknessMicrons: number
  openLengthMm: number
  openWidthMm: number
  quantityPcs: number
  conversionRatePerPc: number
  marginPercent: number
  validUntil: string
  status: EstimationStatus
  preparedBy: string
  /* Derived from the nesting and costing engine, never keyed in. */
  upsPerSheet: number
  sheetsRequired: number
  grossWeightKg: number
  costPerPiece: number
  offeredRatePerPc: number
  orderValue: number
}

/**
 * One item on a sales order.
 *
 * A customer PO rarely names a single tray: a pharmaceutical order will carry
 * the base tray and its lid, a food order several cavity counts of the same
 * design. Each is its own artwork, its own gauge, its own rate and often its
 * own delivery date, and each becomes its own job card, so each is its own
 * line rather than a note against one.
 */
export interface SalesOrderLine {
  lineId: string
  /** Position on the customer's own PO, so the two can be read side by side. */
  lineNo: number
  artworkCode: string
  materialType: MaterialType
  thicknessMicrons: number
  orderQtyPcs: number
  ratePerPc: number
  deliveryDate: string
}

export interface SalesOrder {
  salesOrderId: string
  soNumber: string
  soDate: string
  customerId: string
  customerName: string
  clientPoRef: string
  lines: SalesOrderLine[]
  status: OrderStatus
  /** Where the order came from: a costed estimation, or straight in. */
  source: 'DIRECT' | 'ESTIMATION'
  enquiryNo: string | null
  estimationNo: string | null
}

export interface JobCard {
  jobCardId: string
  jobCardNo: string
  soNumber: string
  artworkCode: string
  customerName: string
  materialType: MaterialType
  thicknessMicrons: number
  targetPiecesQty: number
  requiredSheetsQty: number
  estReelWeightKg: number
  estTrimWasteKg: number
  formingMachineCode: string
  cuttingMachineCode: string
  reelId: string | null
  stages: Record<JobStage, StageState>
}

export interface FormingLog {
  formingLogId: string
  jobCardNo: string
  reelId: string
  lineClearanceSigned: boolean
  firstPieceQc: SignOff
  startCounterReading: number
  endCounterReading: number
  outputFormedSheets: number
  issuedWeightKg: number
  returnedReelWeightKg: number
  consumedWeightKg: number
  operator: string
  shift: 'A' | 'B'
}

export interface CuttingLog {
  cuttingLogId: string
  jobCardNo: string
  lineClearanceSigned: boolean
  inputFormedSheets: number
  sheetsPerStroke: number
  goodPiecesOutput: number
  rejectedPiecesQty: number
  skeletonScrapWeightKg: number
  operator: string
  shift: 'A' | 'B'
}

/**
 * The sorting table, worked after the press. Every piece the press produced is
 * either passed or pulled out against a named reason, so the reasons total to
 * the rejection quantity and nothing leaves the table unaccounted for.
 */
export interface SortingLog {
  sortingLogId: string
  jobCardNo: string
  /** Good pieces handed over by cutting. */
  inputPiecesQty: number
  sortedPiecesQty: number
  rejectedPiecesQty: number
  /** Rejections by reason, from SORTING_REJECT_REASONS. */
  rejectionByReason: Record<string, number>
  /** Pieces that passed the table and go forward to packing. */
  goodPiecesQty: number
  pendingPiecesQty: number
  sorter: string
  shift: 'A' | 'B'
  completed: boolean
}

export interface InProcessCheck {
  checkId: string
  jobCardNo: string
  time: string
  inspector: string
  thicknessMicrons: number
  visualClarity: 'PASS' | 'FAIL'
  result: 'PASSED' | 'FAILED'
}

export interface Coa {
  coaId: string
  coaNumber: string
  jobCardNo: string
  customerName: string
  avgThicknessMicrons: number
  depthMm: number
  visualClarity: 'PASS' | 'FAIL'
  migrationTest: 'CONFORMS' | 'FAILED'
  hourlyChecksMatched: string
  gdpAuditLock: boolean
  releasedOn: string | null
}

export interface PackingRecord {
  packingId: string
  jobCardNo: string
  customerName: string
  goodPiecesQty: number
  rejectedPiecesQty: number
  piecesPerCarton: number
  cartons: number
  loosePieces: number
  fgReport: 'PASSED' | 'INSPECTING' | 'FAILED'
}

export interface ScrapEntry {
  scrapId: string
  jobCardNo: string
  materialType: MaterialType
  skeletonKg: number
  rejectKg: number
  totalKg: number
  route: 'IN_HOUSE' | 'EXTERNAL'
  transferNote: string
  date: string
}

import type {
  Coa, CuttingLog, FormingLog, InProcessCheck, JobCard, PackingRecord, SalesOrder,
  SalesOrderLine, ScrapEntry, SortingLog,
} from '@/types'
import { calculateCosting, calculateNesting, calculateReelWeight } from '@/lib/layout-calc'
import { DECKLE_MM, PLANT } from '@/config/plant'
import { ARTWORKS, MATERIALS } from './masters'
import { PRODUCTS } from './masters-extended'

export const SALES_ORDERS: SalesOrder[] = [
  {
    salesOrderId: 'S01', soNumber: 'SO-2609-041', soDate: '2026-09-02',
    customerId: 'C01', customerName: 'Vadilal Industries', clientPoRef: 'PO/VAD/26-27/1188',
    status: 'IN_PRODUCTION', source: 'DIRECT', enquiryNo: null, estimationNo: null,
    lines: [
      { lineId: 'S01L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-PVC-0312', productCode: null, materialType: 'PVC', thicknessMicrons: 300, orderQtyPcs: 25000, ratePerPc: 2.85, deliveryDate: '2026-09-18' },
      { lineId: 'S01L2', lineNo: 2, kind: 'ARTWORK', artworkCode: 'AW-HIP-0098', productCode: null, materialType: 'HIPS', thicknessMicrons: 280, orderQtyPcs: 12000, ratePerPc: 1.62, deliveryDate: '2026-09-25' },
    ],
  },
  {
    salesOrderId: 'S02', soNumber: 'SO-2609-040', soDate: '2026-09-02',
    customerId: 'C02', customerName: 'Cipla Ltd', clientPoRef: 'PO/CIP/2609/0442',
    status: 'READY_TO_RELEASE', source: 'DIRECT', enquiryNo: null, estimationNo: null,
    lines: [
      { lineId: 'S02L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-PVC-0288', productCode: null, materialType: 'PVC', thicknessMicrons: 450, orderQtyPcs: 60000, ratePerPc: 3.40, deliveryDate: '2026-09-22' },
    ],
  },
  {
    salesOrderId: 'S03', soNumber: 'SO-2609-038', soDate: '2026-09-01',
    customerId: 'C03', customerName: 'Britannia Industries', clientPoRef: 'PO/BRI/26/7714',
    status: 'IN_PRODUCTION', source: 'DIRECT', enquiryNo: null, estimationNo: null,
    lines: [
      { lineId: 'S03L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-HIP-0104', productCode: null, materialType: 'HIPS', thicknessMicrons: 350, orderQtyPcs: 40000, ratePerPc: 3.10, deliveryDate: '2026-09-15' },
      { lineId: 'S03L2', lineNo: 2, kind: 'PRODUCT', artworkCode: null, productCode: 'PRD-0010', materialType: 'HIPS', thicknessMicrons: 350, orderQtyPcs: 14000, ratePerPc: 3.18, deliveryDate: '2026-09-20' },
    ],
  },
  {
    salesOrderId: 'S04', soNumber: 'SO-2609-036', soDate: '2026-09-01',
    customerId: 'C04', customerName: 'Himalaya Wellness', clientPoRef: 'PO/HIM/2609/221',
    status: 'AWAITING_ARTWORK', source: 'DIRECT', enquiryNo: null, estimationNo: null,
    lines: [
      { lineId: 'S04L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-PET-0219', productCode: null, materialType: 'PET', thicknessMicrons: 250, orderQtyPcs: 18500, ratePerPc: 2.20, deliveryDate: '2026-09-24' },
    ],
  },
  {
    salesOrderId: 'S05', soNumber: 'SO-2609-035', soDate: '2026-08-31',
    customerId: 'C05', customerName: 'Zydus Lifesciences', clientPoRef: 'PO/ZYD/26-27/0913',
    status: 'READY_TO_RELEASE', source: 'DIRECT', enquiryNo: null, estimationNo: null,
    lines: [
      { lineId: 'S05L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-PVC-0295', productCode: null, materialType: 'PVC', thicknessMicrons: 500, orderQtyPcs: 32000, ratePerPc: 7.60, deliveryDate: '2026-09-26' },
      { lineId: 'S05L2', lineNo: 2, kind: 'ARTWORK', artworkCode: 'AW-PET-0201', productCode: null, materialType: 'PET', thicknessMicrons: 600, orderQtyPcs: 6000, ratePerPc: 9.40, deliveryDate: '2026-10-02' },
      { lineId: 'S05L3', lineNo: 3, kind: 'ARTWORK', artworkCode: 'AW-PVC-0288', productCode: null, materialType: 'PVC', thicknessMicrons: 450, orderQtyPcs: 15000, ratePerPc: 3.55, deliveryDate: '2026-10-02' },
      { lineId: 'S05L4', lineNo: 4, kind: 'PRODUCT', artworkCode: null, productCode: 'PRD-0010', materialType: 'HIPS', thicknessMicrons: 350, orderQtyPcs: 8000, ratePerPc: 3.25, deliveryDate: '2026-10-06' },
    ],
  },
  {
    salesOrderId: 'S06', soNumber: 'SO-2609-033', soDate: '2026-08-30',
    customerId: 'C06', customerName: 'Parle Products', clientPoRef: 'PO/PAR/2609/5502',
    status: 'PLANNED', source: 'ESTIMATION', enquiryNo: 'ENQ-2609-0039', estimationNo: 'EST-2609-0026',
    lines: [
      { lineId: 'S06L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-PP-0067', productCode: null, materialType: 'PP', thicknessMicrons: 400, orderQtyPcs: 75000, ratePerPc: 2.65, deliveryDate: '2026-09-30' },
    ],
  },
  {
    salesOrderId: 'S07', soNumber: 'SO-2609-031', soDate: '2026-08-29',
    customerId: 'C07', customerName: 'Emami Ltd', clientPoRef: 'PO/EMA/26/3341',
    status: 'AWAITING_ARTWORK', source: 'ESTIMATION', enquiryNo: 'ENQ-2609-0037', estimationNo: 'EST-2609-0024',
    lines: [
      { lineId: 'S07L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-PET-0201', productCode: null, materialType: 'PET', thicknessMicrons: 600, orderQtyPcs: 12000, ratePerPc: 9.15, deliveryDate: '2026-09-19' },
    ],
  },
  {
    salesOrderId: 'S08', soNumber: 'SO-2609-029', soDate: '2026-08-28',
    customerId: 'C08', customerName: 'Mother Dairy', clientPoRef: 'PO/MOD/2609/8871',
    status: 'IN_PRODUCTION', source: 'DIRECT', enquiryNo: null, estimationNo: null,
    lines: [
      { lineId: 'S08L1', lineNo: 1, kind: 'ARTWORK', artworkCode: 'AW-HIP-0098', productCode: null, materialType: 'HIPS', thicknessMicrons: 280, orderQtyPcs: 90000, ratePerPc: 1.55, deliveryDate: '2026-09-28' },
    ],
  },
]

/* ------------------------------------------------------------------ Totals

   An order's quantity, value and delivery date are what its lines add up to,
   so a line changed on one screen cannot leave a stale total on another. */

/** Pieces across every line on an order. */
export function orderQty(order: SalesOrder) {
  return order.lines.reduce((sum, line) => sum + line.orderQtyPcs, 0)
}

/** What the order is worth at the rates agreed line by line. */
export function orderValue(order: SalesOrder) {
  return order.lines.reduce((sum, line) => sum + line.orderQtyPcs * line.ratePerPc, 0)
}

/** The date the order first has to ship something, which is what a planner
    schedules against. */
export function orderDeliveryDate(order: SalesOrder) {
  return order.lines.reduce(
    (earliest, line) => (earliest === '' || line.deliveryDate < earliest ? line.deliveryDate : earliest),
    '',
  )
}

/** Every line on every order, for a screen that works line by line. */
export function allOrderLines() {
  return SALES_ORDERS.flatMap((order) => order.lines.map((line) => ({ order, line })))
}

/**
 * The drawing a line is ultimately made from. A customer design carries its
 * own; one of the plant's own products carries the design it was built from,
 * which is what the job card and the nesting need.
 */
export function lineArtworkCode(line: SalesOrderLine) {
  if (line.kind === 'ARTWORK') return line.artworkCode
  return PRODUCTS.find((p) => p.productCode === line.productCode)?.artworkCode ?? null
}

/** How a line reads on a screen: the product name, or the artwork code. */
export function lineLabel(line: SalesOrderLine) {
  if (line.kind === 'PRODUCT') return line.productCode ?? 'Unnamed product'
  return line.artworkCode ?? 'No artwork'
}

/** The line a job card was raised against. */
export function lineFor(soNumber: string, artworkCode: string) {
  return SALES_ORDERS.find((o) => o.soNumber === soNumber)?.lines.find(
    (l) => lineArtworkCode(l) === artworkCode,
  )
}

type JobCardPlan = Omit<JobCard, 'requiredSheetsQty' | 'estReelWeightKg' | 'estTrimWasteKg'>

const JOB_CARD_PLANS: JobCardPlan[] = [
  {
    jobCardId: 'J01', jobCardNo: 'JC-2609-124', soNumber: 'SO-2609-041', artworkCode: 'AW-PVC-0312',
    customerName: 'Vadilal Industries', materialType: 'PVC', thicknessMicrons: 300,
    targetPiecesQty: 25000,
    formingMachineCode: 'TF-01', cuttingMachineCode: 'PN-02', reelId: 'RL-9241',
    stages: { REEL_ISSUE: 'DONE', FORMING: 'DONE', CUTTING: 'DONE', SORTING: 'DONE', PACKING: 'ACTIVE' },
  },
  {
    jobCardId: 'J02', jobCardNo: 'JC-2609-123', soNumber: 'SO-2609-038', artworkCode: 'AW-HIP-0104',
    customerName: 'Britannia Industries', materialType: 'HIPS', thicknessMicrons: 350,
    targetPiecesQty: 40000,
    formingMachineCode: 'TF-02', cuttingMachineCode: 'PN-01', reelId: 'RL-9244',
    stages: { REEL_ISSUE: 'DONE', FORMING: 'ACTIVE', CUTTING: 'PENDING', SORTING: 'PENDING', PACKING: 'PENDING' },
  },
  {
    jobCardId: 'J03', jobCardNo: 'JC-2609-121', soNumber: 'SO-2609-029', artworkCode: 'AW-HIP-0098',
    customerName: 'Mother Dairy', materialType: 'HIPS', thicknessMicrons: 280,
    targetPiecesQty: 90000,
    formingMachineCode: 'TF-01', cuttingMachineCode: 'PN-02', reelId: 'RL-9253',
    stages: { REEL_ISSUE: 'DONE', FORMING: 'DONE', CUTTING: 'DONE', SORTING: 'DONE', PACKING: 'ACTIVE' },
  },
  {
    jobCardId: 'J04', jobCardNo: 'JC-2609-118', soNumber: 'SO-2609-035', artworkCode: 'AW-PVC-0295',
    customerName: 'Zydus Lifesciences', materialType: 'PVC', thicknessMicrons: 500,
    targetPiecesQty: 32000,
    formingMachineCode: 'TF-02', cuttingMachineCode: 'PN-01', reelId: 'RL-9251',
    stages: { REEL_ISSUE: 'DONE', FORMING: 'BLOCKED', CUTTING: 'PENDING', SORTING: 'PENDING', PACKING: 'PENDING' },
  },
  {
    jobCardId: 'J05', jobCardNo: 'JC-2609-116', soNumber: 'SO-2609-040', artworkCode: 'AW-PVC-0288',
    customerName: 'Cipla Ltd', materialType: 'PVC', thicknessMicrons: 450,
    targetPiecesQty: 60000,
    formingMachineCode: 'TF-01', cuttingMachineCode: 'PN-02', reelId: null,
    stages: { REEL_ISSUE: 'ACTIVE', FORMING: 'PENDING', CUTTING: 'PENDING', SORTING: 'PENDING', PACKING: 'PENDING' },
  },
  {
    jobCardId: 'J06', jobCardNo: 'JC-2609-112', soNumber: 'SO-2609-033', artworkCode: 'AW-PP-0067',
    customerName: 'Parle Products', materialType: 'PP', thicknessMicrons: 400,
    targetPiecesQty: 75000,
    formingMachineCode: 'TF-02', cuttingMachineCode: 'PN-01', reelId: 'RL-9256',
    stages: { REEL_ISSUE: 'DONE', FORMING: 'DONE', CUTTING: 'ACTIVE', SORTING: 'ACTIVE', PACKING: 'PENDING' },
  },
]

/** Make-ready wastage on the forming line, from the process master. */
const FORMING_WASTE_PCT = 2.5

/**
 * Sheet count and reel weight are derived from the artwork's nesting, never
 * stored. The job card grid and the nesting panel beside it therefore cannot
 * disagree about how much material a job needs.
 */
export const JOB_CARDS: JobCard[] = JOB_CARD_PLANS.map((plan) => {
  const artwork = ARTWORKS.find((a) => a.artworkCode === plan.artworkCode)
  const material = MATERIALS.find((m) => m.materialType === plan.materialType)

  if (!artwork || !material) {
    return { ...plan, requiredSheetsQty: 0, estReelWeightKg: 0, estTrimWasteKg: 0 }
  }

  const nesting = calculateNesting({
    openLengthMm: artwork.openLengthMm,
    openWidthMm: artwork.openWidthMm,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
  })

  const costing = calculateCosting({
    targetPiecesQty: plan.targetPiecesQty,
    upsPerSheet: nesting.upsPerSheet,
    utilisation: nesting.utilisation,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
    thicknessMicrons: plan.thicknessMicrons,
    densityGCm3: material.densityGCm3,
    ratePerKg: material.ratePerKg,
    scrapRatePerKg: material.scrapRatePerKg,
    conversionRatePerPc: 0.85,
    wastePercent: FORMING_WASTE_PCT,
  })

  return {
    ...plan,
    requiredSheetsQty: costing.sheets,
    estReelWeightKg: Number(costing.grossWeightKg.toFixed(1)),
    estTrimWasteKg: Number(costing.skeletonKg.toFixed(1)),
  }
})

/* ============================================================
   Shop-floor actuals.

   Only what somebody physically reads off a machine or a scale is
   stored: sheets counted, pieces counted, weight issued and
   returned. Everything else on the screens is derived from those,
   so consumed weight, grams per sheet and skeleton scrap cannot
   drift away from the counts they came from.
   ============================================================ */

interface RunActuals {
  jobCardNo: string
  reelId: string
  issuedWeightKg: number
  /** Sheets counted off the machine's stroke counter. */
  sheetsFormed: number
  startCounterReading: number
  operator: string
  shift: 'A' | 'B'
  lineClearanceSigned: boolean
  firstPieceQc: 'PENDING' | 'APPROVED' | 'REJECTED'
  /** Sheets fed into the press so far, and the pieces set aside at it. */
  sheetsCut?: number
  rejectedPieces?: number
  cutOperator?: string
  cutClearanceSigned?: boolean
  /** Sorting table: who worked it, what came off, and what is still queued. */
  sorter?: string
  sortRejects?: Record<string, number>
  unsortedPieces?: number
}

const RUNS: RunActuals[] = [
  {
    jobCardNo: 'JC-2609-124', reelId: 'RL-9241', issuedWeightKg: 340.0,
    sheetsFormed: 2104, startCounterReading: 184220,
    operator: 'Anil Kadam', shift: 'A', lineClearanceSigned: true, firstPieceQc: 'APPROVED',
    sheetsCut: 2104, rejectedPieces: 240, cutOperator: 'Dattatray More', cutClearanceSigned: true,
    sorter: 'Kavita Jadhav', unsortedPieces: 0,
    sortRejects: { 'Deformed / Warped': 86, 'Uneven Edges': 41, 'Scratches / Surface Marks': 27 },
  },
  {
    jobCardNo: 'JC-2609-123', reelId: 'RL-9244', issuedWeightKg: 480.0,
    sheetsFormed: 1422, startCounterReading: 91480,
    operator: 'Ramesh Patil', shift: 'B', lineClearanceSigned: true, firstPieceQc: 'APPROVED',
  },
  {
    jobCardNo: 'JC-2609-121', reelId: 'RL-9253', issuedWeightKg: 610.0,
    sheetsFormed: 3062, startCounterReading: 186324,
    operator: 'Anil Kadam', shift: 'A', lineClearanceSigned: true, firstPieceQc: 'APPROVED',
    sheetsCut: 3062, rejectedPieces: 612, cutOperator: 'Dattatray More', cutClearanceSigned: true,
    sorter: 'Nilam Bhoir', unsortedPieces: 0,
    sortRejects: { 'Deformed / Warped': 148, 'Burr Not Removed': 62, 'Colour Variation': 35, 'Cracked / Broken': 21 },
  },
  {
    jobCardNo: 'JC-2609-118', reelId: 'RL-9251', issuedWeightKg: 520.0,
    sheetsFormed: 0, startCounterReading: 0,
    operator: 'Ramesh Patil', shift: 'B', lineClearanceSigned: false, firstPieceQc: 'PENDING',
    sheetsCut: 0, rejectedPieces: 0, cutOperator: 'Dattatray More', cutClearanceSigned: false,
  },
  {
    jobCardNo: 'JC-2609-112', reelId: 'RL-9256', issuedWeightKg: 900.0,
    sheetsFormed: 6390, startCounterReading: 92902,
    operator: 'Ramesh Patil', shift: 'B', lineClearanceSigned: true, firstPieceQc: 'APPROVED',
    sheetsCut: 3312, rejectedPieces: 324, cutOperator: 'Dattatray More', cutClearanceSigned: true,
    sorter: 'Kavita Jadhav', unsortedPieces: 9800,
    sortRejects: { 'Uneven Edges': 74, 'Undersize Depth': 33 },
  },
]

/** Grams of reel a single sheet carries, for the job's material and gauge. */
function sheetWeightG(jobCardNo: string) {
  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const material = MATERIALS.find((m) => m.materialType === job?.materialType)
  if (!job || !material) return 0
  return calculateReelWeight({
    sheets: 1,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
    thicknessMicrons: job.thicknessMicrons,
    densityGCm3: material.densityGCm3,
  }).gramsPerSheet
}

/** The job's nesting, which fixes ups per sheet and the skeleton share. */
function jobNesting(jobCardNo: string) {
  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const artwork = ARTWORKS.find((a) => a.artworkCode === job?.artworkCode)
  if (!artwork) return null
  return calculateNesting({
    openLengthMm: artwork.openLengthMm,
    openWidthMm: artwork.openWidthMm,
    deckleWidthMm: DECKLE_MM,
    bedPitchMm: PLANT.bedLengthMm,
  })
}

const round1 = (n: number) => Number(n.toFixed(1))

export const FORMING_LOGS: FormingLog[] = RUNS.map((run, i) => {
  const consumed = round1((run.sheetsFormed * sheetWeightG(run.jobCardNo)) / 1000)
  return {
    formingLogId: `F0${i + 1}`,
    jobCardNo: run.jobCardNo,
    reelId: run.reelId,
    lineClearanceSigned: run.lineClearanceSigned,
    firstPieceQc: run.firstPieceQc,
    startCounterReading: run.startCounterReading,
    endCounterReading: run.sheetsFormed > 0 ? run.startCounterReading + run.sheetsFormed : 0,
    outputFormedSheets: run.sheetsFormed,
    issuedWeightKg: run.issuedWeightKg,
    returnedReelWeightKg: round1(run.issuedWeightKg - consumed),
    consumedWeightKg: consumed,
    operator: run.operator,
    shift: run.shift,
  }
})

export const CUTTING_LOGS: CuttingLog[] = RUNS.filter(
  (r) => r.sheetsCut !== undefined,
).map((run, i) => {
  const nesting = jobNesting(run.jobCardNo)
  const sheets = run.sheetsCut ?? 0
  const ups = nesting?.upsPerSheet ?? 0
  const rejects = run.rejectedPieces ?? 0
  // Every piece off the die is either good or rejected; nothing vanishes.
  const good = Math.max(sheets * ups - rejects, 0)
  // Skeleton is the trim share of the material those sheets carried.
  const cutKg = (sheets * sheetWeightG(run.jobCardNo)) / 1000
  return {
    cuttingLogId: `P0${i + 1}`,
    jobCardNo: run.jobCardNo,
    lineClearanceSigned: run.cutClearanceSigned ?? false,
    inputFormedSheets: sheets,
    sheetsPerStroke: PLANT.sheetsPerStroke,
    goodPiecesOutput: good,
    rejectedPiecesQty: rejects,
    skeletonScrapWeightKg: round1(cutKg * (nesting?.skeletonFraction ?? 0)),
    operator: run.cutOperator ?? '—',
    shift: run.shift,
  }
})

/**
 * The sorting table. Every piece the press passed is either sorted good or
 * pulled out against a named reason; what has not been through the table yet
 * stays visible as pending rather than quietly counting as good.
 */
export const SORTING_LOGS: SortingLog[] = RUNS.filter((r) => r.sorter !== undefined).map(
  (run, i) => {
    const cut = CUTTING_LOGS.find((c) => c.jobCardNo === run.jobCardNo)
    const input = cut?.goodPiecesOutput ?? 0
    const pending = Math.min(run.unsortedPieces ?? 0, input)
    const sorted = input - pending
    const byReason = run.sortRejects ?? {}
    const rejected = Object.values(byReason).reduce((sum, n) => sum + n, 0)

    return {
      sortingLogId: `SR0${i + 1}`,
      jobCardNo: run.jobCardNo,
      inputPiecesQty: input,
      sortedPiecesQty: sorted,
      rejectedPiecesQty: rejected,
      rejectionByReason: byReason,
      goodPiecesQty: Math.max(sorted - rejected, 0),
      pendingPiecesQty: pending,
      sorter: run.sorter ?? '—',
      shift: run.shift,
      completed: pending === 0,
    }
  },
)

export const IN_PROCESS_CHECKS: InProcessCheck[] = [
  { checkId: 'Q01', jobCardNo: 'JC-2609-124', time: '08:00', inspector: 'Sunita Rane', thicknessMicrons: 301, visualClarity: 'PASS', result: 'PASSED' },
  { checkId: 'Q02', jobCardNo: 'JC-2609-124', time: '09:00', inspector: 'Sunita Rane', thicknessMicrons: 298, visualClarity: 'PASS', result: 'PASSED' },
  { checkId: 'Q03', jobCardNo: 'JC-2609-124', time: '10:00', inspector: 'Sunita Rane', thicknessMicrons: 303, visualClarity: 'PASS', result: 'PASSED' },
  { checkId: 'Q04', jobCardNo: 'JC-2609-124', time: '11:00', inspector: 'Anil Kadam', thicknessMicrons: 296, visualClarity: 'PASS', result: 'PASSED' },
  { checkId: 'Q05', jobCardNo: 'JC-2609-124', time: '12:00', inspector: 'Anil Kadam', thicknessMicrons: 299, visualClarity: 'PASS', result: 'PASSED' },
  { checkId: 'Q06', jobCardNo: 'JC-2609-124', time: '13:00', inspector: 'Anil Kadam', thicknessMicrons: 304, visualClarity: 'PASS', result: 'PASSED' },
  { checkId: 'Q07', jobCardNo: 'JC-2609-124', time: '14:00', inspector: 'Meera Shinde', thicknessMicrons: 297, visualClarity: 'PASS', result: 'PASSED' },
  { checkId: 'Q08', jobCardNo: 'JC-2609-124', time: '15:00', inspector: 'Meera Shinde', thicknessMicrons: 300, visualClarity: 'PASS', result: 'PASSED' },
]

export const COAS: Coa[] = [
  { coaId: 'CA1', coaNumber: 'COA-2609-088', jobCardNo: 'JC-2609-121', customerName: 'Mother Dairy', avgThicknessMicrons: 279.4, depthMm: 41.8, visualClarity: 'PASS', migrationTest: 'CONFORMS', hourlyChecksMatched: '14 / 14', gdpAuditLock: true, releasedOn: '2026-09-09' },
  { coaId: 'CA2', coaNumber: 'COA-2609-087', jobCardNo: 'JC-2609-115', customerName: 'Emami Ltd', avgThicknessMicrons: 597.2, depthMm: 30.1, visualClarity: 'PASS', migrationTest: 'CONFORMS', hourlyChecksMatched: '9 / 9', gdpAuditLock: true, releasedOn: '2026-09-08' },
  { coaId: 'CA3', coaNumber: 'COA-2609-089', jobCardNo: 'JC-2609-124', customerName: 'Vadilal Industries', avgThicknessMicrons: 299.8, depthMm: 27.9, visualClarity: 'PASS', migrationTest: 'CONFORMS', hourlyChecksMatched: '8 / 8', gdpAuditLock: false, releasedOn: null },
]

/** Packing counts follow the press: cartons are whole, the remainder is loose. */
function packedFrom(
  packingId: string,
  jobCardNo: string,
  customerName: string,
  piecesPerCarton: number,
  fgReport: PackingRecord['fgReport'],
): PackingRecord {
  const cut = CUTTING_LOGS.find((p) => p.jobCardNo === jobCardNo)
  const sorting = SORTING_LOGS.find((p) => p.jobCardNo === jobCardNo)
  // Only what the sorting table passed is finished goods.
  const good = sorting?.goodPiecesQty ?? cut?.goodPiecesOutput ?? 0
  return {
    packingId,
    jobCardNo,
    customerName,
    goodPiecesQty: good,
    rejectedPiecesQty: (cut?.rejectedPiecesQty ?? 0) + (sorting?.rejectedPiecesQty ?? 0),
    piecesPerCarton,
    cartons: Math.floor(good / piecesPerCarton),
    loosePieces: good % piecesPerCarton,
    fgReport,
  }
}

export const PACKING_RECORDS: PackingRecord[] = [
  packedFrom('K01', 'JC-2609-124', 'Vadilal Industries', 200, 'PASSED'),
  packedFrom('K02', 'JC-2609-121', 'Mother Dairy', 300, 'PASSED'),
  // Older jobs, closed before this window; their run logs have been archived.
  { packingId: 'K03', jobCardNo: 'JC-2609-119', customerName: 'Himalaya Wellness', goodPiecesQty: 18520, rejectedPiecesQty: 96, piecesPerCarton: 200, cartons: 92, loosePieces: 120, fgReport: 'INSPECTING' },
  { packingId: 'K04', jobCardNo: 'JC-2609-115', customerName: 'Emami Ltd', goodPiecesQty: 12060, rejectedPiecesQty: 44, piecesPerCarton: 200, cartons: 60, loosePieces: 60, fgReport: 'PASSED' },
]

/**
 * Scrap booked against a job is the skeleton the press actually produced plus
 * the weight of the trays it rejected, so the recycling register and the
 * cutting log can never disagree.
 */
function scrapFrom(
  scrapId: string,
  jobCardNo: string,
  route: ScrapEntry['route'],
  transferNote: string,
  date: string,
): ScrapEntry {
  const job = JOB_CARDS.find((j) => j.jobCardNo === jobCardNo)
  const cut = CUTTING_LOGS.find((p) => p.jobCardNo === jobCardNo)
  const nesting = jobNesting(jobCardNo)

  const skeletonKg = cut?.skeletonScrapWeightKg ?? 0
  const gramsPerPiece =
    nesting && nesting.upsPerSheet > 0
      ? (sheetWeightG(jobCardNo) * nesting.utilisation) / nesting.upsPerSheet
      : 0
  const sorting = SORTING_LOGS.find((p) => p.jobCardNo === jobCardNo)
  const rejectedPieces = (cut?.rejectedPiecesQty ?? 0) + (sorting?.rejectedPiecesQty ?? 0)
  const rejectKg = round1((rejectedPieces * gramsPerPiece) / 1000)

  return {
    scrapId,
    jobCardNo,
    materialType: job?.materialType ?? 'PVC',
    skeletonKg,
    rejectKg,
    totalKg: round1(skeletonKg + rejectKg),
    route,
    transferNote,
    date,
  }
}

export const SCRAP_ENTRIES: ScrapEntry[] = [
  scrapFrom('R01', 'JC-2609-124', 'IN_HOUSE', 'RCY-2609-0117', '2026-09-09'),
  scrapFrom('R02', 'JC-2609-121', 'IN_HOUSE', 'RCY-2609-0116', '2026-09-08'),
  scrapFrom('R03', 'JC-2609-112', 'EXTERNAL', 'RCY-2609-0115', '2026-09-08'),
  { scrapId: 'R04', jobCardNo: 'JC-2609-115', materialType: 'PET', skeletonKg: 61.2, rejectKg: 1.2, totalKg: 62.4, route: 'EXTERNAL', transferNote: 'RCY-2609-0113', date: '2026-09-06' },
  { scrapId: 'R05', jobCardNo: 'JC-2609-109', materialType: 'PVC', skeletonKg: 88.4, rejectKg: 5.9, totalKg: 94.3, route: 'IN_HOUSE', transferNote: 'RCY-2609-0111', date: '2026-09-05' },
]

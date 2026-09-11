import type {
  GoodsReceiptNote, GrnLine, QcCharacteristicResult, QcParameter, QcResult, QcSamplePlan,
  RmQcReport, RmQcTab,
} from '@/types/procurement'
import { PLANT } from '@/config/plant'
import { previewNumber } from '@/lib/document-number'
import { CATEGORIES, ITEMS } from './masters-extended'
import { GRNS, PURCHASE_ORDERS } from './procurement'

/* Raw material QC.

   The inspection format is held per item category, so a polymer reel and a
   carton are not asked the same questions and an item nobody configured a
   format for is not asked anything at all. That last case is the auto-approve
   path: nothing to inspect, so the receipt goes straight to the store.

   Nothing here is judged by hand. A characteristic knows how it is measured and
   what it is allowed to be, so pass or fail is derived from the readings the
   inspector typed, never picked from a dropdown. */

// ------------------------------------------------------- QC parameter master

/**
 * Inspection characteristics by category. A format is inherited down the
 * category tree, so everything on `CAT-RM` is asked of a PVC reel as well, and
 * the PVC and PET formats only add what is specific to that polymer.
 */
export const QC_PARAMETERS: QcParameter[] = [
  // ------------------------------------------------ All reels (raw material)
  {
    parameterId: 'QP01', categoryId: 'CT1',
    characteristic: 'Thickness',
    specification: 'Ordered gauge ± 2 %',
    fieldType: 'NUMERIC',
    method: 'Five points across the web, edge to edge',
    measuringEquipment: 'Digital micrometer, 0 to 25 mm',
    uom: 'µm', lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: 2, acceptanceOptions: null,
  },
  {
    parameterId: 'QP02', categoryId: 'CT1',
    characteristic: 'Deckle width',
    specification: 'Matches the ordered deckle',
    fieldType: 'COMBO',
    method: 'Measured across the wound edge',
    measuringEquipment: 'Steel rule, 1 m',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null,
    acceptanceOptions: ['Matches order', 'Narrow', 'Wide'],
  },
  {
    parameterId: 'QP03', categoryId: 'CT1',
    characteristic: 'Weight against challan',
    specification: 'Weighbridge reading matches the delivery note',
    fieldType: 'COMBO',
    method: 'Weighed roll by roll against the challan',
    measuringEquipment: 'Platform scale, 500 kg',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null,
    acceptanceOptions: ['Matches', 'Short', 'Excess'],
  },
  {
    parameterId: 'QP04', categoryId: 'CT1',
    characteristic: 'Visual appearance',
    specification: 'Clear of haze, streaks and contamination',
    fieldType: 'COMBO',
    method: 'Two metres unwound and viewed against the light',
    measuringEquipment: 'Light box, D65',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null,
    acceptanceOptions: ['Clear, no haze', 'Slight haze', 'Haze or streaks', 'Black specks'],
  },
  {
    parameterId: 'QP05', categoryId: 'CT1',
    characteristic: 'Core and winding',
    specification: 'Sound core, evenly wound, edges undamaged',
    fieldType: 'COMBO',
    method: 'Both faces of the roll examined',
    measuringEquipment: 'Visual',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null,
    acceptanceOptions: ['Sound', 'Telescoped', 'Crushed core', 'Edge damage'],
  },
  {
    parameterId: 'QP06', categoryId: 'CT1',
    characteristic: 'Gels and fish eyes',
    specification: 'Not more than 3 per square metre',
    fieldType: 'NUMERIC',
    method: 'Counted over one square metre',
    measuringEquipment: 'Light box, D65',
    uom: 'nos/m²', lowerLimit: 0, upperLimit: 3, nominal: 1,
    tolerancePctOfOrder: null, acceptanceOptions: null,
  },
  {
    parameterId: 'QP07', categoryId: 'CT1',
    characteristic: 'Forming trial',
    specification: 'Sample sheet forms to full depth without webbing',
    fieldType: 'COMBO',
    method: 'Single shot on the sampling die',
    measuringEquipment: 'Sampling die, TF-03',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null,
    acceptanceOptions: ['Forms to depth', 'Webbing', 'Cracks at the corners'],
  },
  {
    parameterId: 'QP08', categoryId: 'CT1',
    characteristic: 'Test certificate enclosed',
    specification: "Supplier's batch certificate received with the consignment",
    fieldType: 'CHECKBOX',
    method: 'Checked against the batch number on the roll label',
    measuringEquipment: 'Document check',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null, acceptanceOptions: null,
  },
  {
    parameterId: 'QP09', categoryId: 'CT1',
    characteristic: "Supplier's batch number",
    specification: 'Recorded as it appears on the roll label',
    fieldType: 'TEXT',
    method: 'Copied from the label, not interpreted',
    measuringEquipment: 'Roll label',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null, acceptanceOptions: null,
  },

  // ---------------------------------------------------------------- PVC only
  {
    parameterId: 'QP20', categoryId: 'CT2',
    characteristic: 'Colour against retained sample',
    specification: 'Within the approved shade band',
    fieldType: 'COMBO',
    method: 'Compared side by side with the retained swatch',
    measuringEquipment: 'Retained swatch, D65 light box',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null,
    acceptanceOptions: ['Matches retain', 'Shade off'],
  },
  {
    parameterId: 'QP21', categoryId: 'CT2',
    characteristic: 'Residual VCM',
    specification: 'Not more than 1 ppm',
    fieldType: 'NUMERIC',
    method: "Read off the supplier's batch certificate",
    measuringEquipment: "Supplier's certificate",
    uom: 'ppm', lowerLimit: 0, upperLimit: 1, nominal: 0.2,
    tolerancePctOfOrder: null, acceptanceOptions: null,
  },

  // ---------------------------------------------------------------- PET only
  {
    parameterId: 'QP30', categoryId: 'CT3',
    characteristic: 'Food grade certificate',
    specification: 'Migration certificate enclosed and in date',
    fieldType: 'COMBO',
    method: 'Checked against the batch number',
    measuringEquipment: 'Document check',
    uom: null, lowerLimit: null, upperLimit: null, nominal: null,
    tolerancePctOfOrder: null,
    acceptanceOptions: ['Enclosed and valid', 'Missing', 'Expired'],
  },
  {
    parameterId: 'QP31', categoryId: 'CT3',
    characteristic: 'Intrinsic viscosity',
    specification: '0.70 to 0.86 dl/g',
    fieldType: 'NUMERIC',
    method: "Read off the supplier's batch certificate",
    measuringEquipment: "Supplier's certificate",
    uom: 'dl/g', lowerLimit: 0.7, upperLimit: 0.86, nominal: 0.78,
    tolerancePctOfOrder: null, acceptanceOptions: null,
  },
]

/**
 * The sampling plan per format. An inspector draws one set of samples and reads
 * every numeric characteristic off that same set, so this belongs to the format
 * rather than to any one characteristic.
 */
export const QC_SAMPLE_PLANS: QcSamplePlan[] = [
  { categoryId: 'CT1', sampleSize: '1 m² per roll', sampleCount: 3 },
  { categoryId: 'CT2', sampleSize: '1 m² per roll', sampleCount: 3 },
  { categoryId: 'CT3', sampleSize: '1 m² per roll, both edges', sampleCount: 5 },
]

/** The plan for an item, falling back to the category above it. */
export function samplePlanFor(itemId: string): QcSamplePlan | null {
  const item = ITEMS.find((i) => i.itemId === itemId)
  if (!item) return null
  for (const categoryId of categoryChain(item.categoryId)) {
    const plan = QC_SAMPLE_PLANS.find((s) => s.categoryId === categoryId)
    if (plan) return plan
  }
  return null
}

/**
 * The gauge the order actually asked for, which is what a measured reading is
 * judged against. Null on an item that was never ordered by thickness.
 */
export function orderedGaugeOf(poNumber: string, poLineId: string): number | null {
  const po = PURCHASE_ORDERS.find((o) => o.poNumber === poNumber)
  return po?.lines.find((l) => l.lineId === poLineId)?.thicknessMicrons ?? null
}

/** The category and every category above it, nearest first. */
function categoryChain(categoryId: string): string[] {
  const chain: string[] = []
  let current: string | null = categoryId
  while (current) {
    chain.push(current)
    current = CATEGORIES.find((c) => c.categoryId === current)?.parentCategoryId ?? null
  }
  return chain
}

/**
 * The inspection format for an item: its own category's characteristics plus
 * everything inherited from the categories above it. An empty list means the
 * item is not inspected at all, which is what puts a receipt on the
 * auto-approve path.
 */
export function qcParametersFor(itemId: string): QcParameter[] {
  const item = ITEMS.find((i) => i.itemId === itemId)
  if (!item) return []
  const chain = categoryChain(item.categoryId)
  // Broadest first, so a reel reads thickness before the polymer specifics.
  return [...chain].reverse().flatMap((id) => QC_PARAMETERS.filter((p) => p.categoryId === id))
}

/** Whether anything is configured to be inspected against this item. */
export function itemNeedsQc(itemId: string) {
  return qcParametersFor(itemId).length > 0
}

// ------------------------------------------------------------------ Judging

/**
 * Pass or fail for one characteristic, from what was measured rather than from
 * an opinion. A numeric characteristic fails if any single reading falls
 * outside the limits, not merely if the average does, since one thin patch on
 * the web is enough to break a forming run.
 */
export function judgeCharacteristic(
  parameter: QcParameter,
  readings: number[],
  /** The answer given: a chosen option, a tick, or recorded text. */
  acceptanceStatus: string | null,
  /** What the order asked for, where the limits are relative to it. */
  orderedValue: number | null,
): QcResult {
  // A recorded observation is evidence, not a verdict, so it never fails.
  if (parameter.fieldType === 'TEXT') return 'PASS'

  if (parameter.fieldType === 'CHECKBOX') return acceptanceStatus === 'Yes' ? 'PASS' : 'FAIL'

  if (parameter.fieldType === 'COMBO') {
    // The first option is the acceptable answer; anything else is a finding.
    return acceptanceStatus === parameter.acceptanceOptions?.[0] ? 'PASS' : 'FAIL'
  }

  if (readings.length === 0) return 'FAIL'

  let lower = parameter.lowerLimit
  let upper = parameter.upperLimit
  if (parameter.tolerancePctOfOrder !== null) {
    if (orderedValue) {
      const slack = (orderedValue * parameter.tolerancePctOfOrder) / 100
      lower = orderedValue - slack
      upper = orderedValue + slack
    } else {
      /* Nothing on the order to measure against, so the plant's own limits
         apply rather than nothing at all. */
      lower = PLANT.minMicrons
      upper = PLANT.maxMicrons
    }
  }

  return readings.every(
    (r) => (lower === null || r >= lower) && (upper === null || r <= upper),
  )
    ? 'PASS'
    : 'FAIL'
}

export function average(readings: number[]) {
  if (readings.length === 0) return 0
  return Number((readings.reduce((s, r) => s + r, 0) / readings.length).toFixed(2))
}

/** The report's verdict is the worst of its characteristics. */
export function overallOf(characteristics: QcCharacteristicResult[]): QcResult {
  return characteristics.some((c) => c.result === 'FAIL') ? 'FAIL' : 'PASS'
}

// -------------------------------------------------------------- QC reports

interface Finding {
  /** Readings or the chosen answer that made this characteristic fail. */
  readings?: number[]
  acceptanceStatus?: string
  remark: string
}

/**
 * Builds the record an inspector would have left behind: a reading for every
 * characteristic in the item's format, sitting on the nominal unless the run
 * had a finding against it. Readings are fixed offsets rather than random ones
 * so the same page renders the same on the server and in the browser.
 */
function report(
  qcNumber: string,
  lineId: string,
  inspectedOn: string,
  inspectedByUserId: string,
  sampleCount: number,
  findings: Record<string, Finding> = {},
  remarks = '',
): RmQcReport {
  const grn = GRNS.find((g) => g.lines.some((l) => l.lineId === lineId))
  const line = grn?.lines.find((l) => l.lineId === lineId)
  if (!grn || !line) throw new Error(`No GRN line ${lineId} for QC report ${qcNumber}`)

  const offsets = [-1, 0, 1, 2, -2]
  const characteristics: QcCharacteristicResult[] = qcParametersFor(line.itemId).map((p) => {
    const finding = findings[p.parameterId]

    if (p.fieldType !== 'NUMERIC') {
      const answered =
        p.fieldType === 'COMBO'
          ? (p.acceptanceOptions?.[0] ?? '')
          : p.fieldType === 'CHECKBOX'
            ? 'Yes'
            : `${line.reelId ?? grn.supplierChallanNo}/B`
      const status = finding?.acceptanceStatus ?? answered
      return {
        parameterId: p.parameterId,
        readings: [],
        acceptanceStatus: status,
        result: judgeCharacteristic(p, [], status, null),
        remark: finding?.remark ?? '',
      }
    }

    // Thickness reads off the roll itself; everything else off its nominal.
    const base = p.tolerancePctOfOrder !== null ? (line.thicknessMicrons ?? 0) : (p.nominal ?? 0)
    const step = p.tolerancePctOfOrder !== null ? 1 : 0
    const readings =
      finding?.readings ??
      Array.from({ length: sampleCount }, (_, i) => Number((base + offsets[i % 5] * step).toFixed(2)))

    return {
      parameterId: p.parameterId,
      readings,
      acceptanceStatus: null,
      result: judgeCharacteristic(p, readings, null, orderedGaugeOf(grn.poNumber, line.poLineId)),
      remark: finding?.remark ?? '',
    }
  })

  return {
    qcNumber,
    grnNumber: grn.grnNumber,
    grnLineId: lineId,
    itemId: line.itemId,
    reelId: line.reelId,
    inspectedOn,
    inspectedByUserId,
    sampleSize: '1 m² per roll',
    sampleCount,
    characteristics,
    overallResult: overallOf(characteristics),
    remarks,
  }
}

/**
 * One report per GRN line that has been inspected. The numbers here are the
 * ones the receipt lines carry, so an approved quantity can always be traced
 * back to the readings that let it through.
 */
export const RM_QC_REPORTS: RmQcReport[] = [
  report('RMQC-2609-0071', 'G1L1', '2026-09-04', 'U04', 3),
  report('RMQC-2609-0072', 'G1L2', '2026-09-04', 'U04', 3),
  report('RMQC-2609-0074', 'G3L1', '2026-09-07', 'U04', 5, {
    QP01: { readings: [243, 242, 244, 243, 241], remark: 'Gauge 243 µm against 250 ordered, outside the 5 % band' },
  }, 'Held for a supplier decision: usable gauge, but not what was ordered'),
  report('RMQC-2609-0075', 'G3L2', '2026-09-07', 'U04', 5, {
    QP01: { readings: [598, 597, 599, 598, 600], remark: 'Wrong gauge supplied, 598 µm against 250 ordered' },
    QP02: { acceptanceStatus: 'Narrow', remark: '600 mm deckle received against 600 ordered, but on the wrong reel spec' },
  }, 'Wrong material against the order, held pending the supplier reply'),
  report('RMQC-2609-0076', 'G4L1', '2026-09-07', 'U04', 5, {
    QP01: { readings: [176, 175, 177, 174, 176], remark: 'Below the 180 µm plant floor, cannot be formed' },
    QP07: { acceptanceStatus: 'Cracks at the corners', remark: 'Sample sheet split at both deep corners' },
  }, 'Rejected outright and returned to the supplier'),
  report('RMQC-2609-0078', 'G2L1', '2026-09-08', 'U04', 3),
  report('RMQC-2609-0079', 'G5L1', '2026-09-08', 'U04', 3),
  report('RMQC-2609-0080', 'G6L1', '2026-09-09', 'U04', 3),
  report('RMQC-2609-0081', 'G8L1', '2026-09-09', 'U05', 5, {
    QP04: { acceptanceStatus: 'Slight haze', remark: 'Haze on the outer wraps only, core wraps clear' },
  }, '380 kg released, 80 kg held against the haze query, 40 kg returned'),
]

export function qcReport(qcNumber: string | null) {
  return qcNumber ? (RM_QC_REPORTS.find((r) => r.qcNumber === qcNumber) ?? null) : null
}

export function qcReportForLine(lineId: string) {
  return RM_QC_REPORTS.find((r) => r.grnLineId === lineId) ?? null
}

/** Next number in the series, from the prefix master. */
export function nextQcNumber() {
  return previewNumber(
    'RM_QC',
    RM_QC_REPORTS.map((r) => r.qcNumber),
  )
}

// ----------------------------------------------------------------- QC tabs

/**
 * Where a line shows on the QC screen. It follows the two facts the line
 * carries and nothing else: whether QC has finalised it, and what stayed back.
 * A line QC never had to touch — auto-approved, so approved but with no report
 * number — belongs on no tab at all.
 */
export function rmQcTabOfLine(line: GrnLine): RmQcTab | null {
  if (!line.isQcApproved && !line.qcNumber) return 'PENDING'
  if (!line.qcNumber) return null
  if (line.rejectedQty > 0) return 'REJECTED'
  if (line.holdQty > 0) return 'HOLD'
  return 'PROCESSED'
}

/** A receipt shows on every tab any of its lines lands on. */
export function rmQcTabsOfGrn(grn: GoodsReceiptNote): RmQcTab[] {
  return [...new Set(grn.lines.map(rmQcTabOfLine).filter((t): t is RmQcTab => t !== null))]
}

export function grnsForRmQcTab(tab: RmQcTab) {
  return GRNS.filter((g) => rmQcTabsOfGrn(g).includes(tab))
}

/** The lines a QC screen works on for a given tab. */
export function rmQcLinesOf(grn: GoodsReceiptNote, tab: RmQcTab) {
  return grn.lines.filter((l) => rmQcTabOfLine(l) === tab)
}

/** Everything still waiting on an inspection, across all receipts. */
export function pendingQcLines() {
  return GRNS.flatMap((g) => g.lines.filter((l) => rmQcTabOfLine(l) === 'PENDING'))
}

/** Quantity sitting on hold, which is stock the plant paid for but cannot use. */
export function heldQty() {
  return Number(
    GRNS.flatMap((g) => g.lines).reduce((s, l) => s + l.holdQty, 0).toFixed(1),
  )
}

export function rejectedQty() {
  return Number(
    GRNS.flatMap((g) => g.lines).reduce((s, l) => s + l.rejectedQty, 0).toFixed(1),
  )
}

/* ============================================================
   Open-layout nesting and costing engine.

   Takes the 2D expanded (unformed) dimensions of a tray and works
   out how many cavities nest on the forming bed, then converts that
   into reel weight in kilograms - the unit everything is bought,
   issued and costed in. This replaces the manual Excel sheet.
   ============================================================ */

export interface NestingInput {
  /** 2D expanded open layout of one tray, in millimetres. */
  openLengthMm: number
  openWidthMm: number
  /** Reel deckle width and the bed pitch per stroke, in millimetres. */
  deckleWidthMm: number
  bedPitchMm: number
  /** Minimum gap between cavities and at the sheet edge. */
  gutterMm?: number
  edgeMarginMm?: number
}

export interface NestingResult {
  across: number
  down: number
  upsPerSheet: number
  /** Fraction of the sheet occupied by cavities, 0-1. */
  utilisation: number
  skeletonFraction: number
  /** Position of every cavity, for the nesting drawing. */
  positions: { x: number; y: number; w: number; h: number }[]
  rotated: boolean
}

function nestOneOrientation(
  cavityW: number,
  cavityH: number,
  sheetW: number,
  sheetH: number,
  gutter: number,
  margin: number,
) {
  const usableW = sheetW - 2 * margin
  const usableH = sheetH - 2 * margin
  const across = Math.floor((usableW + gutter) / (cavityW + gutter))
  const down = Math.floor((usableH + gutter) / (cavityH + gutter))
  return { across: Math.max(across, 0), down: Math.max(down, 0) }
}

/**
 * Nests the tray both ways round on the sheet and keeps whichever
 * orientation yields more ups, which is what the planner would do by hand.
 */
export function calculateNesting(input: NestingInput): NestingResult {
  const {
    openLengthMm,
    openWidthMm,
    deckleWidthMm,
    bedPitchMm,
    gutterMm = 8,
    edgeMarginMm = 8,
  } = input

  const upright = nestOneOrientation(
    openLengthMm, openWidthMm, deckleWidthMm, bedPitchMm, gutterMm, edgeMarginMm,
  )
  const turned = nestOneOrientation(
    openWidthMm, openLengthMm, deckleWidthMm, bedPitchMm, gutterMm, edgeMarginMm,
  )

  const useTurned = turned.across * turned.down > upright.across * upright.down
  const { across, down } = useTurned ? turned : upright
  const cavityW = useTurned ? openWidthMm : openLengthMm
  const cavityH = useTurned ? openLengthMm : openWidthMm

  // Spread the leftover evenly so the drawing matches how the die is set.
  const spanW = across * cavityW
  const spanH = down * cavityH
  const gapX = across > 1 ? (deckleWidthMm - spanW) / (across + 1) : (deckleWidthMm - spanW) / 2
  const gapY = down > 1 ? (bedPitchMm - spanH) / (down + 1) : (bedPitchMm - spanH) / 2

  const positions: NestingResult['positions'] = []
  for (let r = 0; r < down; r++) {
    for (let c = 0; c < across; c++) {
      positions.push({
        x: gapX + c * (cavityW + gapX),
        y: gapY + r * (cavityH + gapY),
        w: cavityW,
        h: cavityH,
      })
    }
  }

  const sheetArea = deckleWidthMm * bedPitchMm
  const cavityArea = across * down * cavityW * cavityH
  const utilisation = sheetArea > 0 ? cavityArea / sheetArea : 0

  return {
    across,
    down,
    upsPerSheet: across * down,
    utilisation,
    skeletonFraction: 1 - utilisation,
    positions,
    rotated: useTurned,
  }
}

export interface WeightInput {
  sheets: number
  deckleWidthMm: number
  bedPitchMm: number
  thicknessMicrons: number
  /** Polymer density in g/cm3 - PVC 1.38, PET 1.38, HIPS 1.05, PP 0.91. */
  densityGCm3: number
}

export interface WeightResult {
  gramsPerSheet: number
  grossWeightKg: number
  reelLengthM: number
}

export function calculateReelWeight(input: WeightInput): WeightResult {
  const { sheets, deckleWidthMm, bedPitchMm, thicknessMicrons, densityGCm3 } = input
  // mm x mm x micron -> cm3:  (mm/10) * (mm/10) * (micron/10000)
  const volumeCm3 = (deckleWidthMm / 10) * (bedPitchMm / 10) * (thicknessMicrons / 10000)
  const gramsPerSheet = volumeCm3 * densityGCm3
  return {
    gramsPerSheet,
    grossWeightKg: (gramsPerSheet * sheets) / 1000,
    reelLengthM: (sheets * bedPitchMm) / 1000,
  }
}

export interface CostingInput {
  targetPiecesQty: number
  upsPerSheet: number
  utilisation: number
  deckleWidthMm: number
  bedPitchMm: number
  thicknessMicrons: number
  densityGCm3: number
  ratePerKg: number
  scrapRatePerKg: number
  conversionRatePerPc: number
  /**
   * Make-ready and process wastage, as a percentage of the run. Sheets are
   * scrapped bringing the heater profile and the die up to temperature, so a
   * job needs more sheets than the piece count alone implies. Forming runs
   * about 2.5 %, punching about 1 %.
   */
  wastePercent?: number
}

export interface CostingResult {
  sheets: number
  /** Sheets needed for the piece count alone, before make-ready wastage. */
  netSheets: number
  wasteSheets: number
  gramsPerSheet: number
  grossWeightKg: number
  reelLengthM: number
  skeletonKg: number
  netProductKg: number
  gramsPerPiece: number
  materialCost: number
  scrapRecovery: number
  conversionCost: number
  totalCost: number
  costPerPiece: number
}

/** Full job costing, derived end to end from the open layout. */
export function calculateCosting(input: CostingInput): CostingResult {
  const netSheets = Math.ceil(input.targetPiecesQty / Math.max(input.upsPerSheet, 1))
  const wasteSheets = Math.ceil(netSheets * ((input.wastePercent ?? 0) / 100))
  const sheets = netSheets + wasteSheets

  const { gramsPerSheet, grossWeightKg, reelLengthM } = calculateReelWeight({
    sheets,
    deckleWidthMm: input.deckleWidthMm,
    bedPitchMm: input.bedPitchMm,
    thicknessMicrons: input.thicknessMicrons,
    densityGCm3: input.densityGCm3,
  })

  /* Only the sheets that reach the die yield product. Make-ready sheets are
     scrapped whole, so they land in skeleton rather than in net product. */
  const goodSheetsWeightKg = (gramsPerSheet * netSheets) / 1000
  const netProductKg = goodSheetsWeightKg * input.utilisation
  const skeletonKg = grossWeightKg - netProductKg
  const producedPieces = netSheets * input.upsPerSheet
  const gramsPerPiece = producedPieces > 0 ? (netProductKg * 1000) / producedPieces : 0

  const materialCost = grossWeightKg * input.ratePerKg
  const scrapRecovery = skeletonKg * input.scrapRatePerKg
  const conversionCost = input.targetPiecesQty * input.conversionRatePerPc
  const totalCost = materialCost - scrapRecovery + conversionCost

  return {
    sheets,
    netSheets,
    wasteSheets,
    gramsPerSheet,
    grossWeightKg,
    reelLengthM,
    skeletonKg,
    netProductKg,
    gramsPerPiece,
    materialCost,
    scrapRecovery,
    conversionCost,
    totalCost,
    costPerPiece: input.targetPiecesQty > 0 ? totalCost / input.targetPiecesQty : 0,
  }
}

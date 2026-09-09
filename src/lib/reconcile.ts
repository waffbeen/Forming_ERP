import { FORMING_LOGS, CUTTING_LOGS } from '@/data'

export interface Reconciliation {
  /** Reel weight carried by the sheets that were actually cut. */
  consumedKg: number
  goodKg: number
  skeletonKg: number
  rejectKg: number
  gramsPerPiece: number
  piecesAccounted: number
  varianceKg: number
}

/**
 * Reconciles one job's cut output against the material those sheets
 * carried.
 *
 * The basis is the cut sheets, not the whole forming run: while cutting is
 * still in progress the press has only consumed part of what forming produced,
 * and reconciling against the full run would show a false shortfall.
 */
export function reconcileJob(jobCardNo: string): Reconciliation | null {
  const forming = FORMING_LOGS.find((f) => f.jobCardNo === jobCardNo)
  const cutting = CUTTING_LOGS.find((p) => p.jobCardNo === jobCardNo)
  if (!forming || !cutting || forming.outputFormedSheets === 0 || cutting.inputFormedSheets === 0) {
    return null
  }

  const gramsPerSheet = (forming.consumedWeightKg * 1000) / forming.outputFormedSheets
  const consumedKg = (gramsPerSheet * cutting.inputFormedSheets) / 1000

  const piecesAccounted = cutting.goodPiecesOutput + cutting.rejectedPiecesQty
  const skeletonKg = cutting.skeletonScrapWeightKg
  const gramsPerPiece = piecesAccounted > 0 ? ((consumedKg - skeletonKg) * 1000) / piecesAccounted : 0
  const rejectKg = (cutting.rejectedPiecesQty * gramsPerPiece) / 1000
  const goodKg = consumedKg - skeletonKg - rejectKg

  return {
    consumedKg,
    goodKg,
    skeletonKg,
    rejectKg,
    gramsPerPiece,
    piecesAccounted,
    varianceKg: consumedKg - goodKg - skeletonKg - rejectKg,
  }
}

import { FORMING_LOGS, PUNCHING_LOGS } from '@/data'

export interface Reconciliation {
  /** Reel weight carried by the sheets that were actually punched. */
  consumedKg: number
  goodKg: number
  skeletonKg: number
  rejectKg: number
  gramsPerPiece: number
  piecesAccounted: number
  varianceKg: number
}

/**
 * Reconciles one job's punched output against the material those sheets
 * carried.
 *
 * The basis is the punched sheets, not the whole forming run: while punching is
 * still in progress the press has only consumed part of what forming produced,
 * and reconciling against the full run would show a false shortfall.
 */
export function reconcileJob(jobCardNo: string): Reconciliation | null {
  const forming = FORMING_LOGS.find((f) => f.jobCardNo === jobCardNo)
  const punching = PUNCHING_LOGS.find((p) => p.jobCardNo === jobCardNo)
  if (!forming || !punching || forming.outputFormedSheets === 0 || punching.inputFormedSheets === 0) {
    return null
  }

  const gramsPerSheet = (forming.consumedWeightKg * 1000) / forming.outputFormedSheets
  const consumedKg = (gramsPerSheet * punching.inputFormedSheets) / 1000

  const piecesAccounted = punching.goodPiecesOutput + punching.rejectedPiecesQty
  const skeletonKg = punching.skeletonScrapWeightKg
  const gramsPerPiece = piecesAccounted > 0 ? ((consumedKg - skeletonKg) * 1000) / piecesAccounted : 0
  const rejectKg = (punching.rejectedPiecesQty * gramsPerPiece) / 1000
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

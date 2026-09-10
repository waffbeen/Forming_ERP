import type { MaterialType, QcStatus, Reel } from '@/types'
import { BINS, ITEMS, SUPPLIERS } from './masters-extended'
import { GRNS, STOCK_MOVEMENTS } from './procurement'
import { DECKLE_MM } from '@/config/plant'

/* ============================================================
   Reel stock.

   A reel does not exist because somebody typed it into a master. It
   exists because it arrived on a lorry, was weighed, and was written
   onto a goods receipt. So the reel register is the receipt lines that
   carried a roll, and nothing else can put a reel on the floor.

   Everything about a reel therefore has one home: the polymer and the
   deckle come from the item it was ordered against, the gauge and the
   weighed quantity from the receipt line, the QC outcome from the
   inspection of that line, and what is left on the roll from the
   movements booked against it. None of it is stored twice, so the
   register cannot drift away from the receipt it came from.
   ============================================================ */

/** A receipt line is QC's word on the roll; a line nobody has inspected is held. */
const QC_STATUS: Record<string, QcStatus> = {
  APPROVED: 'APPROVED',
  QUARANTINE: 'QUARANTINE',
  REJECTED: 'REJECTED',
  PENDING_QC: 'QUARANTINE',
}

/**
 * What is physically left on a roll.
 *
 * The receipt says what arrived; issues and returns say what has since left
 * the store and come back. Receipt movements are skipped because they would
 * double-count what arrived, and they only ever carry the approved quantity,
 * which is not the same as what is on the roll.
 */
function balanceOnReel(reelId: string, receivedQty: number) {
  const moved = STOCK_MOVEMENTS.filter(
    (m) => m.reelId === reelId && m.kind !== 'GRN_RECEIPT',
  ).reduce((sum, m) => sum + m.quantity, 0)
  return Number(Math.max(receivedQty + moved, 0).toFixed(1))
}

export const REELS: Reel[] = GRNS.flatMap((grn) =>
  grn.lines
    .filter((line) => line.reelId)
    .map((line) => {
      const item = ITEMS.find((i) => i.itemId === line.itemId)
      const bin = BINS.find((b) => b.binId === line.binId)
      const supplier = SUPPLIERS.find((s) => s.supplierId === grn.supplierId)

      return {
        reelId: line.reelId as string,
        grnNumber: grn.grnNumber,
        materialType: (item?.materialType ?? 'PVC') as MaterialType,
        thicknessMicrons: line.thicknessMicrons ?? 0,
        deckleWidthMm: item?.deckleWidthMm ?? DECKLE_MM,
        grossWeightKg: line.receivedQty,
        netWeightKg: balanceOnReel(line.reelId as string, line.receivedQty),
        qcStatus: QC_STATUS[line.qcStatus] ?? 'QUARANTINE',
        storageLocation: bin ? `${bin.binCode} — ${bin.binName}` : 'Awaiting put-away',
        receivedOn: grn.grnDate,
        supplier: supplier?.supplierName ?? '—',
      }
    }),
).sort((a, b) => b.receivedOn.localeCompare(a.receivedOn))

// ------------------------------------------------------------------ Helpers

/** The receipt a reel arrived on, for anyone asking where it came from. */
export function receiptForReel(reelId: string) {
  return GRNS.find((grn) => grn.lines.some((line) => line.reelId === reelId)) ?? null
}

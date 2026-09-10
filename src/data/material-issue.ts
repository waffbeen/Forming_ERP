import type { MaterialIssue } from '@/types/procurement'
import { ITEMS } from './masters-extended'
import { GRNS, STOCK_MOVEMENTS } from './procurement'
import { JOB_CARDS } from './transactions'

/* Material issue.

   This is the only door between the store and a machine. An issue can draw on
   nothing but QC-approved stock, and it always names the job card the material
   is going to, so forming can be refused on a job the store never issued
   against. Every issue is one ISSUE_TO_JOB movement in the ledger, which is why
   the register and the stock balance can never tell different stories. */

/**
 * What was issued against each job card. The receipt and inspection numbers are
 * carried on the issue rather than looked up later, so a formed tray can be
 * traced back to the roll, the receipt and the readings that let it in.
 */
export const MATERIAL_ISSUES: MaterialIssue[] = [
  {
    issueId: 'MI1', issueNo: 'MI-2609-0311', issuedOn: '2026-09-08', jobCardNo: 'JC-2609-124',
    itemId: 'IT1', reelId: 'RL-9241', binId: 'BN1', quantity: 340,
    grnNumber: 'GRN-2609-0188', qcNumber: 'RMQC-2609-0071',
    issuedByUserId: 'U10', issuedToEmployee: 'Anil Kadam', remarks: 'Full roll to TF-01',
  },
  {
    issueId: 'MI2', issueNo: 'MI-2609-0312', issuedOn: '2026-09-08', jobCardNo: 'JC-2609-121',
    itemId: 'IT4', reelId: 'RL-9253', binId: 'BN1', quantity: 610,
    grnNumber: 'GRN-2609-0201', qcNumber: 'RMQC-2609-0078',
    issuedByUserId: 'U10', issuedToEmployee: 'Ramesh Patil', remarks: 'Full roll to TF-01',
  },
  {
    issueId: 'MI3', issueNo: 'MI-2609-0313', issuedOn: '2026-09-09', jobCardNo: 'JC-2609-112',
    itemId: 'IT11', reelId: 'RL-9256', binId: 'BN1', quantity: 900,
    grnNumber: 'GRN-2609-0204', qcNumber: 'RMQC-2609-0080',
    issuedByUserId: 'U10', issuedToEmployee: 'Ramesh Patil', remarks: 'Full roll to TF-02',
  },
  {
    issueId: 'MI4', issueNo: 'MI-2609-0316', issuedOn: '2026-09-08', jobCardNo: 'JC-2609-118',
    itemId: 'IT2', reelId: 'RL-9251', binId: 'BN1', quantity: 520,
    grnNumber: 'GRN-2609-0199', qcNumber: 'RMQC-2609-0079',
    issuedByUserId: 'U10', issuedToEmployee: 'Anil Kadam', remarks: 'Issued ahead of the shift, job still held at line clearance',
  },
  {
    /* Packing material needs no inspection number: nothing is configured
       against the packing category, so the receipt auto-approved. */
    issueId: 'MI5', issueNo: 'MI-2609-0314', issuedOn: '2026-09-06', jobCardNo: 'JC-2609-121',
    itemId: 'IT5', reelId: null, binId: 'BN5', quantity: 300,
    grnNumber: 'GRN-2609-0207', qcNumber: null,
    issuedByUserId: 'U10', issuedToEmployee: 'Kavita Jadhav', remarks: 'Cartons for the first dispatch lot',
  },
  {
    issueId: 'MI6', issueNo: 'MI-2609-0315', issuedOn: '2026-09-09', jobCardNo: 'JC-2609-124',
    itemId: 'IT5', reelId: null, binId: 'BN5', quantity: 125,
    grnNumber: 'GRN-2609-0207', qcNumber: null,
    issuedByUserId: 'U10', issuedToEmployee: 'Kavita Jadhav', remarks: 'Balance cartons',
  },
]

export function materialIssuesFor(jobCardNo: string) {
  return MATERIAL_ISSUES.filter((i) => i.jobCardNo === jobCardNo)
}

/** Raw material only: cartons and tape do not let a forming run start. */
export function reelIssuesFor(jobCardNo: string) {
  return materialIssuesFor(jobCardNo).filter(
    (i) => ITEMS.find((it) => it.itemId === i.itemId)?.itemType === 'RAW_MATERIAL',
  )
}

/**
 * The forming gate. A run cannot be posted against a job card the store has not
 * issued a reel to, which is what keeps uninspected material off the machine.
 */
export function isReelIssued(jobCardNo: string) {
  return reelIssuesFor(jobCardNo).length > 0
}

/** Job cards waiting on the store before forming can start. */
export function jobsAwaitingIssue() {
  return JOB_CARDS.filter((j) => j.stages.FORMING !== 'DONE' && !isReelIssued(j.jobCardNo))
}

/**
 * What is free to issue, bin by bin: QC-approved balance only, so held and
 * rejected quantities can never be handed to the floor by mistake.
 *
 * The balance comes off the movement ledger, which already counts nothing but
 * approved receipts, and nets off what has been issued out of that bin.
 */
export function issuableStock() {
  const map = new Map<string, { itemId: string; binId: string; quantity: number }>()
  for (const move of STOCK_MOVEMENTS) {
    const key = `${move.itemId}|${move.binId}`
    const current = map.get(key) ?? { itemId: move.itemId, binId: move.binId, quantity: 0 }
    current.quantity += move.quantity
    map.set(key, current)
  }
  return [...map.values()]
    .filter((b) => b.quantity > 0)
    .map((b) => ({ ...b, quantity: Number(b.quantity.toFixed(1)) }))
}

/**
 * Reels that may be issued: approved by QC, received against a receipt, and not
 * already on a machine. A reel held or rejected at QC never appears here, which
 * is the whole point of the gate.
 */
export function issuableReels() {
  const issued = new Set(MATERIAL_ISSUES.map((i) => i.reelId).filter(Boolean))
  return GRNS.flatMap((grn) =>
    grn.lines
      .filter((l) => l.isQcApproved && l.approvedQty > 0 && l.reelId && !issued.has(l.reelId))
      .map((l) => ({
        reelId: l.reelId as string,
        itemId: l.itemId,
        binId: l.binId as string,
        quantity: l.approvedQty,
        thicknessMicrons: l.thicknessMicrons,
        grnNumber: grn.grnNumber,
        qcNumber: l.qcNumber,
      })),
  )
}

/** Next issue number, the way the prefix master would hand one out. */
export function nextIssueNo() {
  const last = MATERIAL_ISSUES.map((i) => Number(i.issueNo.slice(-4))).reduce((a, b) => Math.max(a, b), 0)
  return `MI-2609-${String(last + 1).padStart(4, '0')}`
}

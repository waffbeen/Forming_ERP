import type { NonConformance } from '@/types/non-conformance'

/* The register as it stands today: what each QC gate caught, and how far the
   supervisor has got with closing it out. */

export const NON_CONFORMANCES: NonConformance[] = [
  {
    ncId: 'NC1',
    ncNumber: 'NC/2609/001',
    raisedOn: '2026-09-09',
    source: 'In-process check',
    jobCardNo: 'JC-2609-124',
    grnNumber: '',
    section: 'FORMING',
    parameter: 'Webbing / Bridging',
    description:
      'Check 4 at 11:00 found webbing at the corners of the outer row. Heater zone 22 had drifted 9 °C below the profile.',
    qtyAffected: 340,
    qtyUom: 'sheets',
    severity: 'MAJOR',
    disposition: 'Reject to recycling',
    rootCause: 'Zone 22 heater element ageing; the controller held setpoint but the element under-delivered.',
    correctiveAction: 'Element replaced and the profile re-run; the following checks are clean.',
    preventiveAction:
      'Zone elements added to the monthly preventive maintenance sheet with a resistance reading logged per zone.',
    raisedBy: 'Anil Kadam',
    responsible: 'Yuvraj Bhaigude',
    targetDate: '2026-09-12',
    status: 'CLOSED',
    closedBy: 'Swapnil P',
    closedOn: '2026-09-09',
  },
  {
    ncId: 'NC2',
    ncNumber: 'NC/2609/002',
    raisedOn: '2026-09-09',
    source: 'In-process check',
    jobCardNo: 'JC-2609-124',
    grnNumber: '',
    section: 'CUTTING',
    parameter: 'Burr Formation',
    description: 'Check 2 at 14:30 found burr on the long edge across the right-hand gang of the die.',
    qtyAffected: 1200,
    qtyUom: 'pieces',
    severity: 'MINOR',
    disposition: 'Rework',
    rootCause: 'Cutting die edge dulled on the right gang after roughly 40 000 strokes since the last grind.',
    correctiveAction: 'Die pulled and reground; affected pieces de-burred at the sorting table.',
    preventiveAction: '',
    raisedBy: 'Meera Shinde',
    responsible: 'Yuvraj Bhaigude',
    targetDate: '2026-09-13',
    status: 'IN_PROGRESS',
    closedBy: '',
    closedOn: null,
  },
  {
    ncId: 'NC3',
    ncNumber: 'NC/2609/003',
    raisedOn: '2026-09-08',
    source: 'Incoming QC (IQC)',
    jobCardNo: '',
    grnNumber: 'GRN-2609-0042',
    section: 'STORES',
    parameter: 'Thickness',
    description:
      'Two rolls measured 171 µm against an ordered 180 µm, below the plant floor of 180 µm as well as the ± 2 % band.',
    qtyAffected: 842.5,
    qtyUom: 'kg',
    severity: 'CRITICAL',
    disposition: 'Return to supplier',
    rootCause: '',
    correctiveAction: 'Rolls moved to the rejected area and a debit note raised against the supplier.',
    preventiveAction: '',
    raisedBy: 'Sunita Rane',
    responsible: 'Swapnil P',
    targetDate: '2026-09-15',
    status: 'OPEN',
    closedBy: '',
    closedOn: null,
  },
  {
    ncId: 'NC4',
    ncNumber: 'NC/2609/004',
    raisedOn: '2026-09-07',
    source: 'Sorting',
    jobCardNo: 'JC-2609-121',
    grnNumber: '',
    section: 'SORTING',
    parameter: 'Contamination / Foreign Particle',
    description: 'Black specks visible in the base of trays pulled at the sorting table, roughly one in four hundred.',
    qtyAffected: 260,
    qtyUom: 'pieces',
    severity: 'MAJOR',
    disposition: 'Reject to recycling',
    rootCause: 'Carry-over of regrind at the extruder, confirmed against the supplier batch.',
    correctiveAction: 'Balance of the batch quarantined and the supplier asked for a purge record.',
    preventiveAction: 'Gels and fish-eye count added to the IQC format for this supplier on every receipt.',
    raisedBy: 'Sunita Rane',
    responsible: 'Swapnil P',
    targetDate: '2026-09-11',
    status: 'CLOSED',
    closedBy: 'Swapnil P',
    closedOn: '2026-09-08',
  },
]

/** Anything still holding a job card, which is what blocks a close or a COA. */
export function openNcsFor(jobCardNo: string) {
  return NON_CONFORMANCES.filter((n) => n.jobCardNo === jobCardNo && n.status !== 'CLOSED')
}

export function ncsFor(jobCardNo: string) {
  return NON_CONFORMANCES.filter((n) => n.jobCardNo === jobCardNo)
}

/** The next number in this month's series, as the register would allot it. */
export function nextNcNumber() {
  const last = NON_CONFORMANCES.map((n) => Number(n.ncNumber.slice(-3))).reduce((a, b) => Math.max(a, b), 0)
  return `NC/2609/${String(last + 1).padStart(3, '0')}`
}

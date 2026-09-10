import { ACCEPTANCE_NUMBER, sampleSizeFor } from '@/types/fg-inspection'
import type { FgCharacteristic, FgInspectionReport } from '@/types/fg-inspection'

/**
 * The attributes a finished tray is inspected on before it is certified.
 *
 * Dimensional and visual only. The laboratory numbers that go on the COA come
 * from the instruments, and are carried onto the certificate rather than being
 * re-observed here.
 */
export const FG_CHARACTERISTICS: { characteristic: string; specification: string }[] = [
  { characteristic: 'Length', specification: 'Drawing dimension ± 0.5 mm' },
  { characteristic: 'Width', specification: 'Drawing dimension ± 0.5 mm' },
  { characteristic: 'Depth of draw', specification: 'Drawing dimension ± 0.5 mm' },
  { characteristic: 'Wall thickness at the corner', specification: 'Not less than 40 % of the reel gauge' },
  { characteristic: 'Visual clarity', specification: 'No haze, crazing or streaks' },
  { characteristic: 'Edge finish', specification: 'Cleanly cut, no burr or fold' },
  { characteristic: 'Contamination', specification: 'No black specks or foreign particles' },
  { characteristic: 'Stacking and de-nesting', specification: 'Stacks square, separates without sticking' },
  { characteristic: 'Count per bag and per box', specification: 'Matches the packing record' },
  { characteristic: 'Labelling', specification: 'Job card, batch and quantity legible on every box' },
]

/** A blank inspection, ready for the QC executive to fill in on the tablet. */
export function blankCharacteristics(): FgCharacteristic[] {
  return FG_CHARACTERISTICS.map((c) => ({ ...c, observed: '', result: 'PASS' as const }))
}

const observed = (values: string[]): FgCharacteristic[] =>
  FG_CHARACTERISTICS.map((c, i) => ({ ...c, observed: values[i] ?? '', result: 'PASS' as const }))

export const FG_REPORTS: FgInspectionReport[] = [
  {
    reportId: 'FG1',
    reportNumber: 'FG/2609/018',
    jobCardNo: 'JC-2609-124',
    customerName: 'Vadilal Industries',
    inspectedOn: '2026-09-09',
    lotSize: 118400,
    sampleSize: sampleSizeFor(118400),
    characteristics: observed([
      '112.2 mm', '88.3 mm', '42.1 mm', '134 µm at the corner', 'Clear, no haze',
      'Clean, no burr', 'None seen', 'Separates cleanly', '50 per bag, 1000 per box',
      'Legible on all boxes checked',
    ]),
    defectivesFound: 0,
    acceptanceNumber: ACCEPTANCE_NUMBER,
    result: 'PASS',
    inspectedBy: 'Sunita Rane',
    remarks: 'Sample drawn across all four pallets.',
  },
]

export function fgReportFor(jobCardNo: string) {
  return FG_REPORTS.find((r) => r.jobCardNo === jobCardNo) ?? null
}

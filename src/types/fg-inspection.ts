/* Finished goods inspection, and the certificate that follows it.

   Workflow phase 6: the packed batch is inspected, an FG inspection report is
   generated, and a Certificate of Analysis is issued from the laboratory test
   instruments for the client's delivery. The COA is what a pharma or food
   customer files, so it is not a document anybody types up afresh: every line
   on it is carried from a record the plant already made. */

export type FgResult = 'PASS' | 'FAIL'

/** One attribute checked over the drawn sample. */
export interface FgCharacteristic {
  characteristic: string
  specification: string
  /** What was actually measured or seen. */
  observed: string
  result: FgResult
}

export interface FgInspectionReport {
  reportId: string
  reportNumber: string
  jobCardNo: string
  customerName: string
  inspectedOn: string
  /** Pieces offered for inspection, and the sample drawn from them. */
  lotSize: number
  sampleSize: number
  characteristics: FgCharacteristic[]
  defectivesFound: number
  /** Pieces the sample allows to be defective before the lot is rejected. */
  acceptanceNumber: number
  result: FgResult
  inspectedBy: string
  remarks: string
}

/**
 * A square-root sample, which is the rule the plant already works to by eye:
 * draw the root of the lot, capped so a large batch stays inspectable.
 */
export function sampleSizeFor(lotSize: number) {
  if (lotSize <= 0) return 0
  return Math.min(Math.max(Math.ceil(Math.sqrt(lotSize)), 5), 200)
}

/** Zero defectives on a visual attribute check; anything found is a finding. */
export const ACCEPTANCE_NUMBER = 0

export function fgReportPasses(report: {
  characteristics: FgCharacteristic[]
  defectivesFound: number
  acceptanceNumber: number
}) {
  return (
    report.characteristics.length > 0 &&
    report.characteristics.every((c) => c.result === 'PASS') &&
    report.defectivesFound <= report.acceptanceNumber
  )
}

/**
 * What has to be true before a certificate can be released against a job.
 *
 * Each of these is a record made elsewhere in the plant, which is the point:
 * the COA is a summary of work already signed for, not a fresh claim. Anything
 * still outstanding is named, so the person holding the dispatch knows who to
 * go to rather than being told only that it is blocked.
 */
export interface CoaGate {
  fgReportPassed: boolean
  hourlyChecksRecorded: number
  hourlyChecksRequired: number
  openNonConformances: number
}

export function coaBlockers(gate: CoaGate): string[] {
  const blockers: string[] = []
  if (!gate.fgReportPassed) blockers.push('The finished goods inspection has not passed')
  if (gate.hourlyChecksRecorded < gate.hourlyChecksRequired) {
    blockers.push(
      `${gate.hourlyChecksRequired - gate.hourlyChecksRecorded} of ${gate.hourlyChecksRequired} in-process checks are missing from the shift`,
    )
  }
  if (gate.openNonConformances > 0) {
    blockers.push(
      `${gate.openNonConformances} non-conformance${gate.openNonConformances > 1 ? 's are' : ' is'} still open against this job`,
    )
  }
  return blockers
}

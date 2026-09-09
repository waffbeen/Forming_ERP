/** Standing plant configuration - would come from the company master in a live system. */
export const PLANT = {
  companyName: 'Desform LLP',
  productName: 'Thermoforming ERP',
  unitName: 'Vasai Unit-1',
  location: 'Vasai, Mumbai',
  areaSqFt: 8500,
  headcount: 22,
  /** Standard forming bed, in millimetres. */
  bedLengthMm: 600,
  bedWidthMm: 600,
  /** Reels are never accepted below this thickness. */
  minMicrons: 180,
  maxMicrons: 1000,
  /** Semi-automatic double-sided cutting: 6 + 6. */
  sheetsPerStroke: 12,
  /** Heater zones on the forming tunnel, logged per run. */
  heaterZones: 27,
} as const

/**
 * Standard reel deckle the store buys: the next 20 mm step above the bed, which
 * leaves a trim edge either side of the formed area.
 */
export const DECKLE_MM = 620

/**
 * Controlled document numbers, taken from the client's own SOPs and record
 * formats. Printed on every job card, checklist and certificate so a record in
 * the system matches the one an auditor asks for by number.
 */
export const DOCUMENTS = {
  qcForming: 'DP/QC/F-01',
  qcCutting: 'DP/QC/F-02',
  productionForming: 'DP/PR/F-03',
  productionCutting: 'DP/PR/F-04',
  qcSorting: 'DP/QC/F-02',
  productionSorting: 'DP/PR/F-04',
  sopCutting: 'DF/PRD/SOP-05',
  sopForming: 'DF/PRD/SOP-09',
  dailyProduction: 'DF/PRD/F-01',
} as const

/**
 * Forming temperatures by polymer, from SOP DF/PRD/SOP-09 section 4.2.2.
 * The sheet has to reach forming temperature without degrading.
 */
export const FORMING_TEMPERATURE_C = {
  PS: { min: 80, max: 120 },
  PET: { min: 120, max: 160 },
  PP: { min: 160, max: 180 },
} as const

/**
 * In-process defect parameters checked on the floor, one column per check.
 * Verbatim from the client's QC formats so the screen matches the paper it
 * replaces. FPA is the first-piece approval column that precedes check 1.
 */
export const FORMING_DEFECTS = [
  'Incomplete Forming',
  'Warping / Distortion',
  'Uneven Wall Thickness',
  'Cracks / Breakage',
  'Webbing / Bridging',
  'Wrinkles / Folds',
  'Sink Marks / Depressions',
  'Bubbles / Blisters',
  'Short Forming / Incomplete Depth',
  'Dimensional Variation',
] as const

export const CUTTING_DEFECTS = [
  'Incomplete Cutting',
  'Over Cutting',
  'Uneven / Rough Edges',
  'Burr Formation',
  'Dimensional Variation',
  'Cracks / Breakage',
  'Deformation During Cutting',
  'Cut Position Misalignment',
  'Corner Damage',
  'Scratches / Surface Marks',
] as const

/**
 * What the sorting table pulls a tray out for. Sorting is the last human look
 * at the piece before it is bagged, so a reject is booked against a reason and
 * the reasons add up to the rejection quantity on the cutting record.
 */
export const SORTING_REJECT_REASONS = [
  'Deformed / Warped',
  'Uneven Edges',
  'Burr Not Removed',
  'Cracked / Broken',
  'Scratches / Surface Marks',
  'Undersize Depth',
  'Contamination / Foreign Particle',
  'Colour Variation',
] as const

/**
 * The six areas a supervisor physically checks before a job may start, from
 * the line clearance block on both production formats. Both the machine
 * operator and the production/QC supervisor sign against them.
 */
export const LINE_CLEARANCE_AREAS = [
  'Machine Feeder Cleared',
  "Previous Job's Wastage Removed",
  'Shop Floor Area Cleared',
  "Previous Job's Materials Shifted",
  'Inspection Table Cleared',
  "Previous Job's Inputs Cleared",
] as const

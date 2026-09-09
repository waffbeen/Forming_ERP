import type { DefectCheck, DefectResult } from '@/components/forming/defect-checklist'
import { FORMING_DEFECTS, PUNCHING_DEFECTS } from '@/config/plant'

/** Everything passes unless the run below says otherwise. */
function allOk(defects: readonly string[], defectsFound: string[] = []) {
  return defects.reduce<Record<string, DefectResult>>((acc, d) => {
    acc[d] = defectsFound.includes(d) ? 'DEFECT' : 'OK'
    return acc
  }, {})
}

function notChecked(defects: readonly string[]) {
  return defects.reduce<Record<string, DefectResult>>((acc, d) => {
    acc[d] = 'NOT_CHECKED'
    return acc
  }, {})
}

/**
 * Forming in-process checks for JC-2609-124, format DP/QC/F-01.
 * Check 4 caught webbing after a heater zone drifted; the run was corrected
 * and the following checks are clean.
 */
export const FORMING_DEFECT_CHECKS: DefectCheck[] = [
  { id: 'FPA', time: '07:52', inspector: 'Sunita Rane', results: allOk(FORMING_DEFECTS) },
  { id: '1', time: '08:00', inspector: 'Sunita Rane', results: allOk(FORMING_DEFECTS) },
  { id: '2', time: '09:00', inspector: 'Sunita Rane', results: allOk(FORMING_DEFECTS) },
  { id: '3', time: '10:00', inspector: 'Sunita Rane', results: allOk(FORMING_DEFECTS) },
  { id: '4', time: '11:00', inspector: 'Anil Kadam', results: allOk(FORMING_DEFECTS, ['Webbing / Bridging']) },
  { id: '5', time: '12:00', inspector: 'Anil Kadam', results: allOk(FORMING_DEFECTS) },
  { id: '6', time: '13:00', inspector: 'Anil Kadam', results: allOk(FORMING_DEFECTS) },
  { id: '7', time: '14:00', inspector: 'Meera Shinde', results: allOk(FORMING_DEFECTS) },
  { id: '8', time: '15:00', inspector: 'Meera Shinde', results: allOk(FORMING_DEFECTS) },
  { id: '9', time: '—', inspector: '', results: notChecked(FORMING_DEFECTS) },
]

/** Punching in-process checks for JC-2609-124, format DP/QC/F-02. */
export const PUNCHING_DEFECT_CHECKS: DefectCheck[] = [
  { id: 'FPA', time: '13:10', inspector: 'Meera Shinde', results: allOk(PUNCHING_DEFECTS) },
  { id: '1', time: '13:30', inspector: 'Meera Shinde', results: allOk(PUNCHING_DEFECTS) },
  { id: '2', time: '14:30', inspector: 'Meera Shinde', results: allOk(PUNCHING_DEFECTS, ['Burr Formation']) },
  { id: '3', time: '15:30', inspector: 'Meera Shinde', results: allOk(PUNCHING_DEFECTS) },
  { id: '4', time: '16:30', inspector: 'Meera Shinde', results: allOk(PUNCHING_DEFECTS) },
  { id: '5', time: '—', inspector: '', results: notChecked(PUNCHING_DEFECTS) },
  { id: '6', time: '—', inspector: '', results: notChecked(PUNCHING_DEFECTS) },
  { id: '7', time: '—', inspector: '', results: notChecked(PUNCHING_DEFECTS) },
  { id: '8', time: '—', inspector: '', results: notChecked(PUNCHING_DEFECTS) },
  { id: '9', time: '—', inspector: '', results: notChecked(PUNCHING_DEFECTS) },
]

/**
 * Heater zone temperatures logged for the forming run, one reading per zone.
 * The tunnel has 27 zones; the profile ramps up and holds through the middle.
 */
export const ZONE_TEMPERATURES: number[] = [
  132, 138, 144, 149, 153, 156, 158, 159, 160,
  160, 161, 160, 160, 159, 160, 161, 160, 159,
  158, 157, 155, 152, 148, 144, 140, 136, 131,
]

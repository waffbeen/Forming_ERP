import { GRNS, MATERIAL_ISSUES, PRODUCTION_ENTRIES } from '@/data'

/* The plant's clock.

   Two different times matter on these screens and they are not the same thing.

   The **working date** is the latest day the floor actually posted anything.
   Every screen reads off those records, so a header that said today's real date
   would disagree with every figure under it. It comes from the records.

   The **hour** is the terminal's own, and it is only ever used for how the
   screen greets somebody and which shift is on. It has to be read after the
   page has mounted: the server and the browser are not in the same hour, and a
   greeting rendered on the server would be replaced on arrival. */

/** The latest day anything was posted, which is the date the screens describe. */
export function workingDate(): string {
  const dates = [
    ...GRNS.map((g) => g.grnDate),
    ...MATERIAL_ISSUES.map((i) => i.issuedOn),
    ...PRODUCTION_ENTRIES.map((e) => e.entryDate),
  ].sort()
  return dates[dates.length - 1] ?? '2026-09-10'
}

/** "10 Sep", the way it reads on a shop-floor board. */
export function shortDate(iso: string) {
  const date = new Date(iso)
  return `${date.getDate()} ${date.toLocaleString('en-IN', { month: 'short' })}`
}

/**
 * The shift on at a given hour. The plant runs two: A from seven in the
 * morning, B from seven in the evening.
 */
export function shiftAt(hour: number): 'A' | 'B' {
  return hour >= 7 && hour < 19 ? 'A' : 'B'
}

/** How a person is greeted at that hour, in their own words. */
export function greetingAt(hour: number) {
  if (hour < 5) return 'Working late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

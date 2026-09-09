import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Indian rupee, grouped in lakh/crore style. */
export function formatCurrency(value: number, decimals = 2) {
  return `₹ ${formatNumber(value, decimals)}`
}

export function formatKg(value: number, decimals = 1) {
  return `${formatNumber(value, decimals)} kg`
}

export function formatMicrons(value: number) {
  return `${formatNumber(value)} µm`
}

export function formatPercent(value: number, decimals = 1) {
  return `${formatNumber(value, decimals)} %`
}

/** "2026-09-18" -> "18 Sep" */
export function formatDayMonth(iso: string) {
  const d = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`
}

/** "2026-09-18" -> "18 Sep 2026" */
export function formatDate(iso: string) {
  return `${formatDayMonth(iso)} ${new Date(iso).getFullYear()}`
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

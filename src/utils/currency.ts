/**
 * Currency formatting utilities for INR with Indian numbering system.
 * Provides helpers for values stored in minor units (paise) and major units (rupees).
 */

const INR_LOCALE = 'en-IN'
const INR_CURRENCY = 'INR'

/**
 * Format a value in minor units (paise) as an INR currency string using Indian grouping.
 */
export function formatINRMinor(minorAmount: number): string {
  const rupees = (minorAmount || 0) / 100
  return new Intl.NumberFormat(INR_LOCALE, {
    style: 'currency',
    currency: INR_CURRENCY,
  }).format(rupees)
}

/**
 * Format a value in major units (rupees) as an INR currency string using Indian grouping.
 */
export function formatINRMajor(majorAmount: number): string {
  return new Intl.NumberFormat(INR_LOCALE, {
    style: 'currency',
    currency: INR_CURRENCY,
  }).format(majorAmount || 0)
}

/**
 * Format a plain number with Indian grouping but without a currency symbol (major units).
 */
export function formatIndianGroupedNumber(value: number): string {
  return new Intl.NumberFormat(INR_LOCALE, {
    maximumFractionDigits: 2,
  }).format(value || 0)
}



/**
 * Utility functions for ledger calculations
 */

/**
 * Rounds an amount to the nearest 5 units
 * @param amount The amount to round
 * @returns The rounded amount
 *
 * Example: 10093 → 10095, 10092 → 10090
 */
export function roundToNearest5(amount: number): number {
  return Math.round(amount / 5) * 5
}

/**
 * Truncates a value to 3 decimal places
 * @param value The value to truncate
 * @returns The truncated value
 *
 * Example: 10.96589 → 10.965
 */
export function truncateTo3Decimals(value: number): number {
  return Math.floor(value * 1000) / 1000
}

/**
 * Calculates pure weight from gross weight and purity
 * @param grossWeight The gross weight in grams
 * @param purity The purity as a decimal (0-1)
 * @returns The pure weight in grams, truncated to 3 decimals
 */
export function calculatePureWeight(grossWeight: number, purity: number): number {
  return truncateTo3Decimals(grossWeight * purity)
}


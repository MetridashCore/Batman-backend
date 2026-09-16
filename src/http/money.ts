/**
 * Razorpay and Stripe both price in the currency's *minor* unit (paise, cents),
 * while the API here accepts major units (rupees, dollars).
 *
 * `Math.round` matters: `19.99 * 100` is `1998.9999999999998` in IEEE-754, and
 * sending a fractional amount to either provider is rejected.
 */
export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100)
}

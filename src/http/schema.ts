import { z } from 'zod'

/**
 * Shared field builders.
 *
 * Each sets `error` rather than only a `.min()` message, so an absent field and
 * a blank one report the same thing instead of the raw
 * "expected string, received undefined".
 */

/** A non-empty string. Reports the same message whether missing or blank. */
export function requiredString(label: string) {
  const error = `${label} is required`
  return z.string({ error }).min(1, { error })
}

/** A positive amount in major currency units (rupees, dollars). */
export function amount(label = 'Amount') {
  return z
    .number({ error: `${label} is required` })
    .positive({ error: `${label} must be greater than 0` })
}

/** A positive whole number, e.g. a line-item quantity. */
export function count(label: string) {
  const error = `${label} is required`
  return z.int({ error }).positive({ error })
}

/** An email address. */
export function email() {
  return z.email({ error: 'A valid email is required' })
}

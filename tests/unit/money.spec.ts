import { describe, expect, it } from 'vitest'
import { toMinorUnits } from '../../src/http/money.ts'

describe('toMinorUnits', () => {
  it('converts whole major units', () => {
    expect(toMinorUnits(1)).toBe(100)
    expect(toMinorUnits(250)).toBe(25_000)
  })

  it.each([
    // [input, expected]: each of these is off by a hair in IEEE-754 before rounding.
    [19.99, 1999],
    [0.29, 29],
    [1.005, 100], // 1.005 * 100 === 100.49999999999999
    [4.35, 435],
    [0.1 + 0.2, 30],
  ])('rounds %d to an exact integer (%d)', (input, expected) => {
    const result = toMinorUnits(input)
    expect(result).toBe(expected)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('handles the smallest representable unit', () => {
    expect(toMinorUnits(0.01)).toBe(1)
  })

  it('rounds sub-minor-unit fractions to the nearest unit', () => {
    expect(toMinorUnits(10.004)).toBe(1000)
    expect(toMinorUnits(10.006)).toBe(1001)
  })

  it('stays exact for large amounts', () => {
    expect(toMinorUnits(9_999_999.99)).toBe(999_999_999)
  })
})

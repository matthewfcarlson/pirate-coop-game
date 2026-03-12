import { describe, it, expect, beforeEach } from 'vitest'
import { setSeed, random, getSeed, shuffle } from '../SeededRandom.js'

describe('SeededRandom', () => {
  beforeEach(() => {
    setSeed(null)
  })

  describe('setSeed / getSeed', () => {
    it('stores the seed value', () => {
      setSeed(42)
      expect(getSeed()).toBe(42)
    })

    it('returns null when no seed is set', () => {
      expect(getSeed()).toBeNull()
    })

    it('returns null after resetting to null', () => {
      setSeed(42)
      setSeed(null)
      expect(getSeed()).toBeNull()
    })
  })

  describe('random', () => {
    it('returns values in [0, 1)', () => {
      setSeed(123)
      for (let i = 0; i < 100; i++) {
        const val = random()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThan(1)
      }
    })

    it('produces deterministic output for the same seed', () => {
      setSeed(42)
      const first = Array.from({ length: 10 }, () => random())

      setSeed(42)
      const second = Array.from({ length: 10 }, () => random())

      expect(first).toEqual(second)
    })

    it('produces different output for different seeds', () => {
      setSeed(1)
      const first = Array.from({ length: 5 }, () => random())

      setSeed(2)
      const second = Array.from({ length: 5 }, () => random())

      expect(first).not.toEqual(second)
    })

    it('produces different values on successive calls', () => {
      setSeed(99)
      const values = new Set(Array.from({ length: 20 }, () => random()))
      // All 20 values should be unique
      expect(values.size).toBe(20)
    })
  })

  describe('shuffle', () => {
    it('returns the same array reference', () => {
      setSeed(42)
      const arr = [1, 2, 3, 4, 5]
      const result = shuffle(arr)
      expect(result).toBe(arr)
    })

    it('preserves all elements', () => {
      setSeed(42)
      const arr = [1, 2, 3, 4, 5]
      shuffle(arr)
      expect(arr.sort()).toEqual([1, 2, 3, 4, 5])
    })

    it('produces deterministic shuffles with the same seed', () => {
      setSeed(42)
      const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

      setSeed(42)
      const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

      expect(a).toEqual(b)
    })

    it('handles empty array', () => {
      setSeed(42)
      expect(shuffle([])).toEqual([])
    })

    it('handles single-element array', () => {
      setSeed(42)
      expect(shuffle([1])).toEqual([1])
    })
  })
})

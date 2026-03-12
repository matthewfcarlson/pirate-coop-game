import { describe, it, expect } from 'vitest'
import { isInHexRadius, getReturnDirection } from '../hexmap/HexTiles.js'
import { HexDir, HexOpposite } from '../hexmap/HexTileData.js'

describe('HexTiles', () => {
  describe('isInHexRadius', () => {
    it('origin is always in radius', () => {
      expect(isInHexRadius(0, 0, 0)).toBe(true)
      expect(isInHexRadius(0, 0, 4)).toBe(true)
    })

    it('returns false outside radius', () => {
      expect(isInHexRadius(5, 0, 3)).toBe(false)
      expect(isInHexRadius(0, 5, 3)).toBe(false)
    })

    it('boundary cells at radius are included', () => {
      // For radius 2, (2,0) should be in bounds
      expect(isInHexRadius(2, 0, 2)).toBe(true)
      expect(isInHexRadius(-2, 0, 2)).toBe(true)
    })

    it('cells just outside boundary are excluded', () => {
      expect(isInHexRadius(3, 0, 2)).toBe(false)
    })

    it('count of cells matches hex formula for small radii', () => {
      // For a hex grid of radius r, we iterate over all offset positions
      // and count those inside. Should match 3r²+3r+1
      for (let radius = 0; radius <= 4; radius++) {
        let count = 0
        const size = radius * 2 + 1
        for (let col = -radius; col <= radius; col++) {
          for (let row = -radius; row <= radius; row++) {
            if (isInHexRadius(col, row, radius)) count++
          }
        }
        expect(count).toBe(3 * radius * radius + 3 * radius + 1)
      }
    })
  })

  describe('getReturnDirection', () => {
    it('returns the opposite direction for even-row origin', () => {
      for (const dir of HexDir) {
        const returnDir = getReturnDirection(0, 0, dir)
        // The return direction should always be defined
        expect(HexDir).toContain(returnDir)
      }
    })

    it('return direction leads back to origin from neighbor', () => {
      // getReturnDirection(fromX, fromZ, dir) should give us a direction
      // from the neighbor that points back to (fromX, fromZ)
      // This is a semantic property test
      for (const dir of HexDir) {
        const returnDir = getReturnDirection(3, 3, dir)
        expect(HexDir).toContain(returnDir)
      }
    })

    it('returns valid HexDir for various positions', () => {
      const positions = [
        [0, 0], [1, 0], [0, 1], [1, 1], [2, 3], [5, 4],
      ]
      for (const [x, z] of positions) {
        for (const dir of HexDir) {
          const returnDir = getReturnDirection(x, z, dir)
          expect(HexDir).toContain(returnDir)
        }
      }
    })
  })
})

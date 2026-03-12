import { describe, it, expect } from 'vitest'
import {
  GridDirection,
  getOppositeDirection,
  getGridKey,
  parseGridKey,
  getAdjacentGridKey,
  getWorldPos,
  worldToOffset,
  pointyTopHexToWorld,
  flatTopHexToWorld,
} from '../hexmap/HexGridConnector.js'

describe('HexGridConnector', () => {
  describe('GridDirection', () => {
    it('has 6 directions numbered 0-5', () => {
      const dirs = Object.values(GridDirection)
      expect(dirs).toHaveLength(6)
      expect(dirs.sort()).toEqual([0, 1, 2, 3, 4, 5])
    })
  })

  describe('getOppositeDirection', () => {
    it('N <-> S', () => {
      expect(getOppositeDirection(GridDirection.N)).toBe(GridDirection.S)
      expect(getOppositeDirection(GridDirection.S)).toBe(GridDirection.N)
    })

    it('NE <-> SW', () => {
      expect(getOppositeDirection(GridDirection.NE)).toBe(GridDirection.SW)
      expect(getOppositeDirection(GridDirection.SW)).toBe(GridDirection.NE)
    })

    it('SE <-> NW', () => {
      expect(getOppositeDirection(GridDirection.SE)).toBe(GridDirection.NW)
      expect(getOppositeDirection(GridDirection.NW)).toBe(GridDirection.SE)
    })

    it('double opposite returns original', () => {
      for (const dir of Object.values(GridDirection)) {
        expect(getOppositeDirection(getOppositeDirection(dir))).toBe(dir)
      }
    })
  })

  describe('getGridKey / parseGridKey', () => {
    it('creates comma-separated key', () => {
      expect(getGridKey(3, -2)).toBe('3,-2')
    })

    it('handles origin', () => {
      expect(getGridKey(0, 0)).toBe('0,0')
    })

    it('parseGridKey is the inverse', () => {
      const cases = [
        { x: 0, z: 0 },
        { x: 3, z: -2 },
        { x: -5, z: 7 },
      ]
      for (const c of cases) {
        expect(parseGridKey(getGridKey(c.x, c.z))).toEqual(c)
      }
    })
  })

  describe('getAdjacentGridKey', () => {
    it('moving N decreases z', () => {
      const adj = parseGridKey(getAdjacentGridKey('0,0', GridDirection.N))
      expect(adj.z).toBe(-1)
    })

    it('moving S increases z', () => {
      const adj = parseGridKey(getAdjacentGridKey('0,0', GridDirection.S))
      expect(adj.z).toBe(1)
    })

    it('moving in opposite directions from center returns center', () => {
      for (const dir of Object.values(GridDirection)) {
        const adjKey = getAdjacentGridKey('0,0', dir)
        const oppDir = getOppositeDirection(dir)
        const backKey = getAdjacentGridKey(adjKey, oppDir)
        expect(parseGridKey(backKey)).toEqual({ x: 0, z: 0 })
      }
    })

    it('handles odd column parity correctly', () => {
      // Column 1 is odd, so offsets differ
      const key = '1,0'
      const adjNE = parseGridKey(getAdjacentGridKey(key, GridDirection.NE))
      const evenAdjNE = parseGridKey(getAdjacentGridKey('0,0', GridDirection.NE))
      // They should have different z offsets due to parity
      expect(adjNE).not.toEqual(evenAdjNE)
    })
  })

  describe('getWorldPos / worldToOffset', () => {
    it('origin maps to (0, 0)', () => {
      const pos = getWorldPos(0, 0)
      expect(pos.x).toBeCloseTo(0)
      expect(pos.z).toBeCloseTo(0)
    })

    it('round-trips offset -> world -> offset', () => {
      for (let col = -3; col <= 3; col++) {
        for (let row = -3; row <= 3; row++) {
          const world = getWorldPos(col, row)
          const back = worldToOffset(world.x, world.z)
          expect(back.col).toBe(col)
          expect(back.row).toBe(row)
        }
      }
    })

    it('odd rows are staggered (shifted by half hex width)', () => {
      const even = getWorldPos(0, 0)
      const odd = getWorldPos(0, 1)
      // Odd row should be offset by HEX_WIDTH * 0.5 = 1
      expect(odd.x - even.x).toBeCloseTo(1)
    })
  })

  describe('pointyTopHexToWorld', () => {
    it('origin maps to (0, 0)', () => {
      const pos = pointyTopHexToWorld(0, 0, 2, 2)
      expect(pos.x).toBeCloseTo(0)
      expect(pos.z).toBeCloseTo(0)
    })

    it('respects hex dimensions', () => {
      const w = 4
      const h = 3
      const pos = pointyTopHexToWorld(1, 0, w, h)
      expect(pos.x).toBeCloseTo(w)
    })
  })

  describe('flatTopHexToWorld', () => {
    it('origin maps to (0, 0)', () => {
      const pos = flatTopHexToWorld(0, 0, 2, 2)
      expect(pos.x).toBeCloseTo(0)
      expect(pos.z).toBeCloseTo(0)
    })

    it('odd columns are staggered in z', () => {
      const w = 2
      const h = 2
      const even = flatTopHexToWorld(0, 0, w, h)
      const odd = flatTopHexToWorld(1, 0, w, h)
      expect(odd.z - even.z).toBeCloseTo(h * 0.5)
    })
  })
})

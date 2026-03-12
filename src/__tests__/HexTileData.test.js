import { describe, it, expect } from 'vitest'
import {
  TILE_LIST,
  TileType,
  HexDir,
  HexOpposite,
  HexNeighborOffsets,
  getHexNeighborOffset,
  rotateHexEdges,
  LEVELS_COUNT,
} from '../hexmap/HexTileData.js'

describe('HexTileData', () => {
  describe('TILE_LIST', () => {
    it('has tiles defined', () => {
      expect(TILE_LIST.length).toBeGreaterThan(0)
    })

    it('each tile has required fields', () => {
      for (const tile of TILE_LIST) {
        expect(tile).toHaveProperty('name')
        expect(tile).toHaveProperty('mesh')
        expect(tile).toHaveProperty('edges')
        expect(tile).toHaveProperty('weight')
        expect(typeof tile.name).toBe('string')
        expect(typeof tile.mesh).toBe('string')
        expect(typeof tile.weight).toBe('number')
        expect(tile.weight).toBeGreaterThan(0)
      }
    })

    it('each tile has all 6 hex direction edges', () => {
      for (const tile of TILE_LIST) {
        for (const dir of HexDir) {
          expect(tile.edges).toHaveProperty(dir)
          expect(typeof tile.edges[dir]).toBe('string')
        }
      }
    })

    it('slope tiles have valid highEdges referencing HexDir values', () => {
      for (const tile of TILE_LIST) {
        if (tile.highEdges) {
          expect(Array.isArray(tile.highEdges)).toBe(true)
          expect(tile.highEdges.length).toBeGreaterThan(0)
          for (const edge of tile.highEdges) {
            expect(HexDir).toContain(edge)
          }
        }
      }
    })

    it('slope tiles have levelIncrement within valid range', () => {
      for (const tile of TILE_LIST) {
        if (tile.levelIncrement !== undefined) {
          expect(tile.levelIncrement).toBeGreaterThan(0)
          expect(tile.levelIncrement).toBeLessThan(LEVELS_COUNT)
        }
      }
    })
  })

  describe('TileType', () => {
    it('maps tile names to their indices', () => {
      expect(TileType.GRASS).toBe(0)
      expect(TileType.WATER).toBe(1)
    })

    it('is consistent with TILE_LIST', () => {
      for (let i = 0; i < TILE_LIST.length; i++) {
        expect(TileType[TILE_LIST[i].name]).toBe(i)
      }
    })

    it('has an entry for every tile', () => {
      expect(Object.keys(TileType).length).toBe(TILE_LIST.length)
    })
  })

  describe('HexDir', () => {
    it('has exactly 6 directions', () => {
      expect(HexDir).toHaveLength(6)
    })

    it('contains the expected directions', () => {
      expect(HexDir).toEqual(['NE', 'E', 'SE', 'SW', 'W', 'NW'])
    })
  })

  describe('HexOpposite', () => {
    it('maps each direction to its opposite', () => {
      expect(HexOpposite.NE).toBe('SW')
      expect(HexOpposite.E).toBe('W')
      expect(HexOpposite.SE).toBe('NW')
      expect(HexOpposite.SW).toBe('NE')
      expect(HexOpposite.W).toBe('E')
      expect(HexOpposite.NW).toBe('SE')
    })

    it('is symmetric (opposite of opposite is self)', () => {
      for (const dir of HexDir) {
        expect(HexOpposite[HexOpposite[dir]]).toBe(dir)
      }
    })
  })

  describe('getHexNeighborOffset', () => {
    it('returns even-row offsets for even z', () => {
      const offset = getHexNeighborOffset(0, 0, 'E')
      expect(offset).toEqual(HexNeighborOffsets.even.E)
    })

    it('returns odd-row offsets for odd z', () => {
      const offset = getHexNeighborOffset(0, 1, 'E')
      expect(offset).toEqual(HexNeighborOffsets.odd.E)
    })

    it('returns valid offsets for all directions', () => {
      for (const dir of HexDir) {
        const even = getHexNeighborOffset(3, 2, dir)
        const odd = getHexNeighborOffset(3, 3, dir)
        expect(even).toHaveProperty('dx')
        expect(even).toHaveProperty('dz')
        expect(odd).toHaveProperty('dx')
        expect(odd).toHaveProperty('dz')
      }
    })
  })

  describe('rotateHexEdges', () => {
    it('rotation of 0 returns original edges', () => {
      const edges = { NE: 'road', E: 'grass', SE: 'water', SW: 'grass', W: 'road', NW: 'grass' }
      const rotated = rotateHexEdges(edges, 0)
      expect(rotated).toEqual(edges)
    })

    it('rotation of 6 returns original edges (full circle)', () => {
      const edges = { NE: 'road', E: 'grass', SE: 'water', SW: 'grass', W: 'road', NW: 'grass' }
      const rotated = rotateHexEdges(edges, 6)
      expect(rotated).toEqual(edges)
    })

    it('rotation of 1 shifts edges by one position', () => {
      const edges = { NE: 'a', E: 'b', SE: 'c', SW: 'd', W: 'e', NW: 'f' }
      const rotated = rotateHexEdges(edges, 1)
      // NE->E, E->SE, SE->SW, SW->W, W->NW, NW->NE
      expect(rotated).toEqual({ NE: 'f', E: 'a', SE: 'b', SW: 'c', W: 'd', NW: 'e' })
    })

    it('rotation of 3 is a 180° flip', () => {
      const edges = { NE: 'a', E: 'b', SE: 'c', SW: 'd', W: 'e', NW: 'f' }
      const rotated = rotateHexEdges(edges, 3)
      expect(rotated).toEqual({ NE: 'd', E: 'e', SE: 'f', SW: 'a', W: 'b', NW: 'c' })
    })

    it('preserves all edge values', () => {
      const edges = TILE_LIST[TileType.ROAD_A].edges
      for (let r = 0; r < 6; r++) {
        const rotated = rotateHexEdges(edges, r)
        const original = Object.values(edges).sort()
        const rotatedVals = Object.values(rotated).sort()
        expect(rotatedVals).toEqual(original)
      }
    })
  })

  describe('LEVELS_COUNT', () => {
    it('is a positive integer', () => {
      expect(LEVELS_COUNT).toBeGreaterThan(0)
      expect(Number.isInteger(LEVELS_COUNT)).toBe(true)
    })
  })
})

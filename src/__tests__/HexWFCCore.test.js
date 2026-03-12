import { describe, it, expect, beforeEach } from 'vitest'
import { setSeed } from '../SeededRandom.js'
import {
  CUBE_DIRS,
  cubeKey,
  parseCubeKey,
  offsetToCube,
  cubeToOffset,
  localToGlobalCoords,
  globalToLocalGrid,
  cubeCoordsInRadius,
  cubeDistance,
  edgesCompatible,
  getEdgeLevel,
  HexWFCCell,
  HexWFCAdjacencyRules,
} from '../hexmap/HexWFCCore.js'
import { TileType, LEVELS_COUNT } from '../hexmap/HexTileData.js'

describe('HexWFCCore', () => {
  describe('CUBE_DIRS', () => {
    it('has 6 directions', () => {
      expect(CUBE_DIRS).toHaveLength(6)
    })

    it('each direction sums to zero (q+r+s=0)', () => {
      for (const dir of CUBE_DIRS) {
        expect(dir.dq + dir.dr + dir.ds).toBe(0)
      }
    })
  })

  describe('cubeKey / parseCubeKey', () => {
    it('creates a comma-separated key', () => {
      expect(cubeKey(1, 2, -3)).toBe('1,2,-3')
    })

    it('handles zero coordinates', () => {
      expect(cubeKey(0, 0, 0)).toBe('0,0,0')
    })

    it('handles negative coordinates', () => {
      expect(cubeKey(-1, -2, 3)).toBe('-1,-2,3')
    })

    it('parseCubeKey is the inverse of cubeKey', () => {
      const cases = [
        { q: 0, r: 0, s: 0 },
        { q: 1, r: -2, s: 1 },
        { q: -5, r: 3, s: 2 },
      ]
      for (const c of cases) {
        expect(parseCubeKey(cubeKey(c.q, c.r, c.s))).toEqual(c)
      }
    })
  })

  describe('offsetToCube / cubeToOffset', () => {
    it('converts origin correctly', () => {
      const cube = offsetToCube(0, 0)
      expect(cube.q).toBe(0)
      expect(cube.r).toBe(0)
      expect(cube.q + cube.r + cube.s).toBe(0)
    })

    it('produces valid cube coordinates (q+r+s=0)', () => {
      for (let col = -5; col <= 5; col++) {
        for (let row = -5; row <= 5; row++) {
          const { q, r, s } = offsetToCube(col, row)
          expect(q + r + s).toBe(0)
        }
      }
    })

    it('round-trips offset -> cube -> offset', () => {
      for (let col = -5; col <= 5; col++) {
        for (let row = -5; row <= 5; row++) {
          const { q, r, s } = offsetToCube(col, row)
          const back = cubeToOffset(q, r, s)
          expect(back).toEqual({ col, row })
        }
      }
    })
  })

  describe('localToGlobalCoords / globalToLocalGrid', () => {
    const gridRadius = 4
    const globalCenterCube = { q: 0, r: 0, s: 0 }

    it('center of local grid maps to global center', () => {
      const result = localToGlobalCoords(gridRadius, gridRadius, gridRadius, globalCenterCube)
      expect(result).toEqual({ col: 0, row: 0 })
    })

    it('round-trips local -> global -> local', () => {
      for (let x = 0; x <= gridRadius * 2; x++) {
        for (let z = 0; z <= gridRadius * 2; z++) {
          const globalOffset = localToGlobalCoords(x, z, gridRadius, globalCenterCube)
          const globalCube = offsetToCube(globalOffset.col, globalOffset.row)
          const local = globalToLocalGrid(globalCube, globalCenterCube, gridRadius)
          expect(local).toEqual({ gridX: x, gridZ: z })
        }
      }
    })
  })

  describe('cubeCoordsInRadius', () => {
    it('radius 0 returns only the center', () => {
      const coords = cubeCoordsInRadius(1, 2, -3, 0)
      expect(coords).toEqual([{ q: 1, r: 2, s: -3 }])
    })

    it('radius 1 returns 7 coordinates (center + 6 neighbors)', () => {
      const coords = cubeCoordsInRadius(0, 0, 0, 1)
      expect(coords).toHaveLength(7)
    })

    it('radius 2 returns 19 coordinates', () => {
      const coords = cubeCoordsInRadius(0, 0, 0, 2)
      expect(coords).toHaveLength(19)
    })

    it('all returned coordinates satisfy q+r+s=0 when centered at origin', () => {
      const coords = cubeCoordsInRadius(0, 0, 0, 3)
      for (const c of coords) {
        expect(c.q + c.r + c.s).toBe(0)
      }
    })

    it('all coordinates are within the specified distance', () => {
      const center = { q: 2, r: -1, s: -1 }
      const radius = 3
      const coords = cubeCoordsInRadius(center.q, center.r, center.s, radius)
      for (const c of coords) {
        const dist = cubeDistance(center.q, center.r, center.s, c.q, c.r, c.s)
        expect(dist).toBeLessThanOrEqual(radius)
      }
    })

    it('follows the hex count formula: 3r²+3r+1', () => {
      for (let r = 0; r <= 5; r++) {
        const coords = cubeCoordsInRadius(0, 0, 0, r)
        expect(coords).toHaveLength(3 * r * r + 3 * r + 1)
      }
    })
  })

  describe('cubeDistance', () => {
    it('distance from a point to itself is 0', () => {
      expect(cubeDistance(1, 2, -3, 1, 2, -3)).toBe(0)
    })

    it('distance to adjacent hex is 1', () => {
      for (const dir of CUBE_DIRS) {
        expect(cubeDistance(0, 0, 0, dir.dq, dir.dr, dir.ds)).toBe(1)
      }
    })

    it('is symmetric', () => {
      expect(cubeDistance(0, 0, 0, 3, -2, -1)).toBe(cubeDistance(3, -2, -1, 0, 0, 0))
    })

    it('computes correct distances', () => {
      // Two steps E: q+2, s-2
      expect(cubeDistance(0, 0, 0, 2, 0, -2)).toBe(2)
      // Three steps
      expect(cubeDistance(0, 0, 0, 3, -1, -2)).toBe(3)
    })
  })

  describe('edgesCompatible', () => {
    it('same edge type and level are compatible', () => {
      expect(edgesCompatible('road', 0, 'road', 0)).toBe(true)
      expect(edgesCompatible('river', 2, 'river', 2)).toBe(true)
    })

    it('different edge types are not compatible', () => {
      expect(edgesCompatible('road', 0, 'grass', 0)).toBe(false)
      expect(edgesCompatible('water', 0, 'coast', 0)).toBe(false)
    })

    it('grass connects at any level', () => {
      expect(edgesCompatible('grass', 0, 'grass', 3)).toBe(true)
      expect(edgesCompatible('grass', 4, 'grass', 0)).toBe(true)
    })

    it('non-grass edges require matching levels', () => {
      expect(edgesCompatible('road', 0, 'road', 1)).toBe(false)
      expect(edgesCompatible('river', 2, 'river', 3)).toBe(false)
    })
  })

  describe('getEdgeLevel', () => {
    it('returns baseLevel for non-slope tiles', () => {
      expect(getEdgeLevel(TileType.GRASS, 0, 'NE', 2)).toBe(2)
      expect(getEdgeLevel(TileType.WATER, 0, 'E', 0)).toBe(0)
    })

    it('returns elevated level for high edges of slope tiles', () => {
      // GRASS_SLOPE_LOW has highEdges: ['NE', 'E', 'SE'], levelIncrement: 1
      const type = TileType.GRASS_SLOPE_LOW
      expect(getEdgeLevel(type, 0, 'NE', 0)).toBe(1) // high edge
      expect(getEdgeLevel(type, 0, 'SW', 0)).toBe(0) // low edge
    })

    it('respects rotation for slope high edges', () => {
      // GRASS_SLOPE_LOW highEdges: ['NE', 'E', 'SE']
      // rotation 1 shifts: NE->E, E->SE, SE->SW
      const type = TileType.GRASS_SLOPE_LOW
      expect(getEdgeLevel(type, 1, 'E', 0)).toBe(1)   // was NE
      expect(getEdgeLevel(type, 1, 'NE', 0)).toBe(0)  // no longer high
    })

    it('handles invalid tile type gracefully', () => {
      expect(getEdgeLevel(999, 0, 'NE', 2)).toBe(2)
    })
  })

  describe('HexWFCCell', () => {
    const testStates = [
      { type: 0, rotation: 0, level: 0 },
      { type: 0, rotation: 1, level: 0 },
      { type: 1, rotation: 0, level: 0 },
    ]

    describe('stateKey / parseKey', () => {
      it('creates a string key', () => {
        expect(HexWFCCell.stateKey({ type: 0, rotation: 3, level: 2 })).toBe('0_3_2')
      })

      it('parseKey is the inverse of stateKey', () => {
        const state = { type: 5, rotation: 2, level: 3 }
        expect(HexWFCCell.parseKey(HexWFCCell.stateKey(state))).toEqual(state)
      })
    })

    it('starts uncollapsed with all possibilities', () => {
      const cell = new HexWFCCell(testStates)
      expect(cell.collapsed).toBe(false)
      expect(cell.possibilities.size).toBe(3)
      expect(cell.tile).toBeNull()
    })

    it('collapse reduces to one possibility', () => {
      const cell = new HexWFCCell(testStates)
      const state = testStates[1]
      cell.collapse(state)
      expect(cell.collapsed).toBe(true)
      expect(cell.possibilities.size).toBe(1)
      expect(cell.tile).toEqual(state)
    })

    it('remove decreases possibilities', () => {
      const cell = new HexWFCCell(testStates)
      const key = HexWFCCell.stateKey(testStates[0])
      const removed = cell.remove(key)
      expect(removed).toBe(true)
      expect(cell.possibilities.size).toBe(2)
    })

    it('remove returns false for non-existent key', () => {
      const cell = new HexWFCCell(testStates)
      expect(cell.remove('999_0_0')).toBe(false)
    })

    it('has checks membership', () => {
      const cell = new HexWFCCell(testStates)
      expect(cell.has(HexWFCCell.stateKey(testStates[0]))).toBe(true)
      expect(cell.has('999_0_0')).toBe(false)
    })

    it('entropy is 0 when collapsed', () => {
      setSeed(42)
      const cell = new HexWFCCell(testStates)
      cell.collapse(testStates[0])
      expect(cell.entropy).toBe(0)
    })

    it('entropy is positive when uncollapsed', () => {
      setSeed(42)
      const cell = new HexWFCCell(testStates)
      expect(cell.entropy).toBeGreaterThan(0)
    })
  })

  describe('HexWFCAdjacencyRules', () => {
    it('can be constructed from tile definitions', () => {
      const rules = HexWFCAdjacencyRules.fromTileDefinitions()
      expect(rules).toBeInstanceOf(HexWFCAdjacencyRules)
      expect(rules.stateEdges.size).toBeGreaterThan(0)
      expect(rules.byEdge.size).toBeGreaterThan(0)
    })

    it('can be constructed from a subset of tiles', () => {
      const rules = HexWFCAdjacencyRules.fromTileDefinitions([TileType.GRASS, TileType.WATER])
      expect(rules.stateEdges.size).toBeGreaterThan(0)
    })

    it('stateEdges has edge info for all 6 directions', () => {
      const rules = HexWFCAdjacencyRules.fromTileDefinitions([TileType.GRASS])
      for (const [, edgeInfo] of rules.stateEdges) {
        expect(Object.keys(edgeInfo)).toHaveLength(6)
        for (const dir of ['NE', 'E', 'SE', 'SW', 'W', 'NW']) {
          expect(edgeInfo[dir]).toHaveProperty('type')
          expect(edgeInfo[dir]).toHaveProperty('level')
        }
      }
    })

    it('getByEdge returns states matching edge type/direction/level', () => {
      const rules = HexWFCAdjacencyRules.fromTileDefinitions()
      const grassStates = rules.getByEdge('grass', 'NE', 0)
      expect(grassStates.size).toBeGreaterThan(0)
    })

    it('getByEdge returns empty set for invalid edge type', () => {
      const rules = HexWFCAdjacencyRules.fromTileDefinitions()
      const result = rules.getByEdge('nonexistent', 'NE', 0)
      expect(result.size).toBe(0)
    })

    it('generates states for multiple levels', () => {
      const rules = HexWFCAdjacencyRules.fromTileDefinitions([TileType.GRASS])
      // GRASS is non-slope, so it should have states for all LEVELS_COUNT levels
      const grassKeys = [...rules.stateEdges.keys()].filter(k => k.startsWith('0_'))
      // 6 rotations * LEVELS_COUNT levels
      expect(grassKeys).toHaveLength(6 * LEVELS_COUNT)
    })
  })
})

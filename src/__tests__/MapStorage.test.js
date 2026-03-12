import { describe, it, expect, beforeEach, vi } from 'vitest'
import { serializeMap, saveToSession, loadFromSession, clearSession } from '../hexmap/MapStorage.js'

// Mock sessionStorage for Node environment
const storage = new Map()
const mockSessionStorage = {
  getItem: vi.fn((key) => storage.get(key) ?? null),
  setItem: vi.fn((key, value) => storage.set(key, value)),
  removeItem: vi.fn((key) => storage.delete(key)),
}

vi.stubGlobal('sessionStorage', mockSessionStorage)

describe('MapStorage', () => {
  beforeEach(() => {
    storage.clear()
    vi.clearAllMocks()
  })

  function makeMockHexMap(grids = [], globalCells = []) {
    const gridsMap = new Map()
    for (const g of grids) {
      gridsMap.set(g.key, {
        gridCoords: { x: g.x, z: g.z },
        state: g.state,
      })
    }
    const cellsMap = new Map()
    for (const c of globalCells) {
      const key = `${c.q},${c.r},${c.s}`
      cellsMap.set(key, c)
    }
    return {
      grids: gridsMap,
      globalCells: cellsMap,
      _waterSideIndex: 3,
    }
  }

  describe('serializeMap', () => {
    it('serializes an empty map', () => {
      const hexMap = makeMockHexMap()
      const result = serializeMap(hexMap, 42)
      expect(result.version).toBe(1)
      expect(result.seed).toBe(42)
      expect(result.grids).toEqual([])
      expect(result.cells).toEqual([])
    })

    it('serializes grids and cells', () => {
      const grids = [
        { key: '0,0', x: 0, z: 0, state: 'populated' },
        { key: '1,0', x: 1, z: 0, state: 'placeholder' },
      ]
      const cells = [
        { q: 0, r: 0, s: 0, type: 0, rotation: 0, level: 0, gridKey: '0,0' },
        { q: 1, r: -1, s: 0, type: 1, rotation: 2, level: 1, gridKey: '0,0' },
      ]
      const hexMap = makeMockHexMap(grids, cells)
      const result = serializeMap(hexMap, 99)

      expect(result.seed).toBe(99)
      expect(result.waterSideIndex).toBe(3)
      expect(result.grids).toHaveLength(2)
      expect(result.cells).toHaveLength(2)
      expect(result.cells[0]).toEqual({
        q: 0, r: 0, s: 0, type: 0, rotation: 0, level: 0, gridKey: '0,0',
      })
    })

    it('does not include extra properties from cells', () => {
      const cells = [
        { q: 0, r: 0, s: 0, type: 0, rotation: 0, level: 0, gridKey: '0,0', extraProp: 'should not appear' },
      ]
      const hexMap = makeMockHexMap([], cells)
      const result = serializeMap(hexMap, 1)
      expect(result.cells[0]).not.toHaveProperty('extraProp')
    })
  })

  describe('saveToSession / loadFromSession', () => {
    it('round-trips save and load', () => {
      const grids = [
        { key: '0,0', x: 0, z: 0, state: 'populated' },
      ]
      const cells = [
        { q: 0, r: 0, s: 0, type: 0, rotation: 0, level: 0, gridKey: '0,0' },
      ]
      const hexMap = makeMockHexMap(grids, cells)
      saveToSession(hexMap, 42)

      const loaded = loadFromSession()
      expect(loaded).not.toBeNull()
      expect(loaded.seed).toBe(42)
      expect(loaded.grids).toHaveLength(1)
      expect(loaded.cells).toHaveLength(1)
    })

    it('returns null when nothing is saved', () => {
      expect(loadFromSession()).toBeNull()
    })

    it('returns null for invalid version', () => {
      storage.set('hexmap-state', JSON.stringify({ version: 999 }))
      expect(loadFromSession()).toBeNull()
    })

    it('returns null for invalid JSON', () => {
      storage.set('hexmap-state', 'not valid json{{{')
      expect(loadFromSession()).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('removes saved state', () => {
      const hexMap = makeMockHexMap()
      saveToSession(hexMap, 42)
      expect(loadFromSession()).not.toBeNull()

      clearSession()
      expect(loadFromSession()).toBeNull()
    })
  })

  describe('data integrity', () => {
    it('preserves all cell fields through round-trip', () => {
      const cells = [
        { q: -3, r: 5, s: -2, type: 15, rotation: 4, level: 3, gridKey: '1,-1' },
      ]
      const grids = [{ key: '1,-1', x: 1, z: -1, state: 'populated' }]
      const hexMap = makeMockHexMap(grids, cells)
      saveToSession(hexMap, 12345)

      const loaded = loadFromSession()
      const cell = loaded.cells[0]
      expect(cell.q).toBe(-3)
      expect(cell.r).toBe(5)
      expect(cell.s).toBe(-2)
      expect(cell.type).toBe(15)
      expect(cell.rotation).toBe(4)
      expect(cell.level).toBe(3)
      expect(cell.gridKey).toBe('1,-1')
    })

    it('preserves waterSideIndex', () => {
      const hexMap = makeMockHexMap()
      hexMap._waterSideIndex = 5
      saveToSession(hexMap, 1)
      const loaded = loadFromSession()
      expect(loaded.waterSideIndex).toBe(5)
    })

    it('handles null waterSideIndex', () => {
      const hexMap = makeMockHexMap()
      hexMap._waterSideIndex = null
      saveToSession(hexMap, 1)
      const loaded = loadFromSession()
      expect(loaded.waterSideIndex).toBeNull()
    })
  })
})

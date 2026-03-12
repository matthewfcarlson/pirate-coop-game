/**
 * Shared WFC core logic - no browser dependencies
 * Importable by both main thread and web workers
 */

import {
  TILE_LIST,
  HexDir,
  rotateHexEdges,
  LEVELS_COUNT,
} from './HexTileData.js'
import type { HexDirName, EdgeType } from './HexTileData.js'
import { random } from '../SeededRandom.js'

// ============================================================================
// Types
// ============================================================================

export interface CubeCoord {
  q: number
  r: number
  s: number
}

export interface CubeDir {
  name: string
  dq: number
  dr: number
  ds: number
}

export interface OffsetCoord {
  col: number
  row: number
}

export interface WFCState {
  type: number
  rotation: number
  level: number
}

export interface EdgeInfo {
  type: EdgeType
  level: number
}

// ============================================================================
// Cube Coordinate Utilities
// ============================================================================

/**
 * Cube direction vectors for pointy-top hex (matching HexDir order: NE, E, SE, SW, W, NW)
 */
export const CUBE_DIRS: CubeDir[] = [
  { name: 'NE', dq: +1, dr: -1, ds: 0 },
  { name: 'E',  dq: +1, dr: 0,  ds: -1 },
  { name: 'SE', dq: 0,  dr: +1, ds: -1 },
  { name: 'SW', dq: -1, dr: +1, ds: 0 },
  { name: 'W',  dq: -1, dr: 0,  ds: +1 },
  { name: 'NW', dq: 0,  dr: -1, ds: +1 },
]

/**
 * Create a string key from cube coordinates
 */
export function cubeKey(q: number, r: number, s: number): string {
  return `${q},${r},${s}`
}

/**
 * Parse a cube key string back to {q, r, s}
 */
export function parseCubeKey(key: string): CubeCoord {
  const [q, r, s] = key.split(',').map(Number)
  return { q, r, s }
}

/**
 * Convert offset coordinates (col, row) to cube coordinates (q, r, s)
 * Using odd-r offset (pointy-top hex tiles)
 */
export function offsetToCube(col: number, row: number): CubeCoord {
  const q = col - Math.floor(row / 2)
  const r = row
  const s = -q - r
  return { q, r, s }
}

/**
 * Convert cube coordinates to offset coordinates
 */
export function cubeToOffset(q: number, r: number, _s: number): OffsetCoord {
  const col = q + Math.floor(r / 2)
  const row = r
  return { col, row }
}

/**
 * Convert local grid coordinates to global offset coordinates
 */
export function localToGlobalCoords(
  x: number,
  z: number,
  gridRadius: number,
  globalCenterCube: CubeCoord,
): OffsetCoord {
  const localCol = x - gridRadius
  const localRow = z - gridRadius
  const localCube = offsetToCube(localCol, localRow)
  const globalCube: CubeCoord = {
    q: localCube.q + globalCenterCube.q,
    r: localCube.r + globalCenterCube.r,
    s: localCube.s + globalCenterCube.s,
  }
  return cubeToOffset(globalCube.q, globalCube.r, globalCube.s)
}

/**
 * Convert global cube coordinates to local grid array indices
 */
export function globalToLocalGrid(
  globalCube: CubeCoord,
  globalCenterCube: CubeCoord,
  gridRadius: number,
): { gridX: number; gridZ: number } {
  const localCube: CubeCoord = {
    q: globalCube.q - globalCenterCube.q,
    r: globalCube.r - globalCenterCube.r,
    s: globalCube.s - globalCenterCube.s,
  }
  const localOffset = cubeToOffset(localCube.q, localCube.r, localCube.s)
  return {
    gridX: localOffset.col + gridRadius,
    gridZ: localOffset.row + gridRadius,
  }
}

/**
 * Get all cube coordinates within a hex radius of a center point
 */
export function cubeCoordsInRadius(cq: number, cr: number, cs: number, radius: number): CubeCoord[] {
  const coords: CubeCoord[] = []
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      const s = -q - r
      coords.push({ q: cq + q, r: cr + r, s: cs + s })
    }
  }
  return coords
}

/**
 * Calculate hex distance between two cube coordinates
 */
export function cubeDistance(q1: number, r1: number, s1: number, q2: number, r2: number, s2: number): number {
  return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2))
}

/**
 * Check if two edges are compatible (edge type + level must match)
 */
export function edgesCompatible(edgeTypeA: string, levelA: number, edgeTypeB: string, levelB: number): boolean {
  if (edgeTypeA !== edgeTypeB) return false
  // Grass edges can connect at any level (used for seed replacement compatibility)
  if (edgeTypeA === 'grass') return true
  // Other edges (road, water, etc.) must match levels
  return levelA === levelB
}

// Cache for rotated high edges: Map<"type_rotation", Set<dir>>
const highEdgeCache = new Map<string, Set<HexDirName>>()

/**
 * Get the level for a specific edge of a tile
 * Slopes have different levels on high vs low edges
 * Uses levelIncrement from tile definition (default 1)
 */
export function getEdgeLevel(tileType: number, rotation: number, dir: HexDirName, baseLevel: number): number {
  const def = TILE_LIST[tileType]
  if (!def || !def.highEdges) {
    return baseLevel
  }

  const cacheKey = `${tileType}_${rotation}`
  let highEdges = highEdgeCache.get(cacheKey)

  if (!highEdges) {
    highEdges = new Set<HexDirName>()
    for (const highDir of def.highEdges) {
      const dirIndex = HexDir.indexOf(highDir)
      const rotatedIndex = (dirIndex + rotation) % 6
      highEdges.add(HexDir[rotatedIndex])
    }
    highEdgeCache.set(cacheKey, highEdges)
  }

  const levelIncrement = def.levelIncrement ?? 1
  return highEdges.has(dir) ? baseLevel + levelIncrement : baseLevel
}

/**
 * HexWFCCell - Tracks possibility space for one hex grid cell
 */
export class HexWFCCell {
  possibilities: Set<string>
  collapsed: boolean
  tile: WFCState | null

  constructor(allStates: WFCState[]) {
    this.possibilities = new Set(allStates.map(s => HexWFCCell.stateKey(s)))
    this.collapsed = false
    this.tile = null
  }

  static stateKey(state: WFCState): string {
    return `${state.type}_${state.rotation}_${state.level ?? 0}`
  }

  static parseKey(key: string): WFCState {
    const [type, rotation, level] = key.split('_').map(Number)
    return { type, rotation, level: level ?? 0 }
  }

  get entropy(): number {
    if (this.collapsed) return 0
    return Math.log(this.possibilities.size) + random() * 0.001
  }

  collapse(state: WFCState): void {
    this.possibilities.clear()
    this.possibilities.add(HexWFCCell.stateKey(state))
    this.collapsed = true
    this.tile = state
  }

  remove(stateKey: string): boolean {
    return this.possibilities.delete(stateKey)
  }

  has(stateKey: string): boolean {
    return this.possibilities.has(stateKey)
  }
}

/**
 * HexWFCAdjacencyRules - Pre-computed tile compatibility for hex grids
 * Handles offset coordinate asymmetry by indexing by edge type
 */
export class HexWFCAdjacencyRules {
  allowed: Map<string, Record<string, Set<string>>>
  stateEdges: Map<string, Record<HexDirName, EdgeInfo>>
  // 3D index: edgeType → dir → level → Set<stateKey>
  byEdge: Map<string, Record<HexDirName, (Set<string> | undefined)[]>>

  constructor() {
    this.allowed = new Map()
    this.stateEdges = new Map()
    this.byEdge = new Map()
  }

  /**
   * Build adjacency rules from TILE_LIST
   */
  static fromTileDefinitions(tileTypes: number[] | null = null): HexWFCAdjacencyRules {
    const rules = new HexWFCAdjacencyRules()
    const types = tileTypes ?? TILE_LIST.map((_, i) => i)

    const allStates: WFCState[] = []
    for (const type of types) {
      const def = TILE_LIST[type]
      if (!def) continue

      const isSlope = def.highEdges && def.highEdges.length > 0

      for (let rotation = 0; rotation < 6; rotation++) {
        if (isSlope) {
          const increment = def.levelIncrement ?? 1
          const maxBaseLevel = LEVELS_COUNT - 1 - increment
          for (let level = 0; level <= maxBaseLevel; level++) {
            allStates.push({ type, rotation, level })
          }
        } else {
          for (let level = 0; level < LEVELS_COUNT; level++) {
            allStates.push({ type, rotation, level })
          }
        }
      }
    }

    for (const state of allStates) {
      const stateKey = HexWFCCell.stateKey(state)
      const edges = rotateHexEdges(TILE_LIST[state.type].edges, state.rotation)
      const stateEdgeInfo = {} as Record<HexDirName, EdgeInfo>

      for (const dir of HexDir) {
        const edgeType = edges[dir]
        const edgeLevel = getEdgeLevel(state.type, state.rotation, dir, state.level)
        stateEdgeInfo[dir] = { type: edgeType, level: edgeLevel }

        if (!rules.byEdge.has(edgeType)) {
          const dirMap = {} as Record<HexDirName, (Set<string> | undefined)[]>
          for (const d of HexDir) dirMap[d] = []
          rules.byEdge.set(edgeType, dirMap)
        }
        const levelIndex = rules.byEdge.get(edgeType)![dir]
        if (!levelIndex[edgeLevel]) {
          levelIndex[edgeLevel] = new Set()
        }
        levelIndex[edgeLevel]!.add(stateKey)
      }

      rules.stateEdges.set(stateKey, stateEdgeInfo)
    }

    return rules
  }

  getAllowed(stateKey: string, direction: string): Set<string> {
    return this.allowed.get(stateKey)?.[direction] ?? new Set()
  }

  /**
   * Get states that have a specific edge type, direction, AND level
   * O(1) lookup - used for fast constraint propagation
   */
  getByEdge(edgeType: string, direction: HexDirName, level: number): Set<string> {
    return this.byEdge.get(edgeType)?.[direction]?.[level] ?? new Set()
  }

  isAllowed(stateKeyA: string, direction: string, stateKeyB: string): boolean {
    return this.allowed.get(stateKeyA)?.[direction]?.has(stateKeyB) ?? false
  }
}

/**
 * Grid-level coordinate utilities for flat-top hex grid-of-grids
 * Handles grid management, world position calculations, and grid neighbor logic
 */

import { offsetToCube, cubeToOffset, localToGlobalCoords } from './HexWFCCore.js'
import type { CubeCoord } from './HexWFCCore.js'

// Re-export for consumers that still import from here
export { offsetToCube, cubeToOffset, localToGlobalCoords }

// ============================================================================
// Grid Direction & Management
// ============================================================================

/**
 * Direction enum for grid expansion (6 directions for flat-top hex)
 * Flat-top hex has flat edges at N and S, vertices at E and W
 * So the 6 neighbor directions are: N, NE, SE, S, SW, NW (no E or W!)
 */
export const GridDirection = {
  N: 0,
  NE: 1,
  SE: 2,
  S: 3,
  SW: 4,
  NW: 5,
} as const

export type GridDirectionValue = typeof GridDirection[keyof typeof GridDirection]

/**
 * Get the opposite grid direction
 */
export function getOppositeDirection(dir: GridDirectionValue): GridDirectionValue {
  const opposites: Record<GridDirectionValue, GridDirectionValue> = {
    [GridDirection.N]: GridDirection.S,
    [GridDirection.NE]: GridDirection.SW,
    [GridDirection.SE]: GridDirection.NW,
    [GridDirection.S]: GridDirection.N,
    [GridDirection.SW]: GridDirection.NE,
    [GridDirection.NW]: GridDirection.SE,
  }
  return opposites[dir]
}

/**
 * Get grid key from coordinates
 */
export function getGridKey(gridX: number, gridZ: number): string {
  return `${gridX},${gridZ}`
}

/**
 * Parse grid key to coordinates
 */
export function parseGridKey(key: string): { x: number; z: number } {
  const [x, z] = key.split(',').map(Number)
  return { x, z }
}

interface HexOffset2D {
  dx: number
  dz: number
}

/**
 * Get adjacent grid key in a direction
 * For flat-top hex grid, the coordinate offsets depend on column parity (odd-q system)
 */
export function getAdjacentGridKey(currentKey: string, direction: GridDirectionValue): string {
  const { x, z } = parseGridKey(currentKey)

  // Flat-top hex: odd-q offset coordinates
  const isOddCol = Math.abs(x) % 2 === 1

  const offsets: Record<GridDirectionValue, HexOffset2D> = isOddCol ? {
    [GridDirection.N]:  { dx: 0, dz: -1 },
    [GridDirection.NE]: { dx: 1, dz: 0 },
    [GridDirection.SE]: { dx: 1, dz: 1 },
    [GridDirection.S]:  { dx: 0, dz: 1 },
    [GridDirection.SW]: { dx: -1, dz: 1 },
    [GridDirection.NW]: { dx: -1, dz: 0 },
  } : {
    [GridDirection.N]:  { dx: 0, dz: -1 },
    [GridDirection.NE]: { dx: 1, dz: -1 },
    [GridDirection.SE]: { dx: 1, dz: 0 },
    [GridDirection.S]:  { dx: 0, dz: 1 },
    [GridDirection.SW]: { dx: -1, dz: 0 },
    [GridDirection.NW]: { dx: -1, dz: -1 },
  }

  const { dx, dz } = offsets[direction]
  return getGridKey(x + dx, z + dz)
}

// ============================================================================
// World Position Utilities
// ============================================================================

/**
 * Hex dimensions (must match HexTileGeometry)
 */
const HEX_WIDTH = 2
const HEX_HEIGHT = 2 / Math.sqrt(3) * 2

interface WorldPos {
  x: number
  z: number
}

/**
 * Get world position for a tile at offset coordinates
 */
export function getWorldPos(offsetCol: number, offsetRow: number): WorldPos {
  const x = offsetCol * HEX_WIDTH + (Math.abs(offsetRow) % 2) * HEX_WIDTH * 0.5
  const z = offsetRow * HEX_HEIGHT * 0.75
  return { x, z }
}

/**
 * Convert world position to offset coordinates (inverse of getWorldPos)
 */
export function worldToOffset(worldX: number, worldZ: number): { col: number; row: number } {
  const row = Math.round(worldZ / (HEX_HEIGHT * 0.75))
  const stagger = (Math.abs(row) % 2) * HEX_WIDTH * 0.5
  const col = Math.round((worldX - stagger) / HEX_WIDTH)
  return { col, row }
}

/**
 * Convert a grid's world offset to its center in global cube coordinates
 */
export function worldOffsetToGlobalCube(worldOffset: WorldPos): CubeCoord {
  const offset = worldToOffset(worldOffset.x, worldOffset.z)
  return offsetToCube(offset.col, offset.row)
}

/**
 * Calculate world offset for a new grid in a given direction
 */
export function getGridWorldOffset(
  gridRadius: number,
  direction: GridDirectionValue,
  hexWidth: number = 2,
  hexHeight: number | null = null,
): WorldPos {
  if (!hexHeight) {
    hexHeight = 2 / Math.sqrt(3) * 2
  }

  const d = gridRadius * 2 + 1
  const gridW = d * hexWidth
  const gridH = d * hexHeight * 0.75
  const half = hexWidth * 0.5

  const offsets: Record<GridDirectionValue, WorldPos> = {
    [GridDirection.N]:  { x: half, z: -gridH },
    [GridDirection.S]:  { x: -half, z: gridH },
    [GridDirection.NE]: { x: gridW * 0.75 + half * 0.5, z: -gridH * 0.5 + half * 0.866 },
    [GridDirection.SE]: { x: gridW * 0.75 - half * 0.5, z: gridH * 0.5 + half * 0.866 },
    [GridDirection.SW]: { x: -gridW * 0.75 - half * 0.5, z: gridH * 0.5 - half * 0.866 },
    [GridDirection.NW]: { x: -gridW * 0.75 + half * 0.5, z: -gridH * 0.5 - half * 0.866 },
  }

  return offsets[direction]
}

/**
 * Convert pointy-top hex offset coordinates to world position
 */
export function pointyTopHexToWorld(col: number, row: number, w: number, h: number): WorldPos {
  const x = col * w + (Math.abs(row) % 2) * w * 0.5
  const z = row * h * 0.75
  return { x, z }
}

/**
 * Convert flat-top hex offset coordinates to world position
 */
export function flatTopHexToWorld(col: number, row: number, w: number, h: number): WorldPos {
  const x = col * w * 0.75
  const z = row * h + (Math.abs(col) % 2) * h * 0.5
  return { x, z }
}

/**
 * Pure tile data - no browser/Three.js dependencies
 * This file can be safely imported by web workers
 */

/**
 * Number of elevation levels in the WFC system
 */
export const LEVELS_COUNT = 5

/**
 * Edge type strings used in tile definitions
 */
export type EdgeType = 'grass' | 'road' | 'river' | 'water' | 'coast'

/**
 * Hex direction names for pointy-top orientation
 */
export type HexDirName = 'NE' | 'E' | 'SE' | 'SW' | 'W' | 'NW'

/**
 * Edge map: direction → edge type
 */
export type HexEdges = Record<HexDirName, EdgeType>

/**
 * Tile definition
 */
export interface TileDef {
  name: string
  mesh: string
  edges: HexEdges
  weight: number
  highEdges?: HexDirName[]
  levelIncrement?: number
  preventChaining?: boolean
  debug?: { color: number; stripe?: string; yOffset?: number }
}

/**
 * Consolidated tile definitions - single source of truth
 * Array index IS the tile's numeric ID (used internally during a session only)
 */
export const TILE_LIST: TileDef[] = [
  // Base
  { name: 'GRASS', mesh: 'hex_grass',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'grass', NW: 'grass' },
    weight: 500 },
  { name: 'WATER', mesh: 'hex_water',
    edges: { NE: 'water', E: 'water', SE: 'water', SW: 'water', W: 'water', NW: 'water' },
    weight: 500 },

  // Roads
  { name: 'ROAD_A', mesh: 'hex_road_A',
    edges: { NE: 'grass', E: 'road', SE: 'grass', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 30 },
  { name: 'ROAD_B', mesh: 'hex_road_B',
    edges: { NE: 'road', E: 'grass', SE: 'grass', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 8 },
  { name: 'ROAD_D', mesh: 'hex_road_D',
    edges: { NE: 'road', E: 'grass', SE: 'road', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 2, preventChaining: true },
  { name: 'ROAD_E', mesh: 'hex_road_E',
    edges: { NE: 'road', E: 'road', SE: 'grass', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 2, preventChaining: true },
  { name: 'ROAD_F', mesh: 'hex_road_F',
    edges: { NE: 'grass', E: 'road', SE: 'road', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 2, preventChaining: true },
  { name: 'ROAD_END', mesh: 'hex_road_M',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 1, preventChaining: true },

  // Rivers
  { name: 'RIVER_A', mesh: 'hex_river_A',
    edges: { NE: 'grass', E: 'river', SE: 'grass', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 20 },
  { name: 'RIVER_A_CURVY', mesh: 'hex_river_A_curvy',
    edges: { NE: 'grass', E: 'river', SE: 'grass', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 20 },
  { name: 'RIVER_B', mesh: 'hex_river_B',
    edges: { NE: 'river', E: 'grass', SE: 'grass', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 30 },
  { name: 'RIVER_D', mesh: 'hex_river_D',
    edges: { NE: 'river', E: 'grass', SE: 'river', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 4, preventChaining: true },
  { name: 'RIVER_E', mesh: 'hex_river_E',
    edges: { NE: 'river', E: 'river', SE: 'grass', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 4, preventChaining: true },
  { name: 'RIVER_F', mesh: 'hex_river_F',
    edges: { NE: 'grass', E: 'river', SE: 'river', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 4, preventChaining: true },
  { name: 'RIVER_END', mesh: 'river_end',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 4, preventChaining: true, debug: { color: 0xff0000, stripe: 'W' } },

  // Coasts
  { name: 'COAST_A', mesh: 'hex_coast_A',
    edges: { NE: 'grass', E: 'coast', SE: 'water', SW: 'coast', W: 'grass', NW: 'grass' },
    weight: 20 },
  { name: 'COAST_B', mesh: 'hex_coast_B',
    edges: { NE: 'grass', E: 'coast', SE: 'water', SW: 'water', W: 'coast', NW: 'grass' },
    weight: 15 },
  { name: 'COAST_C', mesh: 'hex_coast_C',
    edges: { NE: 'coast', E: 'water', SE: 'water', SW: 'water', W: 'coast', NW: 'grass' },
    weight: 15 },
  { name: 'COAST_D', mesh: 'hex_coast_D',
    edges: { NE: 'water', E: 'water', SE: 'water', SW: 'water', W: 'coast', NW: 'coast' },
    weight: 15, preventChaining: true },
  { name: 'COAST_E', mesh: 'hex_coast_E',
    edges: { NE: 'grass', E: 'grass', SE: 'coast', SW: 'coast', W: 'grass', NW: 'grass' },
    weight: 10, preventChaining: true },

  // Coast slope (debug)
  { name: 'COAST_SLOPE_A_LOW', mesh: 'coast_slope_low',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'coast', W: 'water', NW: 'coast' },
    weight: 1, highEdges: ['NE', 'E', 'SE'], levelIncrement: 1, debug: { color: 0xff0000, stripe: 'W' } },
  { name: 'COAST_SLOPE_A_HIGH', mesh: 'coast_slope_high',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'coast', W: 'water', NW: 'coast' },
    weight: 1, highEdges: ['NE', 'E', 'SE'], levelIncrement: 2, debug: { color: 0xff0000, stripe: 'W', yOffset: 0.5 } },

  // River slope (debug)
  { name: 'RIVER_A_SLOPE_LOW', mesh: 'river_slope_low',
    edges: { NE: 'grass', E: 'river', SE: 'grass', SW: 'grass', W: 'river', NW: 'grass' },
    weight: 1, highEdges: ['NE', 'E', 'SE'], levelIncrement: 1, debug: { color: 0xff0000, stripe: 'W' } },

  // River-into-coast (debug)
  { name: 'RIVER_INTO_COAST', mesh: 'river_coast',
    edges: { NE: 'coast', E: 'water', SE: 'water', SW: 'water', W: 'coast', NW: 'river' },
    weight: 3, preventChaining: true, debug: { color: 0xff0000, stripe: 'NW' } },

  // Crossings
  { name: 'RIVER_CROSSING_A', mesh: 'hex_river_crossing_A',
    edges: { NE: 'grass', E: 'river', SE: 'road', SW: 'grass', W: 'river', NW: 'road' },
    weight: 4, preventChaining: true },
  { name: 'RIVER_CROSSING_B', mesh: 'hex_river_crossing_B',
    edges: { NE: 'road', E: 'river', SE: 'grass', SW: 'road', W: 'river', NW: 'grass' },
    weight: 4, preventChaining: true },

  // High slopes (2-level rise)
  { name: 'GRASS_SLOPE_HIGH', mesh: 'hex_grass_sloped_high',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'grass', NW: 'grass' },
    weight: 20, highEdges: ['NE', 'E', 'SE'], levelIncrement: 2 },
  { name: 'ROAD_A_SLOPE_HIGH', mesh: 'hex_road_A_sloped_high',
    edges: { NE: 'grass', E: 'road', SE: 'grass', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 12, highEdges: ['NE', 'E', 'SE'], levelIncrement: 2 },
  { name: 'GRASS_CLIFF', mesh: 'hex_grass',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'grass', NW: 'grass' },
    weight: 6, highEdges: ['NE', 'E', 'SE'], levelIncrement: 2 },
  { name: 'GRASS_CLIFF_C', mesh: 'hex_grass',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'grass', NW: 'grass' },
    weight: 6, highEdges: ['E'], levelIncrement: 2 },

  // Low slopes (1-level rise)
  { name: 'GRASS_SLOPE_LOW', mesh: 'hex_grass_sloped_low',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'grass', NW: 'grass' },
    weight: 20, highEdges: ['NE', 'E', 'SE'], levelIncrement: 1 },
  { name: 'ROAD_A_SLOPE_LOW', mesh: 'hex_road_A_sloped_low',
    edges: { NE: 'grass', E: 'road', SE: 'grass', SW: 'grass', W: 'road', NW: 'grass' },
    weight: 12, highEdges: ['NE', 'E', 'SE'], levelIncrement: 1 },
  { name: 'GRASS_CLIFF_LOW', mesh: 'hex_grass',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'grass', NW: 'grass' },
    weight: 6, highEdges: ['NE', 'E', 'SE'], levelIncrement: 1 },
  { name: 'GRASS_CLIFF_LOW_C', mesh: 'hex_grass',
    edges: { NE: 'grass', E: 'grass', SE: 'grass', SW: 'grass', W: 'grass', NW: 'grass' },
    weight: 6, highEdges: ['E'], levelIncrement: 1 },
]

/**
 * Name → index lookup (derived from TILE_LIST)
 * e.g. TileType.GRASS === 0, TileType.WATER === 1
 */
export const TileType: Record<string, number> = Object.fromEntries(TILE_LIST.map((t, i) => [t.name, i]))

/**
 * Hex directions (6 edges) for pointy-top orientation
 */
export const HexDir: HexDirName[] = ['NE', 'E', 'SE', 'SW', 'W', 'NW']

export const HexOpposite: Record<HexDirName, HexDirName> = {
  NE: 'SW',
  E: 'W',
  SE: 'NW',
  SW: 'NE',
  W: 'E',
  NW: 'SE',
}

/**
 * Hex neighbor offset
 */
export interface HexOffset {
  dx: number
  dz: number
}

/**
 * Hex neighbor offsets for odd-r offset coordinates (pointy-top)
 */
export const HexNeighborOffsets: Record<'even' | 'odd', Record<HexDirName, HexOffset>> = {
  even: {
    NE: { dx: 0, dz: -1 },
    E:  { dx: 1, dz: 0 },
    SE: { dx: 0, dz: 1 },
    SW: { dx: -1, dz: 1 },
    W:  { dx: -1, dz: 0 },
    NW: { dx: -1, dz: -1 },
  },
  odd: {
    NE: { dx: 1, dz: -1 },
    E:  { dx: 1, dz: 0 },
    SE: { dx: 1, dz: 1 },
    SW: { dx: 0, dz: 1 },
    W:  { dx: -1, dz: 0 },
    NW: { dx: 0, dz: -1 },
  },
}

/**
 * Get neighbor offset for a hex position
 */
export function getHexNeighborOffset(x: number, z: number, dir: HexDirName): HexOffset {
  const parity = (z % 2 === 0) ? 'even' : 'odd'
  return HexNeighborOffsets[parity][dir]
}

/**
 * Rotate hex edges by N steps (each step = 60°)
 */
export function rotateHexEdges(edges: HexEdges, rotation: number): HexEdges {
  const rotated = {} as HexEdges
  for (let i = 0; i < 6; i++) {
    const fromDir = HexDir[i]
    const toDir = HexDir[(i + rotation) % 6]
    rotated[toDir] = edges[fromDir]
  }
  return rotated
}

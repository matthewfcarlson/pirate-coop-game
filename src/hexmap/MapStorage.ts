/**
 * Serializes and deserializes HexMap state to/from sessionStorage
 */

const STORAGE_KEY = 'hexmap-state'

export interface SerializedCell {
  q: number
  r: number
  s: number
  type: number
  rotation: number
  level: number
  gridKey: string
}

export interface SerializedGrid {
  key: string
  x: number
  z: number
  state: string
}

export interface SerializedMapState {
  version: number
  seed: number
  waterSideIndex: number | null
  grids: SerializedGrid[]
  cells: SerializedCell[]
}

/** Minimal interface for the parts of HexMap we need to serialize */
interface SerializableHexMap {
  grids: Map<string, { gridCoords: { x: number; z: number }; state: string }>
  globalCells: Map<string, SerializedCell>
  _waterSideIndex: number | null
}

/**
 * Extract serializable state from a HexMap instance
 */
export function serializeMap(hexMap: SerializableHexMap, seed: number): SerializedMapState {
  const grids: SerializedGrid[] = []
  for (const [key, grid] of hexMap.grids) {
    grids.push({
      key,
      x: grid.gridCoords.x,
      z: grid.gridCoords.z,
      state: grid.state,
    })
  }

  // Convert globalCells Map to array of plain objects
  const cells: SerializedCell[] = []
  for (const [, cell] of hexMap.globalCells) {
    cells.push({
      q: cell.q,
      r: cell.r,
      s: cell.s,
      type: cell.type,
      rotation: cell.rotation,
      level: cell.level,
      gridKey: cell.gridKey,
    })
  }

  return {
    version: 1,
    seed,
    waterSideIndex: hexMap._waterSideIndex,
    grids,
    cells,
  }
}

/**
 * Save map state to sessionStorage
 */
export function saveToSession(hexMap: SerializableHexMap, seed: number): void {
  try {
    const state = serializeMap(hexMap, seed)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('[MapStorage] Failed to save:', e)
  }
}

/**
 * Load map state from sessionStorage
 */
export function loadFromSession(): SerializedMapState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as SerializedMapState
    if (state.version !== 1) return null
    return state
  } catch (e) {
    console.warn('[MapStorage] Failed to load:', e)
    return null
  }
}

/**
 * Clear saved map state from sessionStorage
 */
export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

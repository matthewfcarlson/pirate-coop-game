/**
 * Serializes and deserializes HexMap state to/from sessionStorage
 */

const STORAGE_KEY = 'hexmap-state'

/**
 * Extract serializable state from a HexMap instance
 * @param {import('./HexMap.js').HexMap} hexMap
 * @param {number} seed - The current RNG seed
 * @returns {object} Serializable state object
 */
export function serializeMap(hexMap, seed) {
  const grids = []
  for (const [key, grid] of hexMap.grids) {
    grids.push({
      key,
      x: grid.gridCoords.x,
      z: grid.gridCoords.z,
      state: grid.state,
    })
  }

  // Convert globalCells Map to array of plain objects
  const cells = []
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
 * @param {import('./HexMap.js').HexMap} hexMap
 * @param {number} seed
 */
export function saveToSession(hexMap, seed) {
  try {
    const state = serializeMap(hexMap, seed)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('[MapStorage] Failed to save:', e)
  }
}

/**
 * Load map state from sessionStorage
 * @returns {object|null} Saved state or null if none exists
 */
export function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw)
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
export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

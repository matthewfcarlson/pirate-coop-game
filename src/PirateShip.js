import { Vector3, MathUtils, Plane, MeshBasicNodeMaterial } from 'three/webgpu'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { TILE_LIST } from './hexmap/HexTileData.js'
import { worldToOffset, getWorldPos } from './hexmap/HexGridConnector.js'
import { offsetToCube, cubeKey, cubeToOffset } from './hexmap/HexWFCCore.js'

const WATER_Y = 0.92
const SHIP_MAX_SPEED = 5     // top speed (world units/sec)
const SHIP_ACCEL = 1.5       // how fast the ship builds speed
const SHIP_DECEL = 0.6       // natural drag when not thrusting
const SHIP_TURN_SPEED = 1.2  // max turn rate at full speed (rad/sec)
const BOB_SPEED = 1.5
const BOB_AMOUNT = 0.08
const ROCK_SPEED = 0.7       // idle rocking frequency
const ROCK_AMOUNT = 0.06     // idle rocking amplitude (radians)
const SLIDE_SPEED = 3        // speed at which grounded ship slides toward water

// Tile names that count as navigable water
const WATER_TILE_NAMES = new Set(['WATER', 'COAST_B', 'COAST_C', 'COAST_D'])

function isWaterTile(tileName) {
  return WATER_TILE_NAMES.has(tileName)
}

/**
 * Player-controlled pirate ship that sails on the water plane.
 * Supports WASD/arrow keys and gamepad input.
 * Checks globalCells to prevent sailing onto land.
 */
export class PirateShip {
  constructor(scene) {
    this.scene = scene
    this.model = null
    this.heading = 0 // radians, 0 = +Z
    this.speed = 0
    this.position = new Vector3(0, WATER_Y, 0)
    this._time = 0
    this._aground = false

    // References set by App after HexMap init
    this.globalCells = null
    this.grids = null // Map of HexGrid instances (for finding shipyards)

    // Input state
    this._keys = { forward: false, backward: false, left: false, right: false }
    this._onKeyDown = this._handleKey.bind(this, true)
    this._onKeyUp = this._handleKey.bind(this, false)
  }

  async init() {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync('./assets/models/sail-ship.glb')
    this.model = gltf.scene

    // Clipping plane at water surface — clips hull below waterline
    this._waterClipPlane = new Plane(new Vector3(0, 1, 0), -WATER_Y)
    // Black material for water mask pass (punches hole in water effects)
    this._maskMaterial = new MeshBasicNodeMaterial({ color: 0x000000 })
    this._maskMaterial.clippingPlanes = [this._waterClipPlane]
    this._savedMaterials = new Map()

    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Clip at water surface so hull below waterline is hidden
        child.material.clippingPlanes = [this._waterClipPlane]
      }
    })
    // Scale to fit hex tiles — adjust as needed
    this.model.scale.setScalar(0.5)
    this.model.position.copy(this.position)
    this.scene.add(this.model)
  }

  /**
   * Swap ship materials to black for water mask pass, or restore originals.
   */
  setWaterMaskMode(enabled) {
    if (!this.model) return
    if (enabled) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          this._savedMaterials.set(child, child.material)
          child.material = this._maskMaterial
        }
      })
    } else {
      for (const [mesh, mat] of this._savedMaterials) mesh.material = mat
      this._savedMaterials.clear()
    }
  }

  /**
   * Find a shipyard decoration across all grids and return the world position
   * of the water tile in front of it (where the ship should spawn).
   * Returns {x, z, heading} or null if no shipyard exists.
   */
  _findShipyardSpawn() {
    if (!this.grids) return null

    for (const grid of this.grids.values()) {
      if (!grid.decorations) continue
      for (const b of grid.decorations.buildings) {
        if (!b.meshName.includes('shipyard')) continue
        // The shipyard faces waterAngle (stored as rotationY).
        // Spawn the ship a couple hex widths out in that direction (into the water).
        const tile = b.tile
        const gridRadius = grid.gridRadius
        const localCol = tile.gridX - gridRadius
        const localRow = tile.gridZ - gridRadius
        const localWP = getWorldPos(localCol, localRow)
        const wx = grid.worldOffset.x + localWP.x
        const wz = grid.worldOffset.z + localWP.z

        // Move out from the shipyard into water (rotationY is the facing angle)
        const spawnDist = 4 // world units into the water
        const sx = wx + Math.sin(b.rotationY) * spawnDist
        const sz = wz + Math.cos(b.rotationY) * spawnDist

        return { x: sx, z: sz, heading: b.rotationY }
      }
    }
    return null
  }

  /**
   * Find the world position of the nearest water tile to the ship.
   * Returns {x, z} or null if no water tiles exist.
   */
  _findNearestWater() {
    if (!this.globalCells) return null

    let bestPos = null
    let bestDist = Infinity

    for (const cell of this.globalCells.values()) {
      const def = TILE_LIST[cell.type]
      if (!def || !isWaterTile(def.name)) continue

      const { col, row } = cubeToOffset(cell.q, cell.r, cell.s)
      const wp = getWorldPos(col, row)

      const dist = (wp.x - this.position.x) ** 2 + (wp.z - this.position.z) ** 2
      if (dist < bestDist) {
        bestDist = dist
        bestPos = wp
      }
    }

    return bestPos
  }

  enable() {
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    if (this.model) this.model.visible = true

    // Try to spawn at a shipyard, then nearest water, then stay put
    const shipyard = this._findShipyardSpawn()
    if (shipyard) {
      this.position.x = shipyard.x
      this.position.z = shipyard.z
      this.heading = shipyard.heading
    } else if (!this._isWaterAt(this.position.x, this.position.z)) {
      const wp = this._findNearestWater()
      if (wp) {
        this.position.x = wp.x
        this.position.z = wp.z
      }
    }
    this.position.y = WATER_Y
    this._aground = false
    this.speed = 0
    if (this.model) this.model.position.copy(this.position)
  }

  disable() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    this._keys.forward = this._keys.backward = this._keys.left = this._keys.right = false
    this.speed = 0
    this._aground = false
    if (this.model) this.model.visible = false
  }

  _handleKey(down, e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this._keys.forward = down; break
      case 'KeyS': case 'ArrowDown':  this._keys.backward = down; break
      case 'KeyA': case 'ArrowLeft':  this._keys.left = down; break
      case 'KeyD': case 'ArrowRight': this._keys.right = down; break
    }
  }

  _readGamepad() {
    const gamepads = navigator.getGamepads?.()
    if (!gamepads) return { x: 0, y: 0 }
    for (const gp of gamepads) {
      if (!gp) continue
      let x = gp.axes[0] || 0
      let y = gp.axes[1] || 0
      if (Math.abs(x) < 0.15) x = 0
      if (Math.abs(y) < 0.15) y = 0
      if (x !== 0 || y !== 0) return { x, y }
    }
    return { x: 0, y: 0 }
  }

  /**
   * Check if a world position is on a water tile.
   * Positions outside any known tile (open space) are also treated as water
   * so the ship can sail in unexplored/empty areas.
   */
  _isWaterAt(wx, wz) {
    if (!this.globalCells) return true
    const { col, row } = worldToOffset(wx, wz)
    const { q, r, s } = offsetToCube(col, row)
    const key = cubeKey(q, r, s)
    const cell = this.globalCells.get(key)
    if (!cell) return true // no tile = open water / unexplored
    const def = TILE_LIST[cell.type]
    return def && isWaterTile(def.name)
  }

  update(dt) {
    if (!this.model) return

    this._time += dt

    // Combine keyboard + gamepad input
    const gp = this._readGamepad()
    let turnInput = (this._keys.left ? -1 : 0) + (this._keys.right ? 1 : 0) + gp.x
    let thrustInput = (this._keys.forward ? 1 : 0) + (this._keys.backward ? -1 : 0) - gp.y

    turnInput = MathUtils.clamp(turnInput, -1, 1)
    thrustInput = MathUtils.clamp(thrustInput, -1, 1)

    // Ship-like physics: rudder only works when moving
    // Turn rate scales with speed — can't steer a stationary ship
    const speedRatio = Math.abs(this.speed) / SHIP_MAX_SPEED
    const effectiveTurn = turnInput * SHIP_TURN_SPEED * Math.min(speedRatio * 2, 1) * dt
    this.heading -= effectiveTurn  // negated to fix left/right

    // Acceleration / deceleration with momentum
    if (thrustInput !== 0) {
      // Thrust: gradually build speed
      this.speed += thrustInput * SHIP_ACCEL * dt
    } else {
      // No input: drag slows the ship down gradually
      this.speed *= (1 - SHIP_DECEL * dt)
    }

    // Clamp speed
    this.speed = MathUtils.clamp(this.speed, -SHIP_MAX_SPEED * 0.3, SHIP_MAX_SPEED)
    if (Math.abs(this.speed) < 0.02) this.speed = 0

    // Compute candidate position
    const nx = this.position.x + Math.sin(this.heading) * this.speed * dt
    const nz = this.position.z + Math.cos(this.heading) * this.speed * dt

    if (this._isWaterAt(nx, nz)) {
      // Clear water — sail freely
      this.position.x = nx
      this.position.z = nz
      this._aground = false
    } else {
      // Land — run aground: kill forward speed, slide toward nearest water
      this.speed *= (1 - 4 * dt)
      this._aground = true

      const waterTarget = this._findNearestWater()
      if (waterTarget) {
        const dx = waterTarget.x - this.position.x
        const dz = waterTarget.z - this.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0.1) {
          const slide = Math.min(SLIDE_SPEED * dt, dist)
          this.position.x += (dx / dist) * slide
          this.position.z += (dz / dist) * slide
        }
      }
    }

    // Bob on water
    this.position.y = WATER_Y + Math.sin(this._time * BOB_SPEED) * BOB_AMOUNT

    this.model.position.copy(this.position)
    this.model.rotation.y = this.heading

    // Idle side-to-side rocking (always present, slower than bob)
    const idleRock = Math.sin(this._time * ROCK_SPEED) * ROCK_AMOUNT
    // Heel into turns — proportional to turn rate and speed
    const turnRoll = effectiveTurn * 8
    this.model.rotation.z = idleRock + turnRoll

    // Gentle pitch from bobbing
    this.model.rotation.x = Math.cos(this._time * BOB_SPEED) * 0.02
  }
}

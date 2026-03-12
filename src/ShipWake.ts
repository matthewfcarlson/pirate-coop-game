import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicNodeMaterial,
  DoubleSide,
  Scene,
} from 'three/webgpu'
import { attribute, uniform, vec3, float } from 'three/tsl'

const TRAIL_LENGTH = 50
const V_SPREAD = 4.0          // max perpendicular spread of each V arm at tail
const ARM_WIDTH_START = 0.08   // ribbon width at ship stern
const ARM_WIDTH_END = 0.4      // ribbon width at tail end
const WAKE_Y = 0.925           // just above water surface (0.92)

interface TrailPoint {
  x: number
  z: number
  heading: number
}

/**
 * V-shaped wake trail behind the pirate ship.
 * Rendered in the water layer (additive compositing).
 */
export class ShipWake {
  scene: Scene
  mesh: Mesh | null
  _trail: TrailPoint[]
  _intensityUniform: { value: number } | null

  constructor(scene: Scene) {
    this.scene = scene
    this.mesh = null
    this._trail = []
    this._intensityUniform = null
  }

  init(): void {
    const vertsPerArm = TRAIL_LENGTH * 2
    const totalVerts = vertsPerArm * 2
    const positions = new Float32Array(totalVerts * 3)
    const alphas = new Float32Array(totalVerts)
    const indices: number[] = []

    for (let arm = 0; arm < 2; arm++) {
      const base = arm * vertsPerArm
      for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
        const a = base + i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aAlpha', new Float32BufferAttribute(alphas, 1))
    geometry.setIndex(indices)

    this._intensityUniform = uniform(0)

    const material = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    const vAlpha = attribute('aAlpha')
    // MeshBasicNodeMaterial has no emissiveNode — put brightness in colorNode directly.
    // Water layer compositing is additive: withAO + waterRT.rgb * waterRT.a * waterMask
    material.colorNode = vec3(1, 1, 1).mul(vAlpha).mul(this._intensityUniform).mul(0.6)
    material.opacityNode = float(1)

    this.mesh = new Mesh(geometry, material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  update(shipX: number, shipZ: number, heading: number, speed: number, maxSpeed: number): void {
    if (!this.mesh) return

    const speedRatio = Math.min(Math.abs(speed) / maxSpeed, 1)
    this._intensityUniform!.value = speedRatio

    this._trail.unshift({ x: shipX, z: shipZ, heading })
    if (this._trail.length > TRAIL_LENGTH) this._trail.length = TRAIL_LENGTH

    const posAttr = this.mesh.geometry.getAttribute('position')
    const alphaAttr = this.mesh.geometry.getAttribute('aAlpha')
    const len = this._trail.length
    const vertsPerArm = TRAIL_LENGTH * 2

    for (let arm = 0; arm < 2; arm++) {
      const sign = arm === 0 ? -1 : 1
      const base = arm * vertsPerArm

      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const p = i < len ? this._trail[i] : this._trail[len - 1]
        const t = i / (TRAIL_LENGTH - 1)

        // Right vector perpendicular to heading
        const rx = Math.cos(p.heading)
        const rz = -Math.sin(p.heading)

        // Arm center: spread perpendicular to heading
        const spread = t * V_SPREAD * sign
        const cx = p.x + rx * spread
        const cz = p.z + rz * spread

        // Ribbon half-width
        const w = ARM_WIDTH_START + t * (ARM_WIDTH_END - ARM_WIDTH_START)

        const vi = base + i * 2
        posAttr.setXYZ(vi, cx - rx * w, WAKE_Y, cz - rz * w)
        posAttr.setXYZ(vi + 1, cx + rx * w, WAKE_Y, cz + rz * w)

        const alpha = (1 - t) * (1 - t)
        alphaAttr.setX(vi, alpha)
        alphaAttr.setX(vi + 1, alpha)
      }
    }

    posAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
  }
}

import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicNodeMaterial,
  AdditiveBlending,
  DoubleSide,
  Scene,
} from 'three/webgpu'
import { attribute, uniform, vec3, float } from 'three/tsl'

const TRAIL_LENGTH = 80          // frames of history (longer = longer wake)
const WAKE_Y = 0.925             // just above water surface (0.92)
const INNER_OFFSET = 0.6         // lateral distance of each arm's inner edge from centre
const OUTER_SPREAD = 7.0         // max lateral spread of each arm's outer edge at tail

interface TrailPoint {
  x: number
  z: number
  heading: number
}

/**
 * V-shaped wake trail behind the pirate ship.
 *
 * Each arm is a ribbon whose inner edge follows the ship's actual curved path
 * (so it naturally bends when the ship turns) and whose outer edge fans out
 * laterally with age, producing the characteristic widening-V silhouette.
 * Both arms start already offset from the ship centre so there is no
 * single-stem "Y" artefact at the stern.
 *
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
      blending: AdditiveBlending,
      side: DoubleSide,
    })
    const vAlpha = attribute('aAlpha')
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
      const sign = arm === 0 ? -1 : 1  // left / right
      const base = arm * vertsPerArm

      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const p = i < len ? this._trail[i] : this._trail[len - 1]
        const t = i / (TRAIL_LENGTH - 1)  // 0 = stern (newest), 1 = tail (oldest)

        // Right vector perpendicular to the heading recorded at this historical moment.
        // Using the historical heading means the arms smoothly follow the ship's curve
        // rather than kinking at the current ship orientation.
        const rx = Math.cos(p.heading)
        const rz = -Math.sin(p.heading)

        // Inner edge: stays close to the actual ship path — this is what gives the
        // ribbon its curve when the ship has been turning.
        const innerOff = INNER_OFFSET * sign

        // Outer edge: fans progressively further from the centreline with age,
        // creating the widening-V silhouette.  At the stern (t=0) it equals
        // innerOff so the ribbon starts with zero width; by the tail (t=1) it
        // has spread OUTER_SPREAD world units from the centre.
        const outerOff = (INNER_OFFSET + t * OUTER_SPREAD) * sign

        const vi = base + i * 2
        posAttr.setXYZ(vi,     p.x + rx * innerOff, WAKE_Y, p.z + rz * innerOff)
        posAttr.setXYZ(vi + 1, p.x + rx * outerOff, WAKE_Y, p.z + rz * outerOff)

        // Alpha: full brightness right at the stern, gentle power-curve fade toward
        // the tail so the foam looks like it dissolves rather than cuts off.
        const alpha = Math.pow(1 - t, 1.5)
        alphaAttr.setX(vi,     alpha)
        alphaAttr.setX(vi + 1, alpha * 0.2)  // outer edge fades faster → soft feathered edge
      }
    }

    posAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
  }
}

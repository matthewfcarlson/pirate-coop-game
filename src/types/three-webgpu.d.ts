/**
 * Type definitions for three/webgpu
 *
 * three/webgpu re-exports everything from three, plus WebGPU-specific classes.
 * This file provides those types for TypeScript.
 */

// Re-export all standard Three.js types
export * from 'three'

// WebGPU-specific classes
import { Material, Plane } from 'three'

export class MeshBasicNodeMaterial extends Material {
  constructor(params?: Record<string, unknown>)
  colorNode: unknown
  opacityNode: unknown
  clippingPlanes: Plane[]
}

export class MeshStandardNodeMaterial extends Material {
  constructor(params?: Record<string, unknown>)
  colorNode: unknown
  opacityNode: unknown
  normalNode: unknown
  roughnessNode: unknown
  metalnessNode: unknown
  clippingPlanes: Plane[]
}

export class MeshPhysicalNodeMaterial extends Material {
  constructor(params?: Record<string, unknown>)
  colorNode: unknown
  opacityNode: unknown
  clippingPlanes: Plane[]
}

export class SpriteNodeMaterial extends Material {
  constructor(params?: Record<string, unknown>)
  colorNode: unknown
  opacityNode: unknown
}

export class WebGPURenderer {
  constructor(params?: Record<string, unknown>)
  domElement: HTMLCanvasElement
  setSize(width: number, height: number): void
  setPixelRatio(ratio: number): void
  render(scene: unknown, camera: unknown): void
  dispose(): void
  setAnimationLoop(callback: ((time: number) => void) | null): void
  init(): Promise<void>
  toneMapping: unknown
  toneMappingExposure: number
  localClippingEnabled: boolean
  shadowMap: { enabled: boolean; type: unknown }
}

export class PostProcessing {
  constructor(renderer: WebGPURenderer)
  outputNode: unknown
  dispose(): void
}

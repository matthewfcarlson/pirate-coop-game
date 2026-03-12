/**
 * Type definitions for three/tsl (Three Shading Language)
 *
 * TSL is a node-based shading system for Three.js WebGPU renderer.
 * These are the most commonly used TSL functions.
 */

// Node types - using a generic ShaderNode type for chaining
export interface ShaderNode {
  mul(v: ShaderNode | number | unknown): ShaderNode
  add(v: ShaderNode | number | unknown): ShaderNode
  sub(v: ShaderNode | number | unknown): ShaderNode
  div(v: ShaderNode | number | unknown): ShaderNode
  mix(v: ShaderNode | number | unknown, t: ShaderNode | number | unknown): ShaderNode
  clamp(min?: ShaderNode | number, max?: ShaderNode | number): ShaderNode
  pow(exp: ShaderNode | number): ShaderNode
  smoothstep(min: ShaderNode | number, max: ShaderNode | number): ShaderNode
  oneMinus(): ShaderNode
  negate(): ShaderNode
  abs(): ShaderNode
  floor(): ShaderNode
  fract(): ShaderNode
  sin(): ShaderNode
  cos(): ShaderNode
  normalize(): ShaderNode
  length(): ShaderNode
  dot(v: ShaderNode): ShaderNode
  cross(v: ShaderNode): ShaderNode
  xy: ShaderNode
  xyz: ShaderNode
  x: ShaderNode
  y: ShaderNode
  z: ShaderNode
  w: ShaderNode
  r: ShaderNode
  g: ShaderNode
  b: ShaderNode
  a: ShaderNode
}

export interface UniformNode<T = number> extends ShaderNode {
  value: T
}

// Constructors
export function float(v: number | ShaderNode): ShaderNode
export function int(v: number | ShaderNode): ShaderNode
export function vec2(x: number | ShaderNode, y?: number | ShaderNode): ShaderNode
export function vec3(x: number | ShaderNode, y?: number | ShaderNode, z?: number | ShaderNode): ShaderNode
export function vec4(x: number | ShaderNode, y?: number | ShaderNode, z?: number | ShaderNode, w?: number | ShaderNode): ShaderNode
export function color(r: number | string, g?: number, b?: number): ShaderNode

// Uniforms and attributes
export function uniform(value: number): UniformNode<number>
export function attribute(name: string): ShaderNode

// Math
export function mix(a: ShaderNode | number, b: ShaderNode | number, t: ShaderNode | number): ShaderNode
export function clamp(v: ShaderNode, min?: ShaderNode | number, max?: ShaderNode | number): ShaderNode
export function smoothstep(min: ShaderNode | number, max: ShaderNode | number, v: ShaderNode): ShaderNode
export function step(edge: ShaderNode | number, v: ShaderNode): ShaderNode
export function max(a: ShaderNode | number, b: ShaderNode | number): ShaderNode
export function min(a: ShaderNode | number, b: ShaderNode | number): ShaderNode
export function pow(base: ShaderNode | number, exp: ShaderNode | number): ShaderNode
export function abs(v: ShaderNode): ShaderNode
export function sin(v: ShaderNode | number): ShaderNode
export function cos(v: ShaderNode | number): ShaderNode
export function fract(v: ShaderNode): ShaderNode
export function floor(v: ShaderNode): ShaderNode
export function normalize(v: ShaderNode): ShaderNode
export function length(v: ShaderNode): ShaderNode
export function dot(a: ShaderNode, b: ShaderNode): ShaderNode
export function cross(a: ShaderNode, b: ShaderNode): ShaderNode

// Texture
export function texture(tex: unknown, uv?: ShaderNode): ShaderNode
export function uv(): ShaderNode

// Built-in nodes
export const positionLocal: ShaderNode
export const positionWorld: ShaderNode
export const normalLocal: ShaderNode
export const normalWorld: ShaderNode
export const cameraPosition: ShaderNode

// Screen/time
export function timerLocal(scale?: number): ShaderNode
export function timerGlobal(scale?: number): ShaderNode
export const screenUV: ShaderNode
export const screenSize: ShaderNode

// Render targets / passes
export function pass(scene: unknown, camera: unknown, options?: Record<string, unknown>): ShaderNode & {
  getTextureNode(name?: string): ShaderNode
  getViewZNode(): ShaderNode
}
export function mrt(config: Record<string, ShaderNode>): unknown

// Post-processing
export function ao(node: ShaderNode, depthNode: ShaderNode, normalNode: ShaderNode, options?: Record<string, unknown>): ShaderNode
export function denoise(node: ShaderNode, depthNode: ShaderNode, normalNode: ShaderNode, options?: Record<string, unknown>): ShaderNode
export function dof(node: ShaderNode, viewZNode: ShaderNode, options?: Record<string, unknown>): ShaderNode
export function bloom(node: ShaderNode, options?: Record<string, unknown>): ShaderNode
export function filmGrain(options?: Record<string, unknown>): ShaderNode
export function vignette(options?: Record<string, unknown>): ShaderNode

// Output
export function output(node: ShaderNode): ShaderNode

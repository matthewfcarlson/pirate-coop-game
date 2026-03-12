import {
  MeshPhysicalNodeMaterial,
  PlaneGeometry,
  Mesh,
  TextureLoader,
  DataTexture,
  LinearFilter,
  Color,
} from 'three/webgpu'
import { uniform, vec3, vec2, texture, positionWorld, mx_noise_float, float, clamp, time as tslTime, sin, cos, mix, dot } from 'three/tsl'

/**
 * Water plane with caustic sparkles and coast wave bands.
 * Rendered to a separate RT in PostFX and masked to blue water areas.
 */
export class Water {
  constructor(scene, coastMaskTexture, coveMaskTexture) {
    this.scene = scene
    this.coastMaskTexture = coastMaskTexture
    this.coveMaskTexture = coveMaskTexture
    this.mesh = null
  }

  init() {
    const geometry = new PlaneGeometry(296, 296)
    geometry.rotateX(-Math.PI / 2)

    // Sparkle uniforms
    this._waterOpacity = uniform(0.1)
    this._waterSpeed = uniform(0.3)
    this._waterFreq = uniform(0.9)
    this._waterAngle = uniform(0)          // drift direction in radians
    this._waterBrightness = uniform(0.29)  // threshold cutoff (lower = more sparkle)
    this._waterContrast = uniform(17.5)    // sharpness multiplier after threshold

    // Wave uniforms
    this._waveSpeed = uniform(2)
    this._waveCount = uniform(4)
    this._waveOpacity = uniform(0.5)
    this._waveNoiseBreak = uniform(0.135)
    this._waveWidth = uniform(0.61)
    this._waveOffset = uniform(0.3)
    this._waveGradientOpacity = uniform(0.1)
    this._waveGradientColor = uniform(new Color(0.8, 0.7, 0.2))
    this._waveMaskStrength = uniform(1)
    this._coveStrength = uniform(1)
    this._coveFade = uniform(0)    // 1 = use cove mask as alpha fade
    this._coveThin = uniform(0)    // 1 = use cove mask to thin waves
    this._coveShow = uniform(0)    // 1 = show cove mask as red overlay

    // Wake uniforms — updated each frame by App from ship state
    this._wakeX = uniform(0)
    this._wakeZ = uniform(0)
    this._wakeHeading = uniform(0)
    this._wakeSpeed = uniform(0)

    // Coast gradient texture — pre-blurred RT from WavesMask (set before init)
    this._coastGradNode = texture(this.coastMaskTexture || new DataTexture(new Uint8Array(4), 1, 1))
    // Cove mask texture — separate blurred RT from WavesMask
    this._coveMaskNode = texture(this.coveMaskTexture || new DataTexture(new Uint8Array(4), 1, 1))

    // Caustic texture — tileable grayscale, replaces expensive Worley noise
    const causticLoader = new TextureLoader()
    const causticTex = causticLoader.load('./assets/textures/caustic.jpg')
    causticTex.wrapS = causticTex.wrapT = 1000 // RepeatWrapping
    causticTex.minFilter = LinearFilter
    causticTex.magFilter = LinearFilter
    const causticNode = texture(causticTex)

    const material = new MeshPhysicalNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
    })

    // ---- Sparkles: scrolling caustic texture with directional drift ----
    const driftX = cos(this._waterAngle).mul(this._waterSpeed).mul(0.015)
    const driftZ = sin(this._waterAngle).mul(this._waterSpeed).mul(0.015)
    const waterUV = vec2(
      positionWorld.x.mul(this._waterFreq).mul(0.1).add(tslTime.mul(driftX)),
      positionWorld.z.mul(this._waterFreq).mul(0.1).add(tslTime.mul(driftZ))
    )
    const causticVal = causticNode.sample(waterUV).r
    const sparkle = clamp(causticVal.sub(this._waterBrightness).mul(this._waterContrast), 0.0, 1.0)
    const waterColor = vec3(sparkle, sparkle, sparkle)
    const totalAlpha = sparkle.mul(this._waterOpacity)

    // ---- Waves: coast wave bands ----
    const PI2 = float(Math.PI * 2)
    const coastUV = vec2(
      positionWorld.x.div(180).add(0.5),
      positionWorld.z.div(180).add(0.5)
    )
    const cs = this._coastGradNode.sample(coastUV)
    const gradSample = cs.r

    // outwardDist: 0 at coastline, 1 at far open water
    const outwardDist = clamp(float(1).sub(gradSample), 0, 1)

    // Wave band zone: offset to offset+0.6
    const waveStart = this._waveOffset
    const waveEnd = this._waveOffset.add(0.6)
    const localDist = clamp(outwardDist.sub(waveStart).div(float(0.6)), 0, 1)
    const inRange = clamp(outwardDist.sub(waveStart).mul(20.0), 0, 1)
      .mul(clamp(waveEnd.sub(outwardDist).mul(20.0), 0, 1))

    // Cove mask: separate blurred texture from WavesMask
    const coveSample = clamp(this._coveMaskNode.sample(coastUV).r.mul(this._coveStrength), 0, 1)

    // Sine bands emanating outward
    const wavePhase = sin(localDist.mul(this._waveCount).mul(PI2).sub(tslTime.mul(this._waveSpeed)))
      .mul(0.5).add(0.5)
    const baseThreshold = mix(this._waveWidth, float(0.99), localDist)
    // Cove thinning: push threshold toward 1.0 in cove areas (waves vanish at threshold=1)
    const waveThreshold = mix(baseThreshold, float(1.0), coveSample.mul(this._coveThin))
    const waveBand = clamp(wavePhase.sub(waveThreshold).mul(40.0), 0, 1)

    // Multi-scale animated breaks along the wave lines
    // High freq: small gaps (~0.3 WU)
    const breakNoiseHi = mx_noise_float(vec3(
      positionWorld.x.mul(3.0),
      positionWorld.z.mul(3.0),
      tslTime.mul(0.15)
    ))
    // Low freq: large gaps (~1.5 WU) for variation
    const breakNoiseLo = mx_noise_float(vec3(
      positionWorld.x.mul(0.6),
      positionWorld.z.mul(0.6),
      tslTime.mul(0.08)
    ))
    // Combine: min of both so either scale can create a break
    const breakNoiseCombined = breakNoiseHi.mul(0.6).add(breakNoiseLo.mul(0.4))
    const noiseVal = breakNoiseCombined.mul(0.5).add(0.5)
    const breakMask = clamp(noiseVal.sub(this._waveNoiseBreak.mul(3.0)).mul(20.0), 0, 1)
    const broken = waveBand.mul(breakMask)

    // Fades
    const fadeIn = clamp(localDist.mul(8.0), 0, 1)
    const fadeOut = clamp(float(1).sub(localDist).mul(5.0), 0, 1)
    const nearCoast = clamp(gradSample.mul(3.0), 0, 1)

    // Cove fade: reduce wave opacity in cove areas
    const coveFadeMask = mix(float(1), float(1).sub(coveSample), this._coveFade)
    const waveAlpha = broken.mul(fadeIn).mul(fadeOut).mul(inRange).mul(nearCoast).mul(this._waveOpacity).mul(coveFadeMask)

    // U-shaped mask — sparkles near coast (rivers) + deep water, suppressed in wave zone
    // Where cove thins/removes waves, let sparkles back in
    const uMask = clamp(outwardDist.sub(0.5).abs().sub(0.3).mul(10.0), 0, 1)
    const sparkleMask = mix(float(1), uMask, this._waveMaskStrength.mul(float(1).sub(coveSample)))
    const sparkleWithBreaks = waterColor.mul(totalAlpha).mul(sparkleMask).mul(breakMask)

    // Cove debug: red overlay where cove mask is active
    const coveDebug = vec3(coveSample, 0, 0).mul(this._coveShow)

    // ---- Wake: V-shaped trail computed analytically from ship uniforms ----
    // diff = fragment world pos minus ship pos (in X/Z plane)
    const wakeDiff = vec2(positionWorld.x.sub(this._wakeX), positionWorld.z.sub(this._wakeZ))
    const wSin = sin(this._wakeHeading)
    const wCos = cos(this._wakeHeading)
    // along: positive = behind ship,  perp: signed lateral offset
    const wAlong = dot(wakeDiff, vec2(wSin.negate(), wCos.negate()))
    const wPerp  = dot(wakeDiff, vec2(wCos, wSin.negate()))
    // V-arm centres spread outward as we go further behind the ship
    const WAKE_TAN = float(0.42)   // tan ~23° — V half-angle
    const WAKE_LEN = float(18.0)   // max trail length (world units)
    const WAKE_W   = float(0.28)   // arm half-width at stern
    const wArmW = WAKE_W.add(wAlong.max(float(0)).mul(0.035)) // widens with distance
    const wArm1 = float(1).sub(wPerp.sub(wAlong.mul(WAKE_TAN)).abs().div(wArmW)).clamp(0, 1)
    const wArm2 = float(1).sub(wPerp.add(wAlong.mul(WAKE_TAN)).abs().div(wArmW)).clamp(0, 1)
    const wShape = wArm1.max(wArm2)
    // Fade: ramp in from stern, fade out over trail length
    const wBehind = wAlong.mul(float(4)).clamp(0, 1)          // smooth mask: only behind ship
    const wFade   = float(1).sub(wAlong.div(WAKE_LEN).clamp(0, 1))
    const wTaper  = wAlong.div(float(2)).clamp(0, 1)           // thin at stern, full by 2u back
    // Foam texture: reuse break noise at higher frequency
    const wakeNoise = mx_noise_float(vec3(
      positionWorld.x.mul(2.5),
      positionWorld.z.mul(2.5),
      tslTime.mul(0.4)
    )).mul(0.5).add(0.5)
    const wIntensity = wShape.mul(wBehind).mul(wFade).mul(wTaper)
      .mul(this._wakeSpeed).mul(wakeNoise).mul(0.85)
    const wakeEmit = vec3(wIntensity, wIntensity, wIntensity)

    // Additive compositing in PostFX — caustic water + coast waves + gradient tint
    const gradientColor = vec3(this._waveGradientColor)
    const waveWhite = vec3(waveAlpha, waveAlpha, waveAlpha)
    material.colorNode = vec3(0, 0, 0)
    material.emissiveNode = sparkleWithBreaks.add(waveWhite).add(gradientColor.mul(gradSample).mul(this._waveGradientOpacity)).add(coveDebug).add(wakeEmit)
    material.opacityNode = float(1)

    this.mesh = new Mesh(geometry, material)
    this.mesh.position.y = 0.92
    this.scene.add(this.mesh)
  }
}

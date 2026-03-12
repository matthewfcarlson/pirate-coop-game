/**
 * On-screen virtual joystick for mobile touch control.
 * Returns normalized x/y values in [-1, 1].
 * Only visible on touch-capable devices.
 */
export class VirtualJoystick {
  x: number
  y: number
  active: boolean
  _touchId: number | null
  _centerX: number
  _centerY: number
  _maxRadius: number
  _el: HTMLDivElement | null
  _knob: HTMLDivElement | null

  constructor() {
    this.x = 0 // left/right: -1 to 1
    this.y = 0 // forward/backward: -1 (forward) to 1 (backward)
    this.active = false
    this._touchId = null
    this._centerX = 0
    this._centerY = 0
    this._maxRadius = 50
    this._el = null
    this._knob = null

    // Only show on touch devices
    if (!('ontouchstart' in window)) return

    this._createDOM()
    this._bindEvents()
  }

  _createDOM(): void {
    // Outer ring
    const el = document.createElement('div')
    el.style.cssText = `
      position: fixed;
      bottom: 32px;
      right: 32px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
      background: rgba(0,0,0,0.15);
      backdrop-filter: blur(4px);
      z-index: 2000;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    `
    this._el = el

    // Inner knob
    const knob = document.createElement('div')
    knob.style.cssText = `
      position: absolute;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255,255,255,0.35);
      border: 1px solid rgba(255,255,255,0.5);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    `
    el.appendChild(knob)
    this._knob = knob

    document.body.appendChild(el)
  }

  _bindEvents(): void {
    const el = this._el
    if (!el) return

    el.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (this._touchId !== null) return
      const t = e.changedTouches[0]
      this._touchId = t.identifier
      const rect = el.getBoundingClientRect()
      this._centerX = rect.left + rect.width / 2
      this._centerY = rect.top + rect.height / 2
      this._updateFromTouch(t)
    }, { passive: false })

    el.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      for (const t of e.changedTouches) {
        if (t.identifier === this._touchId) {
          this._updateFromTouch(t)
          break
        }
      }
    }, { passive: false })

    const endTouch = (e: TouchEvent) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._touchId) {
          this._touchId = null
          this.x = 0
          this.y = 0
          this.active = false
          this._knob!.style.transform = 'translate(-50%, -50%)'
          break
        }
      }
    }

    el.addEventListener('touchend', endTouch)
    el.addEventListener('touchcancel', endTouch)
  }

  _updateFromTouch(t: Touch): void {
    let dx = t.clientX - this._centerX
    let dy = t.clientY - this._centerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Clamp to max radius
    if (dist > this._maxRadius) {
      dx = (dx / dist) * this._maxRadius
      dy = (dy / dist) * this._maxRadius
    }

    this.x = dx / this._maxRadius
    this.y = dy / this._maxRadius
    this.active = true

    // Move knob visually
    this._knob!.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
  }

  dispose(): void {
    if (this._el) {
      this._el.remove()
      this._el = null
    }
  }
}

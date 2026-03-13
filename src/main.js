import { App } from './App.js'
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js'

const loadingEl = document.getElementById('loading')
const canvas = document.getElementById('canvas')

let app = null

async function init() {
  if (!WebGPU.isAvailable()) {
    loadingEl.innerHTML = '<p style="color:#fff">WebGPU is not available on your device or browser.</p>'
    return
  }

  app = new App(canvas)

  // Once assets are loaded and the render loop is running, hide the loading
  // overlay so the tile-drop build animation is visible.
  app.onReadyToShow = () => {
    loadingEl.style.display = 'none'
    app.fadeIn(500)
  }

  await app.init()

  app.city.startIntroAnimation(app.camera, app.controls, 4)
}

init()

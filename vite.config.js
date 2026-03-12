import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

const fullReloadAlways = {
  name: 'full-reload-always',
  handleHotUpdate({ server }) {
    server.ws.send({ type: "full-reload" })
    return []
  },
}

export default defineConfig({
  root: '',
  base: './',
  plugins: [fullReloadAlways, basicSsl()],
  server: {
    port: 5176,
    watch: {
      ignored: ['**/*.md', '**/*.txt', '**/docs/**'],
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'three/webgpu', 'three/tsl'],
          vendor: ['howler', 'gsap'],
        },
      },
    },
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
})

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install          # Install dependencies
npm run dev          # Dev server on https://localhost:5176
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

No test framework is configured. Utility scripts exist in `tools/` (e.g., `node tools/tileset-audit.js` to validate tile definitions, `node tools/inspect-glb.js` to inspect GLB model contents).

## Tech Stack

- **Three.js** (0.183.2) with **WebGPU** renderer — not WebGL
- **Vite** for bundling (ESNext target)
- **GSAP** for animation, **Howler.js** for audio
- Shaders use Three.js TSL (Three Shading Language), not raw GLSL/WGSL

## Architecture

This is a **procedural hex terrain generator** using Wave Function Collapse (WFC). Despite the repo name, it's based on [hex-map-wfc](https://github.com/felixturner/hex-map-wfc).

### Entry Flow

`index.html` → `src/main.js` → `src/App.js` initializes the WebGPU renderer, scene, camera, and creates the `HexMap`.

### Core Systems

**HexMap** (`src/hexmap/HexMap.js`): Central orchestrator. Manages 19 hex grids arranged in a hexagonal pattern. Each grid can be independently generated/cleared via WFC.

**WFC Solver**: Runs in a **Web Worker** (`src/hexmap/wfc.worker.js`) to avoid blocking UI. `WFCManager.js` handles message passing. `HexWFCCore.js` contains shared WFC logic used by both main thread and worker (cube coordinates, adjacency rules, constraint propagation).

**Tile System** (`src/hexmap/HexTileData.js`): 30 tile types with edge constraints (grass/road/water/river). Each cell has 900 possible states (30 types × 6 rotations × 5 elevation levels). Tile weights control WFC probability.

**Grid System**: `HexGrid.js` manages individual grid state and rendering via BatchedMesh (~38 draw calls for 4,100+ cells). `HexGridConnector.js` handles the grid-of-grids topology with pointy-top hex grids using odd-q offset + cube coordinates.

**Rendering Pipeline**: `PostFX.js` chains GTAO, depth of field, film grain, and vignette. `Lighting.js` sets up HDR environment + dynamic shadow maps. `Water.js` and `WavesMask.js` handle animated water/coastal effects.

**Decorations** (`src/hexmap/Decorations.js`, `DecorationDefs.js`): Trees, buildings, bridges, rocks placed via Perlin noise-based clustering on populated tiles.

**Interaction** (`src/hexmap/HexMapInteraction.js`): Two modes — Move (orbit camera) and Build (click to generate/regenerate grids). `Pointer.js` handles raycasting.

### Key Patterns

- Seeded RNG (`SeededRandom.js`, Mulberry32) for reproducible map generation
- All hex files live under `src/hexmap/`; rendering utilities under `src/`
- Assets in `public/` — GLB models, HDR environment, textures, SFX
- GUI uses `lil-gui` (`src/GUI.js`)

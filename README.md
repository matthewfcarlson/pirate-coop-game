# pirate-coop-game

Inspired by: https://github.com/felixturner/hex-map-wfc

![Screenshot](docs/article/img/hero.jpg)

## Features

- **Modular Wave Function Collapse** — 19 hexagonal grids solved independently with cross-grid constraint matching
- **Layered Recovery System** — unfixing, Local-WFC, and mountain fallbacks for 100% solve rate
- **30 Hex Tile Types** — 6 rotations and 5 elevation levels each (900 states per cell)
- **WebGPU Rendering** — Three.js with TSL shaders for all custom visual effects
- **BatchedMesh Optimization** — 4,100+ cells in ~38 draw calls, 60fps on desktop and mobile
- **Post-Processing Stack** — GTAO ambient occlusion, depth of field, vignette, and film grain
- **Dynamic Shadow Maps** — frustum fitted to camera view for crisp shadows at any zoom
- **Animated Water** — caustic sparkles and coastal waves with cove-aware thinning
- **Noise-Based Placement** — Perlin noise for organic tree, building, and decoration clustering
- **Seeded RNG** — deterministic, reproducible maps from any seed

## Getting Started

```bash
npm install
npm run dev
npm run build
```

## License

[MIT](LICENSE)

## Credits

- [KayKit Medieval Hexagon Pack](https://kaylousberg.itch.io/kaykit-medieval-hexagon) — tile assets
- [Maxim Gumin's WFC](https://github.com/mxgmn/WaveFunctionCollapse) — original Wave Function Collapse
- [Red Blob Games — Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) — hex grid reference

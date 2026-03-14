# Pirate Co-op Game — Design Document

## Vision

A co-op extraction game where a crew of pirates sails to procedurally generated islands, steals map fragments, solves an overlay puzzle to find buried treasure, and escapes before the world sinks beneath them.

**Tone:** Deep Rock Galactic's extraction loop + Sea of Thieves' nautical feel + Risk of Rain's escalating pressure + Tarkov's gear loss stakes.

---

## Core Gameplay Loop

```
Dock → Outfit ship → Sail to islands → Acquire map fragments
→ Overlay puzzle → Go ashore → Grab treasure → World erodes → GET OUT
```

1. **Pre-run (Dock):** Crew assembles, loads supplies and upgrades onto the ship, chooses which ship to risk bringing.
2. **Sail:** Navigate the hex world to find islands. World is generated fresh each run.
3. **Acquire map fragments:** Multiple acquisition methods — stealth, combat, looting NPC ships/ports. Each fragment is a partial, transparent overlay of the treasure island.
4. **The overlay puzzle:** On the ship's navigation table, crew physically stacks and rotates transparent map fragments on top of each other until the treasure location is revealed. Core co-op moment.
5. **Go ashore:** Use rowboats to reach islands. Fight, sneak, or puzzle your way to the treasure.
6. **Escalating pressure:** Water rises. Tiles erode and sink. The treasure location eventually submerges — once it's gone, shift to pure survival mode.
7. **Extraction:** Sail back to safe harbor. If the ship sinks, you lose it.

---

## Design Pillars

- **Co-op only** — no PvP. Other players are never the threat; the world is.
- **2–4 players** + optional AI crew to fill gaps on smaller crews.
- **Real-time** multiplayer.
- **Rogue-lite** — fresh procedurally generated world each run, permanent meta-progression between runs.
- **Stakes** — you can lose your ship. Gear and supplies can be lost. Runs feel meaningful.

---

## Key Mechanics

### Map Fragment Overlay (the heart of the game)

- Map fragments are transparent partial outlines of the treasure island.
- Fragments are acquired through gameplay (stolen, looted, purchased) — multiple acquisition methods, stealth is a valid path.
- On the ship, players physically place, stack, and rotate fragments on a navigation table until the composite image reveals the treasure location.
- Number of fragments scales with difficulty.
- This is a co-op puzzle — best experienced with multiple players handing pieces to each other.

### The Ship

- Ships are risked each run — a sunk ship is a lost ship (Tarkov-style stakes).
- Different ship types with different capabilities (sloop → galleon).
- Possible insurance mechanic to recover a lost ship at a cost.
- **Station-based roles:** helm, sails, cannons, crow's nest, navigation table.
- Players physically walk between stations to switch roles — no menus.
- With fewer players, roles get merged. A 2-player crew is sprinting back and forth across the deck.
- AI crew members fill unstaffed stations on smaller crews (less effective than a player).
- Ship can take hull damage and require repairs mid-run.

### Individual Pirates

- Players control individual pirate characters moving freely in world space (not constrained to hex cells).
- The hex grid is the terrain skeleton — it defines land/water/elevation — but movement is free.
- Rowboats are used to travel between the ship and shore.
- On-shore gameplay: mix of combat, stealth, and environmental puzzle-solving.

### World Erosion (the pressure system)

- Water rises continuously over time, accelerating as the run progresses.
- Tiles erode and sink — land shrinks, paths disappear.
- The treasure site eventually submerges. Once it's gone, the objective shifts: just survive and get out.
- A closing fog also deals damage to players caught in it.
- Erosion can affect the ship too — hull damage from floods, debris.

---

## Meta-Progression (TBD)

Between runs, players unlock things that change the feel of future runs:

- **Pirate archetypes/classes** — e.g. Swashbuckler (combat), Ghost (stealth, easier fragment acquisition), Navigator (map puzzle bonuses)
- **Ship types** — discovered or earned, each with different role configurations
- **Biome types** — new island types unlocked over time (arctic, cursed jungle, sunken ruins)
- **Lore** — story fragments revealed across runs explaining the treasure's significance

---

## World & Terrain

- Built on the existing procedural hex terrain generator (WFC).
- The hex grid generates island shapes and defines terrain type (water, land, elevation).
- Players move freely in world space — hex cells are terrain, not a movement grid.
- Each run generates a fresh world.
- Scale: one hex cell ≈ one building footprint, so individual pirates feel grounded on the islands.

### Camera

- Fixed angle, pulled back — similar to Hades or Deep Rock Galactic.
- Not the current orbiting overview camera.

---

## Networking

- Browser-first (shareable link to play), with eventual packaged app.
- Real-time multiplayer via WebRTC (peer-to-peer) or Cloudflare (no paid third-party services).

---

## Open Questions

- Exact number of map fragments per run and how they scale.
- What NPC enemy types exist (navy, rival pirates, sea creatures)?
- Does the ship auto-drift when no one is at the helm?
- What does the rowboat travel feel like — instant transition or a traversal moment?
- Can enemies board your ship?
- What happens when a player character dies — respawn at the ship, spectate, AI takes over?
- What specific upgrades/supplies can be looted and brought into a run?
- Does the dock/hub persist between runs as a social space?

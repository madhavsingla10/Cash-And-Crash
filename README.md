# 🏎️ Cash & Crash 3D

> High-octane 3D arcade police pursuit and heist game built with **Three.js**, **TypeScript**, and **Vite**.

---

## 🎮 Gameplay Overview

In **Cash & Crash**, you drive a high-performance getaway sports car across a sprawling 3D metropolis. Collect floating cash bags scattered along the road network while outmaneuvering an increasingly aggressive police pursuit force.

- **Solid-Strike Physics**: Experience physical vehicular collisions with direct momentum transfer—rear-end impacts surge you forward, head-on crashes arrest momentum, and side hits push you laterally.
- **Tire-to-Tarmac Ground Contact**: Vehicles roll with their wheels firmly planted on the asphalt, dirt, and sand dunes without hovering in the air.
- **Escalating Wanted Levels**:
  - **0 Stars**: Peaceful exploration to line up your heist.
  - **1 Star (1st Theft)**: 4 Police Cruisers dispatched.
  - **2 Stars**: High-speed Police Interceptors join the chase.
  - **3 Stars**: Armored SWAT Vans introduced.
  - **4–5 Stars**: Heavy SWAT Fleets + Police Chopper spotlight and roof turret fire!
- **Dodge & Destroy**: Police cruisers chase and ram you. Juke, drift, and bait them into slamming headfirst into skyscraper walls or multi-car pileups!
- **Classic 3D Arcade Guide Arrow**: A clean, high-visibility directional arrow hovers above your car, guiding you directly to active loot drops and the extraction helipad.
- **Escape & Win**: Collect loot to activate the harbor helicopter extraction helipad and complete the heist!

---

## 🗺️ Sprawling 3D World Districts

1. **Downtown Metropolis**: 80+ illuminated skyscraper towers, wide multi-lane avenues, and pedestrian plazas.
2. **Central Park**: 84m expansive open lawn with stunt jump ramps and paved loop roads.
3. **Farmland & Sand Dunes**: Golden wheat fields, rustic barns, animated windmills, and crest-launching sand dunes.
4. **Seaport Terminal & Ocean Pier**: Shipping container avenues, rooftop jump ramps, and a drivable wooden ocean boardwalk connecting to a massive cargo ship.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Accelerate** | <kbd>W</kbd> / <kbd>▲</kbd> | <kbd>▲</kbd> Button |
| **Brake / Reverse** | <kbd>S</kbd> / <kbd>▼</kbd> | <kbd>🛑</kbd> Button |
| **Steer Left / Right** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>◀</kbd> / <kbd>▶</kbd> | <kbd>◀</kbd> / <kbd>▶</kbd> |
| **Handbrake Drift** | <kbd>SPACE</kbd> | <kbd>💨</kbd> Button |
| **Nitro Boost** | <kbd>SHIFT</kbd> | <kbd>⚡</kbd> Button |

---

## 🛠️ Tech Stack & Architecture

- **3D Graphics Engine**: [Three.js](https://threejs.org/) (WebGL / WebGPU ready)
- **Language & Tooling**: [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Physics & Collision**: Custom arcade vehicle dynamics + multi-whisker obstacle avoidance AI
- **Audio Synthesizer**: Pure Web Audio API procedural sound engine (no external audio assets required)
- **UI / HUD**: Cyberpunk arcade interface with live circular radar minimap, health & boost gauges, and wanted star heat meter

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/madhavsingla10/Cash-And-Crash.git

# Navigate into project directory
cd Cash-And-Crash

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play!

### Production Build

```bash
npm run build
npm run preview
```

---

## 📄 License
MIT License. Free to use, modify, and distribute.

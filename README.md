# 🏎️ Cash & Crash 3D

> High-octane 3D arcade police pursuit and heist game built with **Three.js**, **TypeScript**, and **Vite**.

## 🎮 Gameplay Overview

In **Cash & Crash**, you drive a high-performance getaway sports car across a sprawling 3D metropolis. Collect floating cash bags scattered along the road network while outmaneuvering an increasingly aggressive police pursuit force.

- **Dodge & Destroy**: Police cruisers chase and ram you. Juke, drift, and bait them into slamming headfirst into skyscraper walls or flying off coastal cliffs!
- **Escalating Wanted Levels**: From basic patrol cruisers up to high-speed interceptors, armored SWAT vans firing live rounds, and tracking police helicopters.
- **Smart Waypoint GPS**: A 3D holographic directional arrow hovers above your car, guiding you directly to the active money bag and extraction zone.
- **Escape & Win**: Collect enough loot to activate the harbor helicopter extraction helipad and complete the heist!

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

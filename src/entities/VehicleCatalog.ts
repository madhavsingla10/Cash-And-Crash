import * as THREE from 'three';
import { CarBuilder, CarMeshes } from './CarBuilder';
import { createFuturisticHypercar } from '../../car designs/FuturisticHypercar';
import { createRetroMuscleCar } from '../../car designs/RetroMuscleCar';
import { createMonsterTruck } from '../../car designs/MonsterTruck';
import { createCyberSedan } from '../../car designs/CyberSedan';
import { createRallyBaja } from '../../car designs/RallyBaja';
import { createArmoredLimousine } from '../../car designs/ArmoredLimousine';

export interface VehicleStats {
  topSpeedMph: number;     // Display speed
  maxSpeedUnits: number;    // Forward velocity in engine units
  maxBoostUnits: number;    // Boost velocity
  acceleration: number;    // Engine power
  armorHp: number;         // Max health
  handling: number;        // Steer rate
  driftSlip: number;       // Drift elasticity
  ramPower: number;        // Collision impact multiplier against police
}

export interface VehicleInfo {
  id: string;
  name: string;
  category: string;
  tagline: string;
  icon: string;
  colorHex: string;
  stats: VehicleStats;
  createMesh: () => CarMeshes;
}

export const VEHICLE_CATALOG: VehicleInfo[] = [
  {
    id: 'cyber_stinger',
    name: 'Cyber Stinger GT',
    category: 'Street Tuner',
    tagline: 'Agile neon getaway racer with balanced nitro acceleration.',
    icon: '⚡',
    colorHex: '#00ff88',
    stats: {
      topSpeedMph: 85,
      maxSpeedUnits: 38,
      maxBoostUnits: 54,
      acceleration: 26,
      armorHp: 100,
      handling: 2.5,
      driftSlip: 0.85,
      ramPower: 1.0
    },
    createMesh: () => CarBuilder.createPlayerCar()
  },
  {
    id: 'hypercar',
    name: 'Futuristic Hypercar',
    category: 'Exotic Track',
    tagline: 'Aerodynamic apex predator built for extreme top-end speed.',
    icon: '🚀',
    colorHex: '#00f0ff',
    stats: {
      topSpeedMph: 110,
      maxSpeedUnits: 48,
      maxBoostUnits: 66,
      acceleration: 34,
      armorHp: 85,
      handling: 2.8,
      driftSlip: 0.90,
      ramPower: 0.9
    },
    createMesh: () => createFuturisticHypercar()
  },
  {
    id: 'muscle',
    name: 'Retro Muscle V8',
    category: 'Classic Muscle',
    tagline: 'Supercharged American muscle with heavy drift torque and burnouts.',
    icon: '🔥',
    colorHex: '#ff3333',
    stats: {
      topSpeedMph: 90,
      maxSpeedUnits: 40,
      maxBoostUnits: 56,
      acceleration: 30,
      armorHp: 125,
      handling: 2.3,
      driftSlip: 0.75,
      ramPower: 1.3
    },
    createMesh: () => createRetroMuscleCar()
  },
  {
    id: 'monster_truck',
    name: 'Monster Titan 4x4',
    category: 'Heavy All-Terrain',
    tagline: 'Gigantic tires and heavy bullbar designed to crush police cruisers.',
    icon: '🛞',
    colorHex: '#ffaa00',
    stats: {
      topSpeedMph: 70,
      maxSpeedUnits: 32,
      maxBoostUnits: 44,
      acceleration: 22,
      armorHp: 200,
      handling: 1.9,
      driftSlip: 0.80,
      ramPower: 2.2
    },
    createMesh: () => createMonsterTruck()
  },
  {
    id: 'rally_baja',
    name: 'Rally Baja Cruiser',
    category: 'Dune Rally',
    tagline: 'Reinforced roll cage and long-travel suspension for sand dune jumping.',
    icon: '🏎️',
    colorHex: '#ffbb33',
    stats: {
      topSpeedMph: 82,
      maxSpeedUnits: 37,
      maxBoostUnits: 52,
      acceleration: 28,
      armorHp: 135,
      handling: 2.6,
      driftSlip: 0.82,
      ramPower: 1.2
    },
    createMesh: () => createRallyBaja()
  },
  {
    id: 'cyber_sedan',
    name: 'Cyber Executive',
    category: 'Luxury Sport',
    tagline: 'Smooth, polished executive sedan with balanced luxury handling.',
    icon: '🏙️',
    colorHex: '#cccccc',
    stats: {
      topSpeedMph: 78,
      maxSpeedUnits: 35,
      maxBoostUnits: 50,
      acceleration: 24,
      armorHp: 115,
      handling: 2.4,
      driftSlip: 0.85,
      ramPower: 1.1
    },
    createMesh: () => createCyberSedan()
  },
  {
    id: 'armored_limo',
    name: 'Armored Juggernaut',
    category: 'Armored Heavy',
    tagline: 'Extended heavy-duty fortress limousine with maximum armor plating.',
    icon: '🛡️',
    colorHex: '#708090',
    stats: {
      topSpeedMph: 65,
      maxSpeedUnits: 30,
      maxBoostUnits: 42,
      acceleration: 19,
      armorHp: 260,
      handling: 1.7,
      driftSlip: 0.88,
      ramPower: 2.5
    },
    createMesh: () => createArmoredLimousine()
  }
];

export function getVehicleById(id: string): VehicleInfo {
  return VEHICLE_CATALOG.find(v => v.id === id) || VEHICLE_CATALOG[0];
}

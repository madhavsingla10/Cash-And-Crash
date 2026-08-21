import * as THREE from 'three';

export interface BuildingCollider {
  box: THREE.Box3;
  type: 'building' | 'cliff' | 'water' | 'ramp' | 'prop';
  height: number;
}

export interface StuntRamp {
  position: THREE.Vector3;
  rotationY: number;
  width: number;
  length: number;
  height: number;
}

export interface CityData {
  root: THREE.Group;
  colliders: BuildingCollider[];
  ramps: StuntRamp[];
  spawnPoints: THREE.Vector3[];
  moneyLocations: THREE.Vector3[];
  cityBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  waterLevel: number;
  extractionPoint: THREE.Vector3;
}

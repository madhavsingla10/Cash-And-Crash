import * as THREE from 'three';
import { WorldMaterials } from './materials';
import { CityRoadGenerator } from './CityRoadGenerator';

export class RoadNetworkBuilder {
  public static buildRoads(root: THREE.Group, mapSize: number, mats: WorldMaterials) {
    // 1. Single Unified Road & Ground Mesh strictly matching webgpu_generator_city.html:
    // "road: wet asphalt with sidewalks, lane lines and crosswalks, all aligned to the city grid via TSL.
    // sized to the city footprint plus one street of margin all round"
    const ground = CityRoadGenerator.createCityGround({
      mapSize,
      gridSpacing: 50,
      streetWidth: 16,
      blockSize: 34,
      sidewalkWidth: 3.5
    });
    root.add(ground);

    // 2. 4-Way Traffic Light Gantry Masts on Major Intersections
    const majorIntersections = [
      { x: 0, z: -150 },
      { x: 0, z: 150 },
      { x: -150, z: 0 },
      { x: 150, z: 0 },
      { x: -150, z: -150 },
      { x: 150, z: 150 }
    ];

    for (let inter of majorIntersections) {
      this.buildTrafficSignal(root, inter.x, inter.z, mats);
    }

    // 3. Urban Bus Stops & Transit Shelters
    const busStopPositions = [
      { x: -50, z: -25, rot: 0 },
      { x: 50, z: 25, rot: Math.PI },
      { x: -25, z: 50, rot: Math.PI / 2 },
      { x: 25, z: -50, rot: -Math.PI / 2 }
    ];

    for (let bp of busStopPositions) {
      this.buildBusStopShelter(root, bp.x, bp.z, bp.rot, mats);
    }

    // 4. City Exit Paved Stone Tile Transitions
    const exitLocations = [
      { x: 85, z: 85, w: 26, d: 26 },   // South-East Countryside Transition
      { x: -85, z: 85, w: 26, d: 26 },  // South-West Seaport Transition
      { x: -85, z: -85, w: 26, d: 26 }  // North-West Outer Transition
    ];
    for (let el of exitLocations) {
      const exitTile = new THREE.Mesh(new THREE.PlaneGeometry(el.w, el.d), mats.pavedTileMat);
      exitTile.rotation.x = -Math.PI / 2;
      exitTile.position.set(el.x, 0.065, el.z);
      exitTile.receiveShadow = true;
      root.add(exitTile);
    }
  }

  // Helper: Modern 4-Way Traffic Light Mast
  private static buildTrafficSignal(root: THREE.Group, x: number, z: number, mats: WorldMaterials) {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });

    // Vertical Steel Column at corner
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 7.5, 8), poleMat);
    col.position.set(11.5, 3.75, 11.5);
    col.castShadow = true;
    group.add(col);

    // Cantilever Overhead Arm extending over the intersection
    const arm = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 0.3), poleMat);
    arm.position.set(8.0, 7.2, 11.5);
    group.add(arm);

    // Traffic Light Signal Housing
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.6), poleMat);
    box.position.set(5.5, 6.2, 11.5);

    // Red, Yellow, Green Signal Lenses
    const redLens = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mats.trafficRedMat);
    redLens.position.set(0, 0.65, 0.32);
    const yellowLens = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mats.trafficYellowMat);
    yellowLens.position.set(0, 0.0, 0.32);
    const greenLens = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mats.trafficGreenMat);
    greenLens.position.set(0, -0.65, 0.32);

    box.add(redLens, yellowLens, greenLens);
    group.add(box);

    group.position.set(x, 0, z);
    root.add(group);
  }

  // Helper: Glass Bus Stop Shelter with Bench & Digital Billboard
  private static buildBusStopShelter(root: THREE.Group, x: number, z: number, rot: number, mats: WorldMaterials) {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 });

    // 4 Steel Frame Posts
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6);
    const p1 = new THREE.Mesh(postGeo, frameMat);
    p1.position.set(-2.8, 1.7, -1.0);
    const p2 = p1.clone();
    p2.position.x = 2.8;
    const p3 = p1.clone();
    p3.position.z = 1.0;
    const p4 = p2.clone();
    p4.position.z = 1.0;
    group.add(p1, p2, p3, p4);

    // Roof Canopy
    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.25, 2.6), frameMat);
    roof.position.set(0, 3.4, 0);
    roof.castShadow = true;
    group.add(roof);

    // Rear Glass Wall
    const glassRear = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.8), mats.busGlassMat);
    glassRear.position.set(0, 1.7, -1.0);
    group.add(glassRear);

    // Wooden Waiting Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 0.7), mats.woodPlankMat);
    bench.position.set(0, 0.6, -0.4);
    group.add(bench);

    // Digital Glowing Ad Kiosk
    const kiosk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.6, 0.3), mats.neonCyanMat);
    kiosk.position.set(2.4, 1.4, 0);
    group.add(kiosk);

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    root.add(group);
  }
}

import * as THREE from 'three';
import { WorldMaterials } from './materials';

export class RoadNetworkBuilder {
  public static buildRoads(root: THREE.Group, mapSize: number, mats: WorldMaterials) {
    const halfMap = mapSize / 2;
    const gridCoords = [-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250];
    const markGeo = new THREE.PlaneGeometry(1.2, 5.0);

    // 1. North-South Avenues & Streets (City & Outer Roads)
    for (let x of gridCoords) {
      const isPerimeter = Math.abs(x) === 250;
      const isMajorAvenue = Math.abs(x) === 150 || x === 0;
      const roadW = isPerimeter ? 26 : (isMajorAvenue ? 20 : 16);

      // In Farmland territory (x >= 60 and z <= -60), roads are completely removed for sand dunes
      if (x >= 60) {
        // Build asphalt road only from Z = -60 to Z = +halfMap (City to Countryside)
        const southSpan = halfMap - (-60);
        const road = new THREE.Mesh(new THREE.PlaneGeometry(roadW, southSpan), mats.asphaltMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(x, 0.05, -60 + southSpan / 2);
        road.receiveShadow = true;
        root.add(road);

        // Yellow dashes only in the city sections (Z between -50 and 80)
        for (let z = -50; z < 80; z += 10) {
          const mark = new THREE.Mesh(markGeo, mats.roadMarkMat);
          mark.rotation.x = -Math.PI / 2;
          mark.position.set(x, 0.08, z);
          root.add(mark);
        }
      } else {
        // Full length asphalt road across downtown/west
        const road = new THREE.Mesh(new THREE.PlaneGeometry(roadW, mapSize), mats.asphaltMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(x, 0.05, 0);
        road.receiveShadow = true;
        root.add(road);

        // Yellow dash markings along road
        for (let z = -halfMap + 15; z < halfMap - 15; z += 10) {
          const mark = new THREE.Mesh(markGeo, mats.roadMarkMat);
          mark.rotation.x = -Math.PI / 2;
          mark.position.set(x, 0.08, z);
          root.add(mark);
        }
      }
    }

    // 2. East-West Avenues & Cross Streets (City & Outer Roads)
    for (let z of gridCoords) {
      const isPerimeter = Math.abs(z) === 250;
      const isMajorAvenue = Math.abs(z) === 150 || z === 0;
      const roadW = isPerimeter ? 26 : (isMajorAvenue ? 20 : 16);

      // In Farmland territory (z <= -60 and x >= 60), roads are completely removed for sand dunes
      if (z <= -60) {
        // Build asphalt road only from X = -halfMap to X = 60
        const westSpan = 60 - (-halfMap);
        const road = new THREE.Mesh(new THREE.PlaneGeometry(westSpan, roadW), mats.asphaltMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(-halfMap + westSpan / 2, 0.05, z);
        road.receiveShadow = true;
        root.add(road);

        // Yellow dashes only up to X = 50
        for (let x = -halfMap + 15; x < 50; x += 10) {
          const mark = new THREE.Mesh(markGeo, mats.roadMarkMat);
          mark.rotation.x = -Math.PI / 2;
          mark.rotation.z = Math.PI / 2;
          mark.position.set(x, 0.08, z);
          root.add(mark);
        }
      } else {
        // Full width asphalt road across downtown/south
        const road = new THREE.Mesh(new THREE.PlaneGeometry(mapSize, roadW), mats.asphaltMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0.05, z);
        road.receiveShadow = true;
        root.add(road);

        // Yellow dash markings (excluding countryside village x > 85 & z > 85)
        for (let x = -halfMap + 15; x < halfMap - 15; x += 10) {
          if (x > 85 && z > 85) continue; // Skip tiled countryside village
          const mark = new THREE.Mesh(markGeo, mats.roadMarkMat);
          mark.rotation.x = -Math.PI / 2;
          mark.rotation.z = Math.PI / 2;
          mark.position.set(x, 0.08, z);
          root.add(mark);
        }
      }
    }

    // 3. City Exit Paved Stone Tile Transitions
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
}

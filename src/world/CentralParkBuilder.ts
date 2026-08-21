import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from './types';
import { WorldMaterials } from './materials';

export class CentralParkBuilder {
  public static buildCentralPark(
    root: THREE.Group,
    colliders: BuildingCollider[],
    ramps: StuntRamp[],
    mats: WorldMaterials
  ) {
    const parkSize = 84;
    const parkMesh = new THREE.Mesh(
      new THREE.BoxGeometry(parkSize, 0.3, parkSize),
      mats.grassMat
    );
    parkMesh.position.set(0, 0.15, 0);
    parkMesh.receiveShadow = true;
    root.add(parkMesh);

    // Outer Drift Ring in Central Park
    const parkDriftRing = new THREE.Mesh(new THREE.RingGeometry(28, 38, 32), mats.asphaltMat);
    parkDriftRing.rotation.x = -Math.PI / 2;
    parkDriftRing.position.set(0, 0.31, 0);
    parkDriftRing.receiveShadow = true;
    root.add(parkDriftRing);

    // Central Marble Fountain
    const fountainBasin = new THREE.Mesh(new THREE.CylinderGeometry(10, 11, 1.4, 20), mats.marbleMat);
    fountainBasin.position.set(0, 0.7, 0);
    fountainBasin.castShadow = true;

    const fountainWater = new THREE.Mesh(
      new THREE.CylinderGeometry(9.4, 9.4, 1.0, 20),
      new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 })
    );
    fountainWater.position.set(0, 0.9, 0);

    const fountainCenter = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 3.8, 12), mats.marbleMat);
    fountainCenter.position.set(0, 1.9, 0);
    root.add(fountainBasin, fountainWater, fountainCenter);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(0, 2, 0),
        new THREE.Vector3(22, 4, 22)
      ),
      type: 'building',
      height: 4
    });

    // Park Stunt Jumps over Fountain
    ramps.push(
      { position: new THREE.Vector3(0, 0, -20), rotationY: 0, width: 8, length: 10, height: 3.4 },
      { position: new THREE.Vector3(0, 0, 20), rotationY: Math.PI, width: 8, length: 10, height: 3.4 },
      { position: new THREE.Vector3(-20, 0, 0), rotationY: Math.PI / 2, width: 8, length: 10, height: 3.4 },
      { position: new THREE.Vector3(20, 0, 0), rotationY: -Math.PI / 2, width: 8, length: 10, height: 3.4 }
    );

    // Minimal Trees along Outer Park Border (leaving interior open for drifting)
    const parkBorderTrees = [
      [-38, -38], [38, -38], [-38, 38], [38, 38],
      [-38, 0], [38, 0], [0, -38], [0, 38]
    ];

    for (let [tx, tz] of parkBorderTrees) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 4.2, 6), mats.trunkMat);
      trunk.position.y = 2.1;
      trunk.castShadow = true;
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8), mats.treeMat);
      foliage.position.y = 5.2;
      foliage.castShadow = true;
      tree.position.set(tx, 0, tz);
      tree.add(trunk, foliage);
      root.add(tree);
    }
  }
}

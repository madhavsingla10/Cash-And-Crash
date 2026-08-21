import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from '../CityBuilder';

export class BattleArenaBuilder {
  public static buildBattleArena(
    root: THREE.Group,
    colliders: BuildingCollider[],
    ramps: StuntRamp[],
    centerX: number,
    centerZ: number,
    size: number = 180
  ) {
    const arenaGroup = new THREE.Group();
    arenaGroup.position.set(centerX, 0, centerZ);

    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x3d312a, roughness: 0.95 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x8b3a2b, roughness: 0.8 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.6 });
    const floodlightBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const containerColors = [
      0xd90429, 0x0077b6, 0xf77f00, 0x2b9348, 0x4a4e69, 0x222222
    ];

    // 1. Dirt Demolition Ground Slab
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), dirtMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.08;
    ground.receiveShadow = true;
    arenaGroup.add(ground);

    // 2. Concrete & Steel Perimeter Walls
    const wallH = 4.5;
    const wallThick = 2.0;

    const northWall = new THREE.Mesh(new THREE.BoxGeometry(size, wallH, wallThick), barrierMat);
    northWall.position.set(0, wallH / 2, -size / 2);
    northWall.castShadow = true;
    arenaGroup.add(northWall);

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(size, wallH, wallThick), barrierMat);
    southWall.position.set(0, wallH / 2, size / 2);
    southWall.castShadow = true;
    arenaGroup.add(southWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, size), barrierMat);
    westWall.position.set(-size / 2, wallH / 2, 0);
    westWall.castShadow = true;
    arenaGroup.add(westWall);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, size), barrierMat);
    eastWall.position.set(size / 2, wallH / 2, 0);
    eastWall.castShadow = true;
    arenaGroup.add(eastWall);

    // Perimeter Wall Colliders
    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX, wallH / 2, centerZ - size / 2),
        new THREE.Vector3(size, wallH, wallThick)
      ),
      type: 'building',
      height: wallH
    });
    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX, wallH / 2, centerZ + size / 2),
        new THREE.Vector3(size, wallH, wallThick)
      ),
      type: 'building',
      height: wallH
    });
    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX - size / 2, wallH / 2, centerZ),
        new THREE.Vector3(wallThick, wallH, size)
      ),
      type: 'building',
      height: wallH
    });
    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX + size / 2, wallH / 2, centerZ),
        new THREE.Vector3(wallThick, wallH, size)
      ),
      type: 'building',
      height: wallH
    });

    // 3. Stacks of Multi-Colored Shipping Containers
    const containerLayouts = [
      { x: -35, z: -35, rot: 0, stack: 2 },
      { x: -35, z: 35, rot: Math.PI / 2, stack: 3 },
      { x: 35, z: -35, rot: Math.PI / 2, stack: 2 },
      { x: 35, z: 35, rot: 0, stack: 3 },
      { x: 0, z: -50, rot: Math.PI / 4, stack: 2 },
      { x: -50, z: 0, rot: -Math.PI / 4, stack: 2 },
      { x: 50, z: 0, rot: Math.PI / 3, stack: 2 }
    ];

    const cW = 7;
    const cH = 3.5;
    const cL = 16;

    for (let c of containerLayouts) {
      for (let s = 0; s < c.stack; s++) {
        const col = containerColors[(Math.floor(Math.random() * containerColors.length))];
        const cMesh = new THREE.Mesh(
          new THREE.BoxGeometry(cW, cH, cL),
          new THREE.MeshStandardMaterial({ color: col, metalness: 0.6, roughness: 0.4 })
        );
        cMesh.position.set(c.x, cH / 2 + s * cH, c.z);
        cMesh.rotation.y = c.rot;
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        arenaGroup.add(cMesh);
      }

      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(centerX + c.x, (cH * c.stack) / 2, centerZ + c.z),
          new THREE.Vector3(cL, cH * c.stack, cL)
        ),
        type: 'building',
        height: cH * c.stack
      });
    }

    // 4. Industrial Barrel Pyramids
    for (let b = 0; b < 16; b++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 2.0, 10),
        rustMat
      );
      const angle = (b * Math.PI) / 8;
      const bDist = 22 + (b % 3) * 6;
      barrel.position.set(Math.cos(angle) * bDist, 1.0, Math.sin(angle) * bDist);
      barrel.castShadow = true;
      arenaGroup.add(barrel);
    }

    // 5. Four Corner Stadium Floodlight Towers
    const cornerOffsets = [
      [-size / 2 + 6, -size / 2 + 6],
      [size / 2 - 6, -size / 2 + 6],
      [-size / 2 + 6, size / 2 - 6],
      [size / 2 - 6, size / 2 - 6]
    ];

    for (let [cx, cz] of cornerOffsets) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 28, 6), steelMat);
      tower.position.set(cx, 14, cz);
      tower.castShadow = true;

      const lightHead = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 2), floodlightBulbMat);
      lightHead.position.set(0, 14, 0);
      tower.add(lightHead);

      arenaGroup.add(tower);

      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(centerX + cx, 14, centerZ + cz),
          new THREE.Vector3(4, 28, 4)
        ),
        type: 'building',
        height: 28
      });
    }

    // 6. High-Air Stunt Jump Ramp in Center
    ramps.push({
      position: new THREE.Vector3(centerX, 0, centerZ),
      rotationY: Math.PI / 2,
      width: 12,
      length: 16,
      height: 4.8
    });

    root.add(arenaGroup);
  }
}

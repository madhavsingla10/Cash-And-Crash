import * as THREE from 'three';
import { BuildingCollider } from './types';
import { WorldMaterials } from './materials';

export class DowntownBuilder {
  public static buildDowntown(root: THREE.Group, colliders: BuildingCollider[], mats: WorldMaterials) {
    const blockCenters = [-225, -175, -125, -75, -25, 25, 75, 125, 175, 225];
    const bSize = 34; // 34x34m each block

    for (let bx of blockCenters) {
      for (let bz of blockCenters) {
        // Exclude Central Park blocks
        if (Math.abs(bx) < 45 && Math.abs(bz) < 45) continue;

        // Exclude Farmland Sector (North-East: bx > 70 && bz < -70)
        if (bx > 70 && bz < -70) continue;

        // Exclude Countryside Suburbs Sector (South-East: bx > 70 && bz > 70)
        if (bx > 70 && bz > 70) continue;

        // Exclude Seaport Harbor Sector (South-West: bx < -70 && bz > 70)
        if (bx < -70 && bz > 70) continue;

        // --- DENSE DOWNTOWN SKYSCRAPER BLOCK ---
        // Sidewalk slab
        const sw = new THREE.Mesh(new THREE.BoxGeometry(bSize, 0.25, bSize), mats.sidewalkMat);
        sw.position.set(bx, 0.12, bz);
        sw.receiveShadow = true;
        root.add(sw);

        // Street Lamps on 2 corners of each block
        const lamp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.8, 6), mats.lampPostMat);
        lamp1.position.set(bx - bSize / 2 + 1.2, 2.4, bz - bSize / 2 + 1.2);
        const bulb1 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 6), mats.lampBulbMat);
        bulb1.position.set(0, 2.4, 0);
        lamp1.add(bulb1);

        const lamp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.8, 6), mats.lampPostMat);
        lamp2.position.set(bx + bSize / 2 - 1.2, 2.4, bz + bSize / 2 - 1.2);
        const bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 6), mats.lampBulbMat);
        bulb2.position.set(0, 2.4, 0);
        lamp2.add(bulb2);

        root.add(lamp1, lamp2);

        // Block Variations:
        // Type A: 4 Quad High-Rise Towers
        // Type B: 2 Twin Commercial Towers
        // Type C: 1 Mega Corporate Skyscraper
        const blockType = Math.random();

        if (blockType > 0.55) {
          const subSize = bSize / 2 - 2;
          const offsets = [
            [-subSize / 2 - 1, -subSize / 2 - 1],
            [subSize / 2 + 1, -subSize / 2 - 1],
            [-subSize / 2 - 1, subSize / 2 + 1],
            [subSize / 2 + 1, subSize / 2 + 1]
          ];

          for (let [ox, oz] of offsets) {
            const posX = bx + ox;
            const posZ = bz + oz;
            const height = 35 + Math.floor(Math.random() * 65); // 35m to 100m
            const col = mats.buildingPalettes[Math.floor(Math.random() * mats.buildingPalettes.length)];

            const bMat = new THREE.MeshStandardMaterial({
              color: col,
              map: mats.windowTexture,
              roughness: 0.25,
              metalness: 0.4
            });

            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(subSize, height, subSize), bMat);
            bMesh.position.set(posX, height / 2, posZ);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            root.add(bMesh);

            // Neon crown on tall quad towers
            if (height > 60) {
              const crown = new THREE.Mesh(
                new THREE.BoxGeometry(subSize + 0.5, 1.2, subSize + 0.5),
                Math.random() > 0.5 ? mats.neonCyanMat : mats.neonPinkMat
              );
              crown.position.set(posX, height + 0.6, posZ);
              root.add(crown);
            }

            colliders.push({
              box: new THREE.Box3().setFromCenterAndSize(
                new THREE.Vector3(posX, height / 2, posZ),
                new THREE.Vector3(subSize, height, subSize)
              ),
              type: 'building',
              height
            });
          }
        } else if (blockType > 0.2) {
          const twW = bSize - 4;
          const twD = bSize / 2 - 2;
          const offsets = [[0, -twD / 2 - 1], [0, twD / 2 + 1]];

          for (let [ox, oz] of offsets) {
            const posX = bx + ox;
            const posZ = bz + oz;
            const height = 55 + Math.floor(Math.random() * 70); // 55m to 125m
            const col = mats.buildingPalettes[Math.floor(Math.random() * mats.buildingPalettes.length)];

            const bMat = new THREE.MeshStandardMaterial({
              color: col,
              map: mats.windowTexture,
              roughness: 0.2,
              metalness: 0.5
            });

            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(twW, height, twD), bMat);
            bMesh.position.set(posX, height / 2, posZ);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            root.add(bMesh);

            colliders.push({
              box: new THREE.Box3().setFromCenterAndSize(
                new THREE.Vector3(posX, height / 2, posZ),
                new THREE.Vector3(twW, height, twD)
              ),
              type: 'building',
              height
            });
          }
        } else {
          // 1 Massive Corporate Skyscraper (up to 140m!) with Helipad & Spire
          const height = 80 + Math.floor(Math.random() * 60); // 80m to 140m!
          const col = mats.buildingPalettes[Math.floor(Math.random() * mats.buildingPalettes.length)];

          const bMat = new THREE.MeshStandardMaterial({
            color: col,
            map: mats.windowTexture,
            roughness: 0.15,
            metalness: 0.6
          });

          const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bSize - 4, height, bSize - 4), bMat);
          bMesh.position.set(bx, height / 2, bz);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          root.add(bMesh);

          // Helipad Ring
          const helipad = new THREE.Mesh(new THREE.RingGeometry(6, 8, 24), mats.neonCyanMat);
          helipad.rotation.x = -Math.PI / 2;
          helipad.position.set(bx, height + 0.2, bz);

          // Rooftop Spire Antenna
          const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 18, 6), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }));
          antenna.position.set(bx, height + 9, bz);
          root.add(helipad, antenna);

          colliders.push({
            box: new THREE.Box3().setFromCenterAndSize(
              new THREE.Vector3(bx, height / 2, bz),
              new THREE.Vector3(bSize - 4, height, bSize - 4)
            ),
            type: 'building',
            height
          });
        }
      }
    }
  }
}

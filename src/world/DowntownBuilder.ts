import * as THREE from 'three';
import { BuildingCollider } from './types';
import { WorldMaterials } from './materials';
import { SkyscraperGenerator, SkyscraperConfig } from './SkyscraperGenerator';

export class DowntownBuilder {
  public static buildDowntown(root: THREE.Group, colliders: BuildingCollider[], mats: WorldMaterials) {
    const blockCenters = [-225, -175, -125, -75, -25, 25, 75, 125, 175, 225];
    const bSize = 34; // 34x34m each block

    const styles: SkyscraperConfig['style'][] = [
      'gothic-terracotta',
      'art-deco',
      'modern-curtain',
      'cyber-megatower'
    ];

    let seedCounter = 100;

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
        // Sidewalk slab & Raised Granite Curbs (as in webgpu_generator_city.html)
        const sw = new THREE.Mesh(new THREE.BoxGeometry(bSize - 0.6, 0.28, bSize - 0.6), mats.sidewalkMat);
        sw.position.set(bx, 0.14, bz);
        sw.receiveShadow = true;

        // Perimeter Curb Frame
        const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(bSize, 0.32, 0.35), mats.curbMat);
        curbNorth.position.set(bx, 0.16, bz - bSize / 2 + 0.175);
        curbNorth.receiveShadow = true;
        const curbSouth = curbNorth.clone();
        curbSouth.position.z = bz + bSize / 2 - 0.175;

        const curbWest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, bSize), mats.curbMat);
        curbWest.position.set(bx - bSize / 2 + 0.175, 0.16, bz);
        curbWest.receiveShadow = true;
        const curbEast = curbWest.clone();
        curbEast.position.x = bx + bSize / 2 - 0.175;

        root.add(sw, curbNorth, curbSouth, curbWest, curbEast);

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
        // Type A: 4 Quad Neo-Gothic Towers
        // Type B: 2 Twin Art Deco Commercial Towers
        // Type C: 1 Mega Corporate Skyscraper (up to 145m)
        const blockType = Math.random();
        seedCounter++;

        if (blockType > 0.55) {
          // Quad Towers
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
            const height = 45 + Math.floor(Math.random() * 55); // 45m to 100m
            const style = styles[Math.floor(Math.random() * styles.length)];

            const towerGroup = SkyscraperGenerator.createSkyscraper({
              seed: seedCounter++,
              width: subSize,
              depth: subSize,
              totalHeight: height,
              style
            }, mats);

            towerGroup.position.set(posX, 0, posZ);
            root.add(towerGroup);

            colliders.push({
              box: new THREE.Box3().setFromCenterAndSize(
                new THREE.Vector3(posX, height / 2, posZ),
                new THREE.Vector3(subSize, height, subSize)
              ),
              type: 'building',
              height
            });
          }
        } else if (blockType > 0.22) {
          // Twin Towers
          const twW = bSize - 4;
          const twD = bSize / 2 - 2;
          const offsets = [[0, -twD / 2 - 1], [0, twD / 2 + 1]];
          const style = styles[Math.floor(Math.random() * styles.length)];

          for (let [ox, oz] of offsets) {
            const posX = bx + ox;
            const posZ = bz + oz;
            const height = 65 + Math.floor(Math.random() * 60); // 65m to 125m

            const towerGroup = SkyscraperGenerator.createSkyscraper({
              seed: seedCounter++,
              width: twW,
              depth: twD,
              totalHeight: height,
              style
            }, mats);

            towerGroup.position.set(posX, 0, posZ);
            root.add(towerGroup);

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
          // 1 Single Massive Grand Skyscraper (up to 150m)
          const height = 90 + Math.floor(Math.random() * 60); // 90m to 150m!
          const style = styles[Math.floor(Math.random() * styles.length)];

          const towerGroup = SkyscraperGenerator.createSkyscraper({
            seed: seedCounter++,
            width: bSize - 4,
            depth: bSize - 4,
            totalHeight: height,
            style
          }, mats);

          towerGroup.position.set(bx, 0, bz);
          root.add(towerGroup);

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

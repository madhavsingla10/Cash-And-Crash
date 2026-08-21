import * as THREE from 'three';
import { BuildingCollider } from '../CityBuilder';

export class DowntownCityBuilder {
  public static buildDowntown(
    root: THREE.Group,
    colliders: BuildingCollider[],
    startX: number,
    startZ: number,
    numBlocksX: number = 3,
    numBlocksZ: number = 3,
    blockSize: number = 55,
    roadWidth: number = 22
  ) {
    const downtownGroup = new THREE.Group();

    // Shared window texture generator
    const windowCanvas = document.createElement('canvas');
    windowCanvas.width = 128;
    windowCanvas.height = 128;
    const wctx = windowCanvas.getContext('2d')!;
    wctx.fillStyle = '#0f172a';
    wctx.fillRect(0, 0, 128, 128);
    for (let wy = 6; wy < 128; wy += 14) {
      for (let wx = 6; wx < 128; wx += 14) {
        wctx.fillStyle = Math.random() > 0.4 ? '#ffdd88' : (Math.random() > 0.5 ? '#38bdf8' : '#030712');
        wctx.fillRect(wx, wy, 9, 9);
      }
    }
    const windowTexture = new THREE.CanvasTexture(windowCanvas);
    windowTexture.wrapS = THREE.RepeatWrapping;
    windowTexture.wrapT = THREE.RepeatWrapping;

    const buildingPalettes = [
      0x1e293b, 0x0f172a, 0x1e1b4b, 0x172554, 0x042f2e, 0x311042, 0x2e1065
    ];

    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xff0077 });
    const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });

    for (let bx = 0; bx < numBlocksX; bx++) {
      for (let bz = 0; bz < numBlocksZ; bz++) {
        const blockCenterX = startX + bx * (blockSize + roadWidth);
        const blockCenterZ = startZ + bz * (blockSize + roadWidth);

        // Sidewalk slab
        const swMesh = new THREE.Mesh(
          new THREE.BoxGeometry(blockSize + 3, 0.25, blockSize + 3),
          sidewalkMat
        );
        swMesh.position.set(blockCenterX, 0.12, blockCenterZ);
        swMesh.receiveShadow = true;
        downtownGroup.add(swMesh);

        // Street Lamps on sidewalk corners
        const lampOffsets = [
          [-blockSize / 2, -blockSize / 2],
          [blockSize / 2, -blockSize / 2],
          [-blockSize / 2, blockSize / 2],
          [blockSize / 2, blockSize / 2]
        ];

        for (let [lx, lz] of lampOffsets) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.8, 6), lampPostMat);
          post.position.set(blockCenterX + lx, 2.4, blockCenterZ + lz);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 6), lampBulbMat);
          bulb.position.set(0, 2.4, 0);
          post.add(bulb);
          downtownGroup.add(post);
        }

        // Subdivide into 1 massive tower or 4 corporate skyscrapers
        const isQuad = Math.random() > 0.35;

        if (isQuad) {
          const subSize = blockSize / 2 - 2;
          const offsets = [
            [-subSize / 2 - 1, -subSize / 2 - 1],
            [subSize / 2 + 1, -subSize / 2 - 1],
            [-subSize / 2 - 1, subSize / 2 + 1],
            [subSize / 2 + 1, subSize / 2 + 1]
          ];

          for (let [ox, oz] of offsets) {
            const posX = blockCenterX + ox;
            const posZ = blockCenterZ + oz;
            const height = 30 + Math.floor(Math.random() * 65);
            const col = buildingPalettes[Math.floor(Math.random() * buildingPalettes.length)];

            const bMat = new THREE.MeshStandardMaterial({
              color: col,
              map: windowTexture,
              roughness: 0.25,
              metalness: 0.4
            });

            const bGeo = new THREE.BoxGeometry(subSize, height, subSize);
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.set(posX, height / 2, posZ);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            downtownGroup.add(bMesh);

            // Neon Rooftop Crown
            if (height > 50) {
              const crownMat = Math.random() > 0.5 ? neonCyanMat : neonPinkMat;
              const crown = new THREE.Mesh(new THREE.BoxGeometry(subSize + 0.6, 1.2, subSize + 0.6), crownMat);
              crown.position.set(posX, height + 0.6, posZ);
              downtownGroup.add(crown);
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
        } else {
          // Mega Skyscraper with Rooftop Helipad
          const height = 65 + Math.floor(Math.random() * 55);
          const col = buildingPalettes[Math.floor(Math.random() * buildingPalettes.length)];

          const bMat = new THREE.MeshStandardMaterial({
            color: col,
            map: windowTexture,
            roughness: 0.15,
            metalness: 0.7
          });

          const bGeo = new THREE.BoxGeometry(blockSize, height, blockSize);
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.set(blockCenterX, height / 2, blockCenterZ);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          downtownGroup.add(bMesh);

          // Helipad on top
          const helipad = new THREE.Mesh(
            new THREE.RingGeometry(8, 10, 24),
            neonCyanMat
          );
          helipad.rotation.x = -Math.PI / 2;
          helipad.position.set(blockCenterX, height + 0.2, blockCenterZ);
          downtownGroup.add(helipad);

          colliders.push({
            box: new THREE.Box3().setFromCenterAndSize(
              new THREE.Vector3(blockCenterX, height / 2, blockCenterZ),
              new THREE.Vector3(blockSize, height, blockSize)
            ),
            type: 'building',
            height
          });
        }
      }
    }

    root.add(downtownGroup);
  }
}

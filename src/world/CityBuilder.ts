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

export class CityBuilder {
  public static buildCity(scene: THREE.Scene): CityData {
    const root = new THREE.Group();
    const colliders: BuildingCollider[] = [];
    const ramps: StuntRamp[] = [];
    const spawnPoints: THREE.Vector3[] = [];
    const moneyLocations: THREE.Vector3[] = [];

    const citySize = 320; // 320x320m metropolitan district
    const halfCity = citySize / 2;
    const waterLevel = -2.5;

    // 1. Ocean / Water Plane surrounding the city island
    const oceanGeo = new THREE.PlaneGeometry(1200, 1200, 32, 32);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x005577,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = waterLevel;
    root.add(ocean);

    // 2. City Island Ground Slab (Cliff Edges)
    const islandGeo = new THREE.BoxGeometry(citySize, 6, citySize);
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.9 });
    const islandMesh = new THREE.Mesh(islandGeo, cliffMat);
    islandMesh.position.set(0, -3, 0);
    islandMesh.receiveShadow = true;
    root.add(islandMesh);

    // 3. Asphalt Road Grid Surface
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.9 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.7 });
    const roadMarkMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteMarkMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });

    // Road Grid Layout: 5x5 Blocks with wide avenues
    const blockSize = 46;
    const roadWidth = 18;
    const numBlocks = 5;
    const totalSpan = numBlocks * blockSize + (numBlocks - 1) * roadWidth;
    const startCoord = -totalSpan / 2 + blockSize / 2;

    // Building Colors palette
    const buildingPalettes = [
      0x1e293b, 0x0f172a, 0x334155, 0x1e1b4b, 0x312e81, 0x134e4a, 0x3b0764, 0x431407
    ];

    // Shared window texture generator
    const windowCanvas = document.createElement('canvas');
    windowCanvas.width = 128;
    windowCanvas.height = 128;
    const wctx = windowCanvas.getContext('2d')!;
    wctx.fillStyle = '#1e293b';
    wctx.fillRect(0, 0, 128, 128);
    for (let wy = 6; wy < 128; wy += 16) {
      for (let wx = 6; wx < 128; wx += 16) {
        wctx.fillStyle = Math.random() > 0.4 ? '#ffdd88' : (Math.random() > 0.6 ? '#66ccff' : '#0b1120');
        wctx.fillRect(wx, wy, 10, 10);
      }
    }
    const windowTexture = new THREE.CanvasTexture(windowCanvas);
    windowTexture.wrapS = THREE.RepeatWrapping;
    windowTexture.wrapT = THREE.RepeatWrapping;

    for (let bx = 0; bx < numBlocks; bx++) {
      for (let bz = 0; bz < numBlocks; bz++) {
        const blockX = startCoord + bx * (blockSize + roadWidth);
        const blockZ = startCoord + bz * (blockSize + roadWidth);

        // Subdivide block into 1 to 4 buildings
        const buildingCount = Math.random() > 0.4 ? 4 : 2;

        if (buildingCount === 4) {
          const subSize = blockSize / 2 - 1.5;
          const offsets = [
            [-subSize / 2 - 0.75, -subSize / 2 - 0.75],
            [subSize / 2 + 0.75, -subSize / 2 - 0.75],
            [-subSize / 2 - 0.75, subSize / 2 + 0.75],
            [subSize / 2 + 0.75, subSize / 2 + 0.75]
          ];

          for (let k = 0; k < 4; k++) {
            const [ox, oz] = offsets[k];
            const posX = blockX + ox;
            const posZ = blockZ + oz;
            const height = 18 + Math.floor(Math.random() * 55);
            const col = buildingPalettes[Math.floor(Math.random() * buildingPalettes.length)];

            const bMat = new THREE.MeshStandardMaterial({
              color: col,
              map: windowTexture,
              roughness: 0.3,
              metalness: 0.2
            });

            const bGeo = new THREE.BoxGeometry(subSize, height, subSize);
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.set(posX, height / 2, posZ);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            root.add(bMesh);

            // Add building collider box
            colliders.push({
              box: new THREE.Box3().setFromObject(bMesh),
              type: 'building',
              height
            });
          }
        } else {
          // Large single skyscraper / bank
          const height = 35 + Math.floor(Math.random() * 65);
          const col = buildingPalettes[Math.floor(Math.random() * buildingPalettes.length)];

          const bMat = new THREE.MeshStandardMaterial({
            color: col,
            map: windowTexture,
            roughness: 0.2,
            metalness: 0.5
          });

          const bGeo = new THREE.BoxGeometry(blockSize, height, blockSize);
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.set(blockX, height / 2, blockZ);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          root.add(bMesh);

          colliders.push({
            box: new THREE.Box3().setFromObject(bMesh),
            type: 'building',
            height
          });
        }

        // Sidewalk border for the block
        const swMesh = new THREE.Mesh(
          new THREE.BoxGeometry(blockSize + 3, 0.25, blockSize + 3),
          sidewalkMat
        );
        swMesh.position.set(blockX, 0.12, blockZ);
        swMesh.receiveShadow = true;
        root.add(swMesh);

        // Glowing Street Lamps at block corners
        const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });
        const lampOffsets = [
          [-blockSize / 2, -blockSize / 2],
          [blockSize / 2, -blockSize / 2],
          [-blockSize / 2, blockSize / 2],
          [blockSize / 2, blockSize / 2]
        ];

        for (let [lx, lz] of lampOffsets) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.5, 6), lampPostMat);
          post.position.set(blockX + lx, 2.25, blockZ + lz);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), lampBulbMat);
          bulb.position.set(0, 2.3, 0);
          post.add(bulb);
          root.add(post);
        }
      }
    }

    // 4. Ground Road Network Mesh
    const roadPlane = new THREE.Mesh(new THREE.PlaneGeometry(citySize - 10, citySize - 10), asphaltMat);
    roadPlane.rotation.x = -Math.PI / 2;
    roadPlane.position.y = 0.01;
    roadPlane.receiveShadow = true;
    root.add(roadPlane);

    // 5. Road Markings & Intersections
    const markGeo = new THREE.PlaneGeometry(1.2, 5);
    for (let bx = 0; bx <= numBlocks; bx++) {
      const rx = startCoord - blockSize / 2 - roadWidth / 2 + bx * (blockSize + roadWidth);
      if (rx < -halfCity + 10 || rx > halfCity - 10) continue;

      for (let z = -halfCity + 15; z < halfCity - 15; z += 12) {
        const mark = new THREE.Mesh(markGeo, roadMarkMat);
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(rx, 0.03, z);
        root.add(mark);
      }
    }

    for (let bz = 0; bz <= numBlocks; bz++) {
      const rz = startCoord - blockSize / 2 - roadWidth / 2 + bz * (blockSize + roadWidth);
      if (rz < -halfCity + 10 || rz > halfCity - 10) continue;

      for (let x = -halfCity + 15; x < halfCity - 15; x += 12) {
        const mark = new THREE.Mesh(markGeo, roadMarkMat);
        mark.rotation.x = -Math.PI / 2;
        mark.rotation.z = Math.PI / 2;
        mark.position.set(x, 0.03, rz);
        root.add(mark);
      }
    }

    // 6. Stunt Ramps placed around the city
    const rampLocations = [
      { pos: new THREE.Vector3(-45, 0, 0), rot: Math.PI / 2 },
      { pos: new THREE.Vector3(45, 0, 0), rot: -Math.PI / 2 },
      { pos: new THREE.Vector3(0, 0, -45), rot: 0 },
      { pos: new THREE.Vector3(0, 0, 45), rot: Math.PI },
      { pos: new THREE.Vector3(-105, 0, 70), rot: Math.PI / 4 },
      { pos: new THREE.Vector3(105, 0, -70), rot: -Math.PI * 0.75 }
    ];

    const rampMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 });
    for (let r of rampLocations) {
      const rampW = 8;
      const rampL = 12;
      const rampH = 3.2;

      // Construct wedge geometry
      const rampGeo = new THREE.BufferGeometry();
      // Triangle ramp wedge vertices
      const vertices = new Float32Array([
        // Front slope
        -rampW / 2, 0, rampL / 2,
        rampW / 2, 0, rampL / 2,
        rampW / 2, rampH, -rampL / 2,
        -rampW / 2, 0, rampL / 2,
        rampW / 2, rampH, -rampL / 2,
        -rampW / 2, rampH, -rampL / 2,
        // Back wall
        -rampW / 2, 0, -rampL / 2,
        -rampW / 2, rampH, -rampL / 2,
        rampW / 2, rampH, -rampL / 2,
        -rampW / 2, 0, -rampL / 2,
        rampW / 2, rampH, -rampL / 2,
        rampW / 2, 0, -rampL / 2
      ]);
      rampGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      rampGeo.computeVertexNormals();

      const rampMesh = new THREE.Mesh(rampGeo, rampMat);
      rampMesh.position.copy(r.pos);
      rampMesh.rotation.y = r.rot;
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      root.add(rampMesh);

      ramps.push({
        position: r.pos,
        rotationY: r.rot,
        width: rampW,
        length: rampL,
        height: rampH
      });
    }

    // 7. Perimeter Guardrails / Cliff Boundaries with intentional breakable gaps
    const railMat = new THREE.MeshStandardMaterial({ color: 0xdd3333, metalness: 0.8 });
    const borderPoints = [
      { start: new THREE.Vector3(-halfCity, 0, -halfCity), end: new THREE.Vector3(halfCity, 0, -halfCity) },
      { start: new THREE.Vector3(halfCity, 0, -halfCity), end: new THREE.Vector3(halfCity, 0, halfCity) },
      { start: new THREE.Vector3(halfCity, 0, halfCity), end: new THREE.Vector3(-halfCity, 0, halfCity) },
      { start: new THREE.Vector3(-halfCity, 0, halfCity), end: new THREE.Vector3(-halfCity, 0, -halfCity) }
    ];

    for (let bp of borderPoints) {
      const dist = bp.start.distanceTo(bp.end);
      const segCount = Math.floor(dist / 14);

      for (let s = 0; s < segCount; s++) {
        // Leave gaps for cars to fly off cliff!
        if (s % 4 === 1) continue;

        const alpha = s / segCount;
        const p1 = bp.start.clone().lerp(bp.end, alpha);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 0.4), railMat);
        rail.position.set(p1.x, 0.6, p1.z);
        if (Math.abs(bp.start.x - bp.end.x) < 0.1) {
          rail.rotation.y = Math.PI / 2;
        }
        rail.castShadow = true;
        root.add(rail);
      }
    }

    // 8. Ground Money Bags & Extraction Helipad (Strictly on Road Network)
    const streetMoney = [
      new THREE.Vector3(32, 0.8, -32),
      new THREE.Vector3(-32, 0.8, 32),
      new THREE.Vector3(-96, 0.8, -96),
      new THREE.Vector3(96, 0.8, -96),
      new THREE.Vector3(-96, 0.8, 96),
      new THREE.Vector3(96, 0.8, 96),
      new THREE.Vector3(32, 0.8, 96),
      new THREE.Vector3(-32, 0.8, -96),
      new THREE.Vector3(96, 0.8, -32),
      new THREE.Vector3(-96, 0.8, 32),
      new THREE.Vector3(32, 0.8, 0),
      new THREE.Vector3(-32, 0.8, 0),
      new THREE.Vector3(0, 0.8, 32),
      new THREE.Vector3(0, 0.8, -32),
      new THREE.Vector3(32, 0.8, 64),
      new THREE.Vector3(-32, 0.8, -64),
      new THREE.Vector3(96, 0.8, 0),
      new THREE.Vector3(-96, 0.8, 0),
      new THREE.Vector3(0, 0.8, 96),
      new THREE.Vector3(0, 0.8, -96)
    ];
    moneyLocations.push(...streetMoney);

    // Extraction Helipad (Marked at the Harbor Intersection)
    const extractionPoint = new THREE.Vector3(96, 0.1, 96);
    const helipadMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.8 });
    const helipad = new THREE.Mesh(new THREE.RingGeometry(6, 7.5, 32), helipadMat);
    helipad.rotation.x = -Math.PI / 2;
    helipad.position.copy(extractionPoint);
    root.add(helipad);

    // Helipad "H"
    const hMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const h1 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 7), hMat);
    h1.rotation.x = -Math.PI / 2;
    h1.position.set(extractionPoint.x - 2, 0.12, extractionPoint.z);
    const h2 = h1.clone();
    h2.position.x = extractionPoint.x + 2;
    const h3 = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.2), hMat);
    h3.rotation.x = -Math.PI / 2;
    h3.position.set(extractionPoint.x, 0.12, extractionPoint.z);
    root.add(h1, h2, h3);

    // Police Spawn points on road intersections
    spawnPoints.push(
      new THREE.Vector3(-96, 0.5, -96),
      new THREE.Vector3(96, 0.5, -96),
      new THREE.Vector3(-96, 0.5, 96),
      new THREE.Vector3(96, 0.5, 96),
      new THREE.Vector3(32, 0.5, -96),
      new THREE.Vector3(-32, 0.5, 96),
      new THREE.Vector3(-96, 0.5, 32),
      new THREE.Vector3(96, 0.5, -32)
    );

    scene.add(root);

    return {
      root,
      colliders,
      ramps,
      spawnPoints,
      moneyLocations,
      cityBounds: {
        minX: -halfCity,
        maxX: halfCity,
        minZ: -halfCity,
        maxZ: halfCity
      },
      waterLevel,
      extractionPoint
    };
  }
}

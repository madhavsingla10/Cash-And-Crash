import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from './types';
import { WorldMaterials } from './materials';

const SAND_HILLS = [
  { x: -75, z: 65, radius: 18, height: 6.2 },
  { x: -45, z: 75, radius: 15, height: 5.4 },
  { x: -15, z: 65, radius: 16, height: 5.6 },
  { x: 15, z: 75, radius: 14, height: 4.8 },
  { x: -85, z: 35, radius: 18, height: 6.4 },
  { x: -85, z: -15, radius: 16, height: 5.8 },
  { x: -85, z: -55, radius: 17, height: 6.0 },
  { x: -40, z: -20, radius: 14, height: 4.5 },
  { x: -10, z: 15, radius: 15, height: 5.0 },
  { x: -5, z: -60, radius: 16, height: 5.5 },
  { x: 30, z: 35, radius: 15, height: 5.2 },
  { x: -50, z: 40, radius: 14, height: 4.8 }
];

export function getDesertDuneHeight(worldX: number, worldZ: number): number {
  const localX = worldX - 175;
  const localZ = worldZ + 175;

  if (localX < -120 || localX > 120 || localZ < -120 || localZ > 120) {
    return 0;
  }

  let h = 0.1;
  if (localX < 30) {
    const windDist = localX * 0.707 + localZ * 0.707;
    const wave = Math.sin(windDist * 0.08) * 3.2 + Math.cos(localX * 0.05 - localZ * 0.09) * 2.0;
    const barchan = Math.max(0, Math.sin(localX * 0.12 + 0.5) * Math.cos(localZ * 0.12)) * 4.5;
    h = Math.max(0.1, wave + barchan);
  }

  for (let sh of SAND_HILLS) {
    const dx = localX - sh.x;
    const dz = localZ - sh.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < sh.radius * sh.radius) {
      const dist = Math.sqrt(distSq);
      const hillH = (1 - dist / sh.radius) * sh.height;
      h = Math.max(h, hillH);
    }
  }

  const edgeDist = Math.min(120 - Math.abs(localX), 120 - Math.abs(localZ));
  if (edgeDist < 20) {
    h *= Math.max(0, edgeDist / 20);
  }

  return h;
}

export class FarmlandBuilder {
  public static buildFarmland(
    root: THREE.Group,
    colliders: BuildingCollider[],
    ramps: StuntRamp[],
    mats: WorldMaterials
  ) {
    const farmGroup = new THREE.Group();
    farmGroup.position.set(175, 0, -175);

    // =============================================================
    // 1. GEOLOGICAL STRATIFIED SAND & CANYON MATERIALS
    // =============================================================
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.95 });
    const darkSandMat = new THREE.MeshStandardMaterial({ color: 0xc89f68, roughness: 0.9 });
    const sandstoneStrata1 = new THREE.MeshStandardMaterial({ color: 0xb56547, roughness: 0.85 });
    const sandstoneStrata2 = new THREE.MeshStandardMaterial({ color: 0xd48b6a, roughness: 0.85 });
    const sandstoneStrata3 = new THREE.MeshStandardMaterial({ color: 0xedd59e, roughness: 0.8 });
    const fertileSoilMat = new THREE.MeshStandardMaterial({ color: 0x3d2614, roughness: 0.95 });
    const oasisWaterMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.92 });
    const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 });
    const sunflowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const sunflowerCenterMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.95, roughness: 0.05 });

    // Main Sand Ground Base
    const baseGround = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      sandMat
    );
    baseGround.rotation.x = -Math.PI / 2;
    baseGround.position.set(0, 0.08, 0);
    baseGround.receiveShadow = true;
    farmGroup.add(baseGround);

    // =============================================================
    // 2. AEOLIAN GEOMORPHOLOGY: BARCHAN DUNES & PARABOLIC SAND WAVES
    // =============================================================
    const duneGeo = new THREE.PlaneGeometry(240, 240, 48, 48);
    duneGeo.rotateX(-Math.PI / 2);
    const posAttr = duneGeo.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const h = getDesertDuneHeight(vx + 175, vz - 175);
      posAttr.setY(i, h + 0.09);
    }
    duneGeo.computeVertexNormals();

    const duneMesh = new THREE.Mesh(duneGeo, darkSandMat);
    duneMesh.receiveShadow = true;
    duneMesh.castShadow = true;
    farmGroup.add(duneMesh);

    // 12 Prominent Sculpted Barchan Sand Hills
    for (let sh of SAND_HILLS) {
      const hillGeo = new THREE.CylinderGeometry(0.8, sh.radius, sh.height, 18);
      const hillMesh = new THREE.Mesh(hillGeo, sandMat);
      hillMesh.position.set(sh.x, sh.height / 2 + 0.1, sh.z);
      hillMesh.receiveShadow = true;
      hillMesh.castShadow = true;
      farmGroup.add(hillMesh);

      // Stunt launch ramp on each dune
      ramps.push({
        position: new THREE.Vector3(175 + sh.x, 0, -175 + sh.z),
        rotationY: Math.random() * Math.PI * 2,
        width: sh.radius * 1.3,
        length: sh.radius * 1.6,
        height: sh.height
      });
    }

    // =============================================================
    // 3. STRATIFIED SEDIMENTARY CANYON MESAS & NATURAL ARCH BRIDGE
    // =============================================================
    const canyonMesas = [
      { x: -75, z: -75, w: 32, d: 32, h: 16 },
      { x: -20, z: -85, w: 42, d: 24, h: 20 },
      { x: -85, z: 20, w: 26, d: 45, h: 14 },
      { x: -80, z: 80, w: 35, d: 35, h: 18 },
      { x: 80, z: -80, w: 30, d: 30, h: 12 }
    ];

    for (let cm of canyonMesas) {
      // 3-Tier Geological Stratification
      const tier1H = cm.h * 0.45; // Terracotta shale base
      const tier2H = cm.h * 0.35; // Golden sandstone mid
      const tier3H = cm.h * 0.20; // Capstone

      const t1 = new THREE.Mesh(new THREE.BoxGeometry(cm.w, tier1H, cm.d), sandstoneStrata1);
      t1.position.set(cm.x, tier1H / 2, cm.z);
      t1.castShadow = true;
      t1.receiveShadow = true;

      const t2 = new THREE.Mesh(new THREE.BoxGeometry(cm.w * 0.85, tier2H, cm.d * 0.85), sandstoneStrata2);
      t2.position.set(cm.x, tier1H + tier2H / 2, cm.z);
      t2.castShadow = true;
      t2.receiveShadow = true;

      const t3 = new THREE.Mesh(new THREE.BoxGeometry(cm.w * 0.7, tier3H, cm.d * 0.7), sandstoneStrata3);
      t3.position.set(cm.x, tier1H + tier2H + tier3H / 2, cm.z);
      t3.castShadow = true;
      t3.receiveShadow = true;

      farmGroup.add(t1, t2, t3);

      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(175 + cm.x, cm.h / 2, -175 + cm.z),
          new THREE.Vector3(cm.w, cm.h, cm.d)
        ),
        type: 'building',
        height: cm.h
      });

      ramps.push({
        position: new THREE.Vector3(175 + cm.x + cm.w * 0.5 + 4, 0, -175 + cm.z),
        rotationY: Math.PI / 2,
        width: 10,
        length: 14,
        height: cm.h * 0.5
      });
    }

    // Natural Sandstone Arch Bridge (Drive Under & Over!)
    const archGroup = new THREE.Group();
    archGroup.position.set(-50, 0, -85);

    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 12, 10), sandstoneStrata1);
    pillarL.position.set(-9, 6, 0);
    pillarL.castShadow = true;

    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 12, 10), sandstoneStrata1);
    pillarR.position.set(9, 6, 0);
    pillarR.castShadow = true;

    const archSpan = new THREE.Mesh(new THREE.BoxGeometry(22, 2.5, 8), sandstoneStrata2);
    archSpan.position.set(0, 12, 0);
    archSpan.castShadow = true;

    archGroup.add(pillarL, pillarR, archSpan);
    farmGroup.add(archGroup);

    // =============================================================
    // 4. PARABOLIC SOLAR CONCENTRATOR FIELD (CSP CLEAN ENERGY)
    // =============================================================
    const solarCSPGroup = new THREE.Group();
    solarCSPGroup.position.set(-15, 0, 45);

    // Parabolic Trough Mirrors
    for (let row = -2; row <= 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const mirrorTrough = new THREE.Mesh(
          new THREE.CylinderGeometry(2.2, 2.2, 8, 16, 1, true, 0, Math.PI),
          mirrorMat
        );
        mirrorTrough.rotation.x = Math.PI / 2;
        mirrorTrough.rotation.z = Math.PI / 2;
        mirrorTrough.position.set(col * 10, 1.8, row * 10);
        mirrorTrough.castShadow = true;

        // Focal Receiver Pipe
        const pipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffedd5 }) // Glowing heated molten salt
        );
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(col * 10, 2.8, row * 10);

        solarCSPGroup.add(mirrorTrough, pipe);
      }
    }

    // Central Solar Thermal Collector Tower
    const solarTower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 2.8, 22, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85 })
    );
    solarTower.position.set(0, 11, 0);
    solarTower.castShadow = true;

    const moltenReceiver = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 }) // 800°C Glowing Thermal Receiver
    );
    moltenReceiver.position.set(0, 22, 0);

    solarCSPGroup.add(solarTower, moltenReceiver);
    farmGroup.add(solarCSPGroup);

    // =============================================================
    // 5. HYDROLOGICAL DESERT OASIS & PALM TREES
    // =============================================================
    const oasisGroup = new THREE.Group();
    oasisGroup.position.set(-35, 0, -35);

    const oasisPool = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 16, 0.4, 24),
      oasisWaterMat
    );
    oasisPool.position.y = 0.15;
    oasisGroup.add(oasisPool);

    const palmAngles = [0, Math.PI * 0.35, Math.PI * 0.7, Math.PI * 1.1, Math.PI * 1.5, Math.PI * 1.85];
    for (let pa of palmAngles) {
      const palm = new THREE.Group();
      const px = Math.cos(pa) * 17.5;
      const pz = Math.sin(pa) * 17.5;
      palm.position.set(px, 0, pz);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.65, 9.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 })
      );
      trunk.position.set(0.7, 4.75, 0);
      trunk.rotation.z = -0.15;
      trunk.castShadow = true;
      palm.add(trunk);

      for (let f = 0; f < 8; f++) {
        const frondAngle = (f * Math.PI) / 4;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.7, 6.0, 4), palmLeafMat);
        frond.rotation.x = Math.PI / 3;
        frond.rotation.y = frondAngle;
        frond.position.set(0.7, 9.5, 0);
        frond.castShadow = true;
        palm.add(frond);
      }
      oasisGroup.add(palm);
    }
    farmGroup.add(oasisGroup);

    // =============================================================
    // 6. XEROPHYTIC VEGETATION: 12 SAGUARO CACTI
    // =============================================================
    const cactusPositions = [
      [-60, -50], [-70, -30], [-50, 10], [-65, 45], [-35, 65],
      [-15, -60], [-5, -40], [10, -75], [-45, -75], [-10, 75],
      [-25, -15], [5, 20]
    ];

    for (let [cx, cz] of cactusPositions) {
      const cactus = new THREE.Group();
      cactus.position.set(cx, 0, cz);

      const stemH = 6 + Math.random() * 4;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, stemH, 10), cactusMat);
      stem.position.y = stemH / 2;
      stem.castShadow = true;
      cactus.add(stem);

      const armL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.0, 8), cactusMat);
      armL1.rotation.z = Math.PI / 2;
      armL1.position.set(-1.0, stemH * 0.55, 0);
      const armL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8), cactusMat);
      armL2.position.set(-1.8, stemH * 0.55 + 1.25, 0);
      cactus.add(armL1, armL2);

      const armR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.0, 8), cactusMat);
      armR1.rotation.z = -Math.PI / 2;
      armR1.position.set(1.0, stemH * 0.7, 0);
      const armR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2, 8), cactusMat);
      armR2.position.set(1.8, stemH * 0.7 + 1.1, 0);
      cactus.add(armR1, armR2);

      farmGroup.add(cactus);
    }

    // =============================================================
    // 7. PREHISTORIC FOSSIL RIBCAGE TUNNEL
    // =============================================================
    const fossilTunnel = new THREE.Group();
    fossilTunnel.position.set(-65, 0, 0);
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });

    for (let r = 0; r < 7; r++) {
      const zPos = -15 + r * 5;
      const ribL = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.45, 6, 12, Math.PI * 0.7), boneMat);
      ribL.position.set(-1.5, 0, zPos);
      ribL.rotation.y = Math.PI / 2;
      ribL.rotation.z = -Math.PI / 2;
      ribL.castShadow = true;

      const ribR = ribL.clone();
      ribR.position.x = 1.5;
      ribR.rotation.z = Math.PI / 2;

      fossilTunnel.add(ribL, ribR);
    }
    farmGroup.add(fossilTunnel);

    // =============================================================
    // 8. PETROLEUM OIL PUMPJACK OUTPOST
    // =============================================================
    const oilOutpost = new THREE.Group();
    oilOutpost.position.set(-25, 0, 80);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });

    const pumpBase = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 12), steelMat);
    pumpBase.position.y = 1.25;
    pumpBase.castShadow = true;

    const samsonPost = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 4), steelMat);
    samsonPost.position.set(0, 6.5, 0);
    samsonPost.castShadow = true;

    const walkingBeam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 14), rustMat);
    walkingBeam.position.set(0, 10.5, 0);
    walkingBeam.rotation.x = -0.2;
    walkingBeam.castShadow = true;

    const horseHead = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.2, 8, 1, false, 0, Math.PI), steelMat);
    horseHead.rotation.z = Math.PI / 2;
    horseHead.position.set(0, 10.5, 7.0);

    oilOutpost.add(pumpBase, samsonPost, walkingBeam, horseHead);
    farmGroup.add(oilOutpost);

    // =============================================================
    // 9. AGRICULTURAL CROPS: WHEAT & SUNFLOWER FIELDS
    // =============================================================
    const wheatField = new THREE.Mesh(new THREE.BoxGeometry(60, 0.4, 60), mats.wheatMat);
    wheatField.position.set(45, 0.2, -45);
    wheatField.receiveShadow = true;
    farmGroup.add(wheatField);

    for (let rz = -70; rz <= -20; rz += 4.5) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(56, 0.25, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 })
      );
      ridge.position.set(45, 0.45, rz);
      farmGroup.add(ridge);
    }

    const sunflowerField = new THREE.Mesh(new THREE.BoxGeometry(60, 0.35, 60), fertileSoilMat);
    sunflowerField.position.set(45, 0.18, 25);
    sunflowerField.receiveShadow = true;
    farmGroup.add(sunflowerField);

    for (let sx = 20; sx <= 70; sx += 10) {
      for (let sz = 0; sz <= 50; sz += 10) {
        const flower = new THREE.Group();
        flower.position.set(sx, 0, sz);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x15803d }));
        stem.position.y = 1.6;

        const petals = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 12), sunflowerMat);
        petals.position.set(0, 3.2, 0);
        petals.rotation.x = -Math.PI / 4;

        const center = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 12), sunflowerCenterMat);
        center.position.set(0, 3.25, 0);
        center.rotation.x = -Math.PI / 4;

        flower.add(stem, petals, center);
        farmGroup.add(flower);
      }
    }

    // Hay Bale Stunt Pyramids
    const hayBaleMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.95 });
    for (let b = 0; b < 6; b++) {
      const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 3.2, 12), hayBaleMat);
      bale.position.set(55 + (b % 3) * 3.6, 1.8 + Math.floor(b / 3) * 3.2, -15);
      bale.rotation.z = Math.PI / 2;
      bale.castShadow = true;
      farmGroup.add(bale);
    }

    ramps.push({
      position: new THREE.Vector3(175 + 58, 0, -175 - 15),
      rotationY: 0,
      width: 10,
      length: 12,
      height: 4.5
    });

    root.add(farmGroup);
  }
}

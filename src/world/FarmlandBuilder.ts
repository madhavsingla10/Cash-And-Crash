import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from './types';
import { WorldMaterials } from './materials';

export class FarmlandBuilder {
  public static buildFarmland(
    root: THREE.Group,
    colliders: BuildingCollider[],
    ramps: StuntRamp[],
    mats: WorldMaterials
  ) {
    const farmGroup = new THREE.Group();
    farmGroup.position.set(175, 0, -175);

    // -------------------------------------------------------------
    // 1. VAST NATURAL MEADOW & SAND TERRAIN
    // -------------------------------------------------------------
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.95 });
    const farmMeadowGrassMat = new THREE.MeshStandardMaterial({ color: 0x4a5d23, roughness: 0.95 });

    // Main fertile sand & meadow ground slab
    const farmGround = new THREE.Mesh(
      new THREE.PlaneGeometry(210, 210),
      farmMeadowGrassMat
    );
    farmGround.rotation.x = -Math.PI / 2;
    farmGround.position.set(-10, 0.02, 10);
    farmGround.receiveShadow = true;
    farmGroup.add(farmGround);

    // Sand Ground Layer across the dunes and trails
    const sandGround = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      sandMat
    );
    sandGround.rotation.x = -Math.PI / 2;
    sandGround.position.set(-10, 0.025, 10);
    sandGround.receiveShadow = true;
    farmGroup.add(sandGround);

    // -------------------------------------------------------------
    // 2. SMALL ROLLING SAND HILLS & DUNES (Drivable Off-Road Mounds)
    // -------------------------------------------------------------
    // Locations for small rolling sand hills along the border and field corners
    const sandHills = [
      // Border Sand Dunes (where road was removed: X ≈ -70 to -10, Z ≈ 60 to 90)
      { x: -75, z: 65, radius: 12, height: 2.8 },
      { x: -55, z: 75, radius: 10, height: 2.2 },
      { x: -35, z: 65, radius: 11, height: 2.5 },
      { x: -15, z: 75, radius: 9, height: 2.0 },
      { x: 5, z: 65, radius: 10, height: 2.3 },
      { x: 25, z: 75, radius: 8, height: 1.8 },
      { x: -85, z: 35, radius: 12, height: 2.6 },
      { x: -85, z: 15, radius: 10, height: 2.2 },
      { x: -85, z: -15, radius: 11, height: 2.4 },
      { x: -85, z: -45, radius: 9, height: 1.9 },
      // Inner Field Dunes
      { x: -20, z: 35, radius: 8, height: 1.6 },
      { x: 0, z: 35, radius: 9, height: 1.8 },
      { x: 20, z: 35, radius: 8, height: 1.5 },
      { x: -35, z: -10, radius: 7, height: 1.4 },
      { x: 60, z: -60, radius: 10, height: 2.2 },
      { x: 45, z: -75, radius: 9, height: 1.9 }
    ];

    for (let sh of sandHills) {
      // Smooth low-poly dome sand hill
      const hillGeo = new THREE.CylinderGeometry(0.5, sh.radius, sh.height, 14);
      const hillMesh = new THREE.Mesh(hillGeo, sandMat);
      hillMesh.position.set(sh.x, sh.height / 2, sh.z);
      hillMesh.receiveShadow = true;
      hillMesh.castShadow = true;
      farmGroup.add(hillMesh);

      // Low-profile Stunt Ramp for jumping off the sand hill
      ramps.push({
        position: new THREE.Vector3(175 + sh.x, 0, -175 + sh.z),
        rotationY: Math.random() * Math.PI,
        width: sh.radius * 1.2,
        length: sh.radius * 1.5,
        height: sh.height
      });
    }

    // -------------------------------------------------------------
    // 3. EVS & BIO-HYDROLOGY (Canals & Footbridges)
    // -------------------------------------------------------------
    const canalWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0077b6,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const canal = new THREE.Mesh(new THREE.PlaneGeometry(6, 130), canalWaterMat);
    canal.rotation.x = -Math.PI / 2;
    canal.position.set(38, 0.035, 0);
    farmGroup.add(canal);

    for (let bz of [-40, 0, 40]) {
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 6), mats.woodPlankMat);
      bridge.position.set(38, 0.35, bz);
      bridge.castShadow = true;
      farmGroup.add(bridge);
    }

    // -------------------------------------------------------------
    // 4. BOTANY & CROPS (Wheat, Tilled Soil, Pumpkins)
    // -------------------------------------------------------------
    // A. Golden Ripe Wheat Field
    const wheatPlot = new THREE.Mesh(new THREE.BoxGeometry(45, 0.3, 45), mats.wheatMat);
    wheatPlot.position.set(-42, 0.2, -42);
    wheatPlot.receiveShadow = true;
    farmGroup.add(wheatPlot);

    for (let rz = -60; rz <= -24; rz += 4) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(42, 0.25, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9 })
      );
      ridge.position.set(-42, 0.45, rz);
      farmGroup.add(ridge);
    }

    // B. Dark Tilled Humus Soil
    const tilledPlot = new THREE.Mesh(
      new THREE.BoxGeometry(45, 0.3, 45),
      new THREE.MeshStandardMaterial({ color: 0x2b1704, roughness: 0.98 })
    );
    tilledPlot.position.set(42, 0.2, -42);
    farmGroup.add(tilledPlot);

    for (let rz = -60; rz <= -24; rz += 4.5) {
      const furrow = new THREE.Mesh(
        new THREE.BoxGeometry(42, 0.2, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.95 })
      );
      furrow.position.set(42, 0.4, rz);

      const sprout = new THREE.Mesh(
        new THREE.BoxGeometry(40, 0.15, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x52b788 })
      );
      sprout.position.set(42, 0.55, rz);
      farmGroup.add(furrow, sprout);
    }

    // C. Pumpkin & Squash Patch
    const strawPlot = new THREE.Mesh(
      new THREE.BoxGeometry(45, 0.25, 45),
      new THREE.MeshStandardMaterial({ color: 0xc89f68, roughness: 0.9 })
    );
    strawPlot.position.set(-42, 0.18, 5);
    farmGroup.add(strawPlot);

    const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xf77f00, roughness: 0.5 });
    for (let p = 0; p < 16; p++) {
      const pumpkin = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), pumpkinMat);
      pumpkin.scale.set(1.2, 0.9, 1.2);
      const px = -58 + (p % 4) * 10 + (Math.random() - 0.5) * 2;
      const pz = -10 + Math.floor(p / 4) * 10 + (Math.random() - 0.5) * 2;
      pumpkin.position.set(px, 0.9, pz);
      pumpkin.castShadow = true;
      farmGroup.add(pumpkin);
    }

    // -------------------------------------------------------------
    // 5. GREENHOUSES & SOLAR ARRAYS
    // -------------------------------------------------------------
    const greenhouseGlassMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });

    for (let gx of [24, 48]) {
      const greenhouse = new THREE.Group();
      greenhouse.position.set(gx, 0, 42);

      const domeGeo = new THREE.CylinderGeometry(6, 6, 28, 16, 1, false, 0, Math.PI);
      const dome = new THREE.Mesh(domeGeo, greenhouseGlassMat);
      dome.rotation.x = Math.PI / 2;
      dome.rotation.z = Math.PI / 2;
      greenhouse.add(dome);

      for (let rz = -12; rz <= 12; rz += 6) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(6.1, 0.15, 6, 16, Math.PI), frameMat);
        rib.rotation.y = Math.PI / 2;
        rib.position.set(0, 0, rz);
        greenhouse.add(rib);
      }

      farmGroup.add(greenhouse);

      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(175 + gx, 3, -175 + 42),
          new THREE.Vector3(12, 6, 28)
        ),
        type: 'building',
        height: 6
      });
    }

    // Solar PV Array
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
    for (let sp = -18; sp <= 18; sp += 9) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 4), solarMat);
      panel.position.set(sp, 2.2, -68);
      panel.rotation.x = -Math.PI / 6;
      panel.castShadow = true;

      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), frameMat);
      leg.position.set(sp, 1.1, -68);
      farmGroup.add(panel, leg);
    }

    // -------------------------------------------------------------
    // 6. GAMBREL RED BARN & GRAIN SILO
    // -------------------------------------------------------------
    const barnGroup = new THREE.Group();
    barnGroup.position.set(-42, 0, -2);

    const barnW = 22;
    const barnH = 10;
    const barnD = 32;

    const barnBody = new THREE.Mesh(
      new THREE.BoxGeometry(barnW, barnH, barnD),
      new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.7 })
    );
    barnBody.position.y = barnH / 2;
    barnBody.castShadow = true;
    barnBody.receiveShadow = true;

    const gambrelGeo = new THREE.CylinderGeometry(13.5, 13.5, barnD, 6, 1, false, 0, Math.PI);
    const barnRoof = new THREE.Mesh(
      gambrelGeo,
      new THREE.MeshStandardMaterial({ color: 0x540b0e, roughness: 0.55 })
    );
    barnRoof.rotation.x = Math.PI / 2;
    barnRoof.rotation.z = Math.PI / 2;
    barnRoof.position.y = barnH;
    barnRoof.castShadow = true;

    const cupola = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 3.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cupola.position.set(0, barnH + 6.5, 0);
    const cupolaRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 4), new THREE.MeshStandardMaterial({ color: 0x540b0e }));
    cupolaRoof.rotation.y = Math.PI / 4;
    cupolaRoof.position.set(0, barnH + 9, 0);
    const rooster = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.2), mats.neonGoldMat);
    rooster.position.set(0, barnH + 10.6, 0);

    const barnDoorL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 6.5, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    barnDoorL.position.set(-2.6, 3.25, barnD / 2 + 0.16);
    const barnDoorR = barnDoorL.clone();
    barnDoorR.position.x = 2.6;

    barnGroup.add(barnBody, barnRoof, cupola, cupolaRoof, rooster, barnDoorL, barnDoorR);
    farmGroup.add(barnGroup);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(175 - 42, (barnH + 8) / 2, -175 - 2),
        new THREE.Vector3(barnW + 2, barnH + 8, barnD + 2)
      ),
      type: 'building',
      height: barnH + 8
    });

    const siloMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.7, roughness: 0.35 });
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 5.0, 24, 18), siloMat);
    silo.position.set(-62, 12, -2);
    silo.castShadow = true;

    const siloDome = new THREE.Mesh(new THREE.SphereGeometry(5.0, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), siloMat);
    siloDome.position.set(-62, 24, -2);

    const augerPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 16, 6),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    augerPipe.rotation.z = Math.PI / 4;
    augerPipe.position.set(-52, 16, -2);

    farmGroup.add(silo, siloDome, augerPipe);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(175 - 62, 12, -175 - 2),
        new THREE.Vector3(10, 24, 10)
      ),
      type: 'building',
      height: 24
    });

    // -------------------------------------------------------------
    // 7. TRACTOR & HOMESTEAD
    // -------------------------------------------------------------
    const tractor = new THREE.Group();
    tractor.position.set(-18, 0, 15);
    tractor.rotation.y = -Math.PI / 4;

    const tractorGreenMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.4 });
    const tractorYellowMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.4 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 3.8), tractorGreenMat);
    hood.position.set(0, 1.6, 0.8);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    cab.position.set(0, 2.6, -1.2);
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    exhaust.position.set(0.9, 3.2, 1.8);

    const rearWheelL = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.9, 12), tireMat);
    rearWheelL.rotation.z = Math.PI / 2;
    rearWheelL.position.set(-1.6, 1.6, -1.2);
    const rearRimL = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.92, 10), tractorYellowMat);
    rearRimL.rotation.z = Math.PI / 2;
    rearRimL.position.set(-1.6, 1.6, -1.2);

    const rearWheelR = rearWheelL.clone();
    rearWheelR.position.x = 1.6;
    const rearRimR = rearRimL.clone();
    rearRimR.position.x = 1.6;

    const frontWheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.6, 10), tireMat);
    frontWheelL.rotation.z = Math.PI / 2;
    frontWheelL.position.set(-1.3, 0.9, 2.2);
    const frontWheelR = frontWheelL.clone();
    frontWheelR.position.x = 1.3;

    tractor.add(hood, cab, exhaust, rearWheelL, rearRimL, rearWheelR, rearRimR, frontWheelL, frontWheelR);
    farmGroup.add(tractor);

    // Homestead
    const homestead = new THREE.Group();
    homestead.position.set(42, 0, 5);
    const houseBody = new THREE.Mesh(new THREE.BoxGeometry(16, 7.0, 14), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }));
    houseBody.position.y = 3.5;
    const houseRoof = new THREE.Mesh(new THREE.ConeGeometry(12.5, 4.5, 4), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    houseRoof.rotation.y = Math.PI / 4;
    houseRoof.position.y = 7.0 + 2.25;
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.0, 1.4), new THREE.MeshStandardMaterial({ color: 0x7c2d12 }));
    chimney.position.set(4.5, 9.5, -2);
    const porch = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 4), mats.woodPlankMat);
    porch.position.set(0, 0.2, 8.5);
    const fence = new THREE.Mesh(new THREE.BoxGeometry(24, 0.9, 0.2), mats.fenceMat);
    fence.position.set(0, 0.45, 12);
    homestead.add(houseBody, houseRoof, chimney, porch, fence);
    farmGroup.add(homestead);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(175 + 42, 5, -175 + 5),
        new THREE.Vector3(16, 10, 14)
      ),
      type: 'building',
      height: 10
    });

    // -------------------------------------------------------------
    // 8. WINDMILL
    // -------------------------------------------------------------
    const windmill = new THREE.Group();
    windmill.position.set(-62, 0, -62);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.3 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 4.5, 26, 8), towerMat);
    tower.position.y = 13;

    const fanCenter = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), towerMat);
    fanCenter.position.set(0, 26, 2.2);

    for (let b = 0; b < 8; b++) {
      const bladeAngle = (b * Math.PI) / 4;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 11, 0.1), towerMat);
      blade.rotation.z = bladeAngle;
      blade.position.set(5.5 * Math.sin(bladeAngle), 26 + 5.5 * Math.cos(bladeAngle), 2.2);
      windmill.add(blade);
    }

    const tailRudder = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 5.0), new THREE.MeshStandardMaterial({ color: 0xd90429 }));
    tailRudder.position.set(0, 26, -3.5);

    const waterWell = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 2.0, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    waterWell.position.set(0, 1.0, 0);

    windmill.add(tower, fanCenter, tailRudder, waterWell);
    farmGroup.add(windmill);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(175 - 62, 13, -175 - 62),
        new THREE.Vector3(9, 26, 9)
      ),
      type: 'building',
      height: 26
    });

    root.add(farmGroup);
  }
}

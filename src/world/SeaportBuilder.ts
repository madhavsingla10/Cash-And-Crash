import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from './types';
import { WorldMaterials } from './materials';

export class SeaportBuilder {
  public static buildSeaport(
    root: THREE.Group,
    colliders: BuildingCollider[],
    _ramps: StuntRamp[],
    mats: WorldMaterials,
    waterLevel: number
  ) {
    // 1. Industrial Seaport Ground Slab (Dark asphalt terminal)
    const harborPad = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.85 })
    );
    harborPad.rotation.x = -Math.PI / 2;
    harborPad.position.set(-180, 0.08, 180);
    harborPad.receiveShadow = true;
    root.add(harborPad);

    // 2. Cargo Ships Floating in Deep Ocean Water (Outside island perimeter at y = waterLevel)
    const shipHullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const shipRedMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const shipWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const woodPlankMat = mats.woodPlankMat;

    // Cargo Ship 1 (Floating in West Ocean Water: X = -360, Y = -2.5, Z = 180)
    const ship1 = new THREE.Group();
    ship1.position.set(-360, waterLevel, 180);

    const hull1Lower = new THREE.Mesh(new THREE.BoxGeometry(24, 7.0, 100), shipRedMat);
    hull1Lower.position.y = 3.5;
    const hull1Upper = new THREE.Mesh(new THREE.BoxGeometry(24, 6.0, 100), shipHullMat);
    hull1Upper.position.y = 10;
    const bridge1 = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 22), shipWhiteMat);
    bridge1.position.set(0, 20, -34);
    const funnel1 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 9, 8), shipRedMat);
    funnel1.position.set(0, 28.5, -34);

    // Cargo containers on ship deck
    for (let sy = 0; sy < 2; sy++) {
      for (let sz = -15; sz <= 25; sz += 16) {
        const sc = new THREE.Mesh(
          new THREE.BoxGeometry(6.5, 3.6, 14),
          new THREE.MeshStandardMaterial({ color: mats.containerColors[(sy + sz) % mats.containerColors.length] })
        );
        sc.position.set(-4, 14.8 + sy * 3.6, sz);
        const sc2 = sc.clone();
        sc2.position.x = 4;
        ship1.add(sc, sc2);
      }
    }

    ship1.add(hull1Lower, hull1Upper, bridge1, funnel1);
    root.add(ship1);

    // Cargo Ship 1 Deck Collider
    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(-360, 4.0, 180),
        new THREE.Vector3(24, 13, 100)
      ),
      type: 'building',
      height: 10.5 + waterLevel
    });

    // 3. Drivable Ocean Pier / Boardwalk to Cargo Ship (Flush seamless transition from land to ship)
    const pierLength = 92;
    const pierW = 14;
    // Floor top is at y = 0.15 + 0.25 = 0.40m, matching the island land level perfectly!
    const pierFloor = new THREE.Mesh(new THREE.BoxGeometry(pierLength, 0.5, pierW), woodPlankMat);
    pierFloor.position.set(-306, 0.15, 180);
    pierFloor.receiveShadow = true;
    pierFloor.castShadow = true;

    // Smooth asphalt approach ramp connecting land to pier
    const rampGeo = new THREE.BoxGeometry(6.0, 0.15, pierW);
    const rampMesh = new THREE.Mesh(rampGeo, harborPad.material);
    rampMesh.position.set(-258, 0.08, 180);
    rampMesh.receiveShadow = true;
    root.add(rampMesh);

    // Heavy wooden support pilings driven into ocean bed
    for (let px = -262; px >= -348; px -= 10) {
      for (let pz of [180 - pierW / 2 + 0.6, 180 + pierW / 2 - 0.6]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 8.0, 8), woodPlankMat);
        post.position.set(px, -2.0, pz);
        root.add(post);
      }
    }

    // Safety Side Guardrails (along outer edges only, leaving wide 12m open drivable deck)
    const railL = new THREE.Mesh(new THREE.BoxGeometry(pierLength, 0.9, 0.4), woodPlankMat);
    railL.position.set(-306, 0.7, 180 - pierW / 2 + 0.2);
    const railR = railL.clone();
    railR.position.z = 180 + pierW / 2 - 0.2;

    root.add(pierFloor, railL, railR);

    // Left Railing Collider
    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(-306, 0.7, 180 - pierW / 2 + 0.2),
        new THREE.Vector3(pierLength, 1.4, 0.6)
      ),
      type: 'prop',
      height: 1.4
    });

    // Right Railing Collider
    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(-306, 0.7, 180 + pierW / 2 - 0.2),
        new THREE.Vector3(pierLength, 1.4, 0.6)
      ),
      type: 'prop',
      height: 1.4
    });

    // 4. SPACIOUS SHIPPING CONTAINER TERMINAL WITH WIDE DRIVING AVENUES (Farther Spaced Layout)
    const cW = 6.5;
    const cH = 3.6;
    const cL = 14.0;

    // Generous spacing: ΔX = 25m to 30m (18.5m to 23.5m wide avenues) and ΔZ = 30m (16m cross gaps)
    const containerLayouts = [
      // Row 1: East Terminal Lane (X = -135)
      { x: -135, z: 125, tier: 1, rot: 0 },
      { x: -135, z: 155, tier: 2, rot: 0 },
      { x: -135, z: 185, tier: 2, rot: 0 },
      { x: -135, z: 215, tier: 2, rot: 0 },
      { x: -135, z: 245, tier: 1, rot: 0 },

      // Row 2: Central East Lane (X = -160) - 25m away!
      { x: -160, z: 125, tier: 2, rot: 0 },
      { x: -160, z: 155, tier: 3, rot: 0 },
      { x: -160, z: 185, tier: 3, rot: 0 },
      { x: -160, z: 215, tier: 2, rot: 0 },
      { x: -160, z: 245, tier: 2, rot: 0 },

      // Row 3: Central West Lane (X = -190) - 30m away!
      { x: -190, z: 125, tier: 1, rot: 0 },
      { x: -190, z: 155, tier: 2, rot: 0 },
      { x: -190, z: 185, tier: 2, rot: 0 },
      { x: -190, z: 215, tier: 3, rot: 0 },
      { x: -190, z: 245, tier: 1, rot: 0 },

      // Row 4: West Terminal Pier Lane (X = -220) - 30m away!
      { x: -220, z: 125, tier: 2, rot: 0 },
      { x: -220, z: 155, tier: 3, rot: 0 },
      { x: -220, z: 185, tier: 3, rot: 0 },
      { x: -220, z: 215, tier: 2, rot: 0 },
      { x: -220, z: 245, tier: 2, rot: 0 },

      // Row 5: Deep Dock Pier Wall (X = -245) - 25m away!
      { x: -245, z: 125, tier: 1, rot: 0 },
      { x: -245, z: 155, tier: 2, rot: 0 },
      { x: -245, z: 185, tier: 2, rot: 0 },
      { x: -245, z: 215, tier: 2, rot: 0 },
      { x: -245, z: 245, tier: 1, rot: 0 }
    ];

    for (let c of containerLayouts) {
      for (let t = 0; t < c.tier; t++) {
        const col = mats.containerColors[(t + Math.floor(Math.abs(c.x * 5 + c.z * 7))) % mats.containerColors.length];
        const cMesh = new THREE.Mesh(
          new THREE.BoxGeometry(cW, cH, cL),
          new THREE.MeshStandardMaterial({ color: col, metalness: 0.65, roughness: 0.45 })
        );
        cMesh.position.set(c.x, cH / 2 + t * cH, c.z);
        cMesh.rotation.y = c.rot;
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        root.add(cMesh);
      }

      // Add solid building collider for each stack
      const totalH = c.tier * cH;
      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(c.x, totalH / 2, c.z),
          new THREE.Vector3(c.rot === 0 ? cW : cL, totalH, c.rot === 0 ? cL : cW)
        ),
        type: 'building',
        height: totalH
      });
    }
  }
}

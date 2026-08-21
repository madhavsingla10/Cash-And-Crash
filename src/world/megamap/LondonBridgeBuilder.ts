import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from '../CityBuilder';

export class LondonBridgeBuilder {
  public static buildBridge(
    root: THREE.Group,
    colliders: BuildingCollider[],
    ramps: StuntRamp[],
    centerX: number,
    centerZ: number,
    length: number = 130,
    width: number = 22
  ) {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(centerX, 0, centerZ);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xd9c5b2, // English Cotswold sandstone
      roughness: 0.8,
      metalness: 0.1
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x2b4c7e, // Iconic blue Victorian roof spires
      roughness: 0.4,
      metalness: 0.3
    });

    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x3388cc, // London bridge iconic blue suspension steel
      roughness: 0.3,
      metalness: 0.8
    });

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.85 });
    const railingMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, metalness: 0.7 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffea88 });

    // 1. Roadway Deck spanning across the river
    const deckGeo = new THREE.BoxGeometry(width, 1.8, length);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, 0.9, 0);
    deckMesh.receiveShadow = true;
    deckMesh.castShadow = true;
    bridgeGroup.add(deckMesh);

    // Road markings on the bridge
    const markGeo = new THREE.PlaneGeometry(1.2, 4.5);
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    for (let z = -length / 2 + 6; z < length / 2 - 6; z += 9) {
      const mark = new THREE.Mesh(markGeo, markMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 1.82, z);
      bridgeGroup.add(mark);
    }

    // Side Railings
    const railGeo = new THREE.BoxGeometry(0.5, 1.4, length);
    const railL = new THREE.Mesh(railGeo, railingMat);
    railL.position.set(-width / 2 + 0.4, 2.3, 0);
    const railR = new THREE.Mesh(railGeo, railingMat);
    railR.position.set(width / 2 - 0.4, 2.3, 0);
    bridgeGroup.add(railL, railR);

    // 2. Dual Iconic Gothic Towers (North & South Tower)
    const towerZPositions = [-length * 0.22, length * 0.22];

    for (let tz of towerZPositions) {
      const tower = new THREE.Group();
      tower.position.set(0, 0, tz);

      // Left and Right Base Pillars with arch in center
      const pillarW = 4.5;
      const pillarH = 26;
      const pillarD = 10;
      const pillarOffset = width / 2 - pillarW / 2;

      // Left Pillar
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(pillarW, pillarH, pillarD), stoneMat);
      leftPillar.position.set(-pillarOffset, pillarH / 2, 0);
      leftPillar.castShadow = true;
      tower.add(leftPillar);

      // Right Pillar
      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(pillarW, pillarH, pillarD), stoneMat);
      rightPillar.position.set(pillarOffset, pillarH / 2, 0);
      rightPillar.castShadow = true;
      tower.add(rightPillar);

      // Tower Arch Header (Bridge portal overhead)
      const archHeader = new THREE.Mesh(new THREE.BoxGeometry(width + 2, 7, pillarD), stoneMat);
      archHeader.position.set(0, 16.5, 0);
      archHeader.castShadow = true;
      tower.add(archHeader);

      // 4 Gothic Spires on each tower
      const spireOffsets = [
        [-pillarOffset - 1.2, -pillarD / 2 + 1.2],
        [-pillarOffset - 1.2, pillarD / 2 - 1.2],
        [pillarOffset + 1.2, -pillarD / 2 + 1.2],
        [pillarOffset + 1.2, pillarD / 2 - 1.2]
      ];

      for (let [sx, sz] of spireOffsets) {
        const spire = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 6), roofMat);
        spire.position.set(sx, pillarH + 4.5, sz);
        spire.castShadow = true;
        tower.add(spire);
      }

      // Tower Central Victorian Roof
      const centralRoof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 8, 4), roofMat);
      centralRoof.position.set(0, pillarH + 4, 0);
      centralRoof.rotation.y = Math.PI / 4;
      tower.add(centralRoof);

      // Warm glowing lantern inside archway
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), lightMat);
      lamp.position.set(0, 12, 0);
      tower.add(lamp);

      bridgeGroup.add(tower);

      // Add Colliders for the solid left and right pillars
      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(centerX - pillarOffset, pillarH / 2, centerZ + tz),
          new THREE.Vector3(pillarW, pillarH, pillarD)
        ),
        type: 'building',
        height: pillarH
      });

      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(centerX + pillarOffset, pillarH / 2, centerZ + tz),
          new THREE.Vector3(pillarW, pillarH, pillarD)
        ),
        type: 'building',
        height: pillarH
      });
    }

    // 3. High Walkways connecting the two Towers
    const walkwayGeo = new THREE.BoxGeometry(width - 4, 2.5, Math.abs(towerZPositions[1] - towerZPositions[0]));
    const walkway1 = new THREE.Mesh(walkwayGeo, stoneMat);
    walkway1.position.set(0, 21, 0);
    const walkway2 = new THREE.Mesh(walkwayGeo, stoneMat);
    walkway2.position.set(0, 25, 0);
    bridgeGroup.add(walkway1, walkway2);

    // 4. Blue Suspension Cables
    const cablePoints = [
      new THREE.Vector3(-width / 2 + 1, 2, -length / 2),
      new THREE.Vector3(-width / 2 + 1, 20, towerZPositions[0]),
      new THREE.Vector3(-width / 2 + 1, 10, 0),
      new THREE.Vector3(-width / 2 + 1, 20, towerZPositions[1]),
      new THREE.Vector3(-width / 2 + 1, 2, length / 2)
    ];

    const cableCurveL = new THREE.CatmullRomCurve3(cablePoints);
    const cableGeoL = new THREE.TubeGeometry(cableCurveL, 32, 0.35, 8, false);
    const cableMeshL = new THREE.Mesh(cableGeoL, cableMat);
    bridgeGroup.add(cableMeshL);

    const cablePointsR = cablePoints.map(p => new THREE.Vector3(-p.x, p.y, p.z));
    const cableCurveR = new THREE.CatmullRomCurve3(cablePointsR);
    const cableGeoR = new THREE.TubeGeometry(cableCurveR, 32, 0.35, 8, false);
    const cableMeshR = new THREE.Mesh(cableGeoR, cableMat);
    bridgeGroup.add(cableMeshR);

    // 5. Stunt Jump Ramp near the bridge entrance
    ramps.push({
      position: new THREE.Vector3(centerX, 0, centerZ - length / 2 - 8),
      rotationY: 0,
      width: 10,
      length: 12,
      height: 3.5
    });

    root.add(bridgeGroup);
  }
}

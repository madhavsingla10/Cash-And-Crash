import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from '../CityBuilder';

export class FarmlandBuilder {
  public static buildFarmland(
    root: THREE.Group,
    colliders: BuildingCollider[],
    ramps: StuntRamp[],
    centerX: number,
    centerZ: number,
    sizeX: number = 220,
    sizeZ: number = 220
  ) {
    const farmGroup = new THREE.Group();
    farmGroup.position.set(centerX, 0, centerZ);

    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.95 });
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.9 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x606c38, roughness: 0.9 });
    const barnWoodMat = new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.7 });
    const siloMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.6, roughness: 0.4 });
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.95 });
    const windmillMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 });

    // 1. Farmland Soil & Crop Patch Plots
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(sizeX, sizeZ), greenMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.05;
    ground.receiveShadow = true;
    farmGroup.add(ground);

    // Wheat crop rows
    const numCropPlots = 3;
    for (let c = 0; c < numCropPlots; c++) {
      const cropW = sizeX * 0.35;
      const cropD = sizeZ * 0.28;
      const cropX = (c % 2 === 0 ? -1 : 1) * (sizeX * 0.24);
      const cropZ = (c < 2 ? -1 : 1) * (sizeZ * 0.24);

      const fieldBed = new THREE.Mesh(new THREE.BoxGeometry(cropW, 0.4, cropD), wheatMat);
      fieldBed.position.set(cropX, 0.2, cropZ);
      fieldBed.receiveShadow = true;
      farmGroup.add(fieldBed);

      // Hay bales scattered around the field
      for (let h = 0; h < 6; h++) {
        const hay = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.2, 10), hayMat);
        hay.rotation.z = Math.PI / 2;
        hay.position.set(
          cropX + (Math.random() - 0.5) * (cropW - 6),
          1.2,
          cropZ + (Math.random() - 0.5) * (cropD - 6)
        );
        hay.castShadow = true;
        farmGroup.add(hay);
      }
    }

    // 2. Big Red Rustic Barn
    const barnW = 24;
    const barnH = 14;
    const barnD = 32;
    const barnX = 35;
    const barnZ = 20;

    const barnMesh = new THREE.Mesh(new THREE.BoxGeometry(barnW, barnH, barnD), barnWoodMat);
    barnMesh.position.set(barnX, barnH / 2, barnZ);
    barnMesh.castShadow = true;
    barnMesh.receiveShadow = true;
    farmGroup.add(barnMesh);

    // Gambrel Barn Roof
    const barnRoof = new THREE.Mesh(
      new THREE.ConeGeometry(barnW * 0.8, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0x540b0e, roughness: 0.6 })
    );
    barnRoof.rotation.y = Math.PI / 4;
    barnRoof.position.set(barnX, barnH + 3, barnZ);
    farmGroup.add(barnRoof);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX + barnX, (barnH + 6) / 2, centerZ + barnZ),
        new THREE.Vector3(barnW, barnH + 6, barnD)
      ),
      type: 'building',
      height: barnH + 6
    });

    // 3. Grain Silo next to Barn
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 22, 16), siloMat);
    silo.position.set(barnX - 18, 11, barnZ);
    silo.castShadow = true;
    const siloCap = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 8), siloMat);
    siloCap.position.set(barnX - 18, 22, barnZ);
    farmGroup.add(silo, siloCap);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX + barnX - 18, 11, centerZ + barnZ),
        new THREE.Vector3(9, 24, 9)
      ),
      type: 'building',
      height: 24
    });

    // 4. Windmill with rotating blades
    const windmillBase = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 5.5, 24, 8), windmillMat);
    windmillBase.position.set(-45, 12, -35);
    windmillBase.castShadow = true;
    farmGroup.add(windmillBase);

    // Windmill blades rotor
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(-45, 21, -31);

    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 12, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x996633 })
      );
      blade.rotation.z = (b * Math.PI) / 2;
      blade.position.y = 5.5 * Math.cos((b * Math.PI) / 2);
      blade.position.x = 5.5 * Math.sin((b * Math.PI) / 2);
      rotorGroup.add(blade);
    }
    farmGroup.add(rotorGroup);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX - 45, 12, centerZ - 35),
        new THREE.Vector3(10, 25, 10)
      ),
      type: 'building',
      height: 25
    });

    // 5. Dirt Ramp in the Farmland
    ramps.push({
      position: new THREE.Vector3(centerX - 15, 0, centerZ + 45),
      rotationY: Math.PI / 4,
      width: 10,
      length: 14,
      height: 4.0
    });

    root.add(farmGroup);
  }
}

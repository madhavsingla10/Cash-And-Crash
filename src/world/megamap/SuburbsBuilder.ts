import * as THREE from 'three';
import { BuildingCollider } from '../CityBuilder';

export class SuburbsBuilder {
  public static buildSuburbs(
    root: THREE.Group,
    colliders: BuildingCollider[],
    startX: number,
    startZ: number,
    numPlotsX: number = 4,
    numPlotsZ: number = 4,
    plotSize: number = 36,
    streetWidth: number = 16
  ) {
    const suburbsGroup = new THREE.Group();

    const houseColors = [
      0xf1faee, 0xfefae0, 0xfaedcd, 0xd4a373, 0xe9ecef, 0xced4da, 0xd8e2dc
    ];
    const roofColors = [
      0x780000, 0x660708, 0x1f2421, 0x212529, 0x3d348b, 0x582f0e
    ];

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x4f772d, roughness: 0.9 });
    const drivewayMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.8 });
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x800e13, roughness: 0.8 });
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.9 });
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });

    for (let px = 0; px < numPlotsX; px++) {
      for (let pz = 0; pz < numPlotsZ; pz++) {
        const plotCenterX = startX + px * (plotSize + streetWidth);
        const plotCenterZ = startZ + pz * (plotSize + streetWidth);

        // Lawn yard
        const yard = new THREE.Mesh(new THREE.BoxGeometry(plotSize, 0.2, plotSize), grassMat);
        yard.position.set(plotCenterX, 0.1, plotCenterZ);
        yard.receiveShadow = true;
        suburbsGroup.add(yard);

        // Driveway
        const driveway = new THREE.Mesh(new THREE.PlaneGeometry(6, plotSize / 2), drivewayMat);
        driveway.rotation.x = -Math.PI / 2;
        driveway.position.set(plotCenterX - 7, 0.22, plotCenterZ + plotSize / 4);
        driveway.receiveShadow = true;
        suburbsGroup.add(driveway);

        // Main House Body
        const houseW = 14 + Math.random() * 4;
        const houseH = 6.5;
        const houseD = 12 + Math.random() * 3;
        const houseColor = houseColors[Math.floor(Math.random() * houseColors.length)];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

        const houseMesh = new THREE.Mesh(
          new THREE.BoxGeometry(houseW, houseH, houseD),
          new THREE.MeshStandardMaterial({ color: houseColor, roughness: 0.6 })
        );
        houseMesh.position.set(plotCenterX + 2, houseH / 2, plotCenterZ - 2);
        houseMesh.castShadow = true;
        houseMesh.receiveShadow = true;
        suburbsGroup.add(houseMesh);

        // Pitched Roof (Prism / Wedge)
        const roofH = 4.5;
        const roofGeo = new THREE.ConeGeometry(houseW * 0.75, roofH, 4);
        const roofMesh = new THREE.Mesh(
          roofGeo,
          new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.5 })
        );
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.set(plotCenterX + 2, houseH + roofH / 2, plotCenterZ - 2);
        roofMesh.castShadow = true;
        suburbsGroup.add(roofMesh);

        // Chimney
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4, 1.4), chimneyMat);
        chimney.position.set(plotCenterX + 5, houseH + 3, plotCenterZ - 3);
        chimney.castShadow = true;
        suburbsGroup.add(chimney);

        // Front Porch Door
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 3.2, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x3a2e2b })
        );
        door.position.set(plotCenterX + 2, 1.6, plotCenterZ - 2 + houseD / 2 + 0.1);
        suburbsGroup.add(door);

        // Yard Tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.5, 6), treeTrunkMat);
        trunk.position.set(plotCenterX + 10, 1.75, plotCenterZ + 8);
        trunk.castShadow = true;
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4), treeLeavesMat);
        leaves.position.set(plotCenterX + 10, 4.8, plotCenterZ + 8);
        leaves.castShadow = true;
        suburbsGroup.add(trunk, leaves);

        // Front Picket Fence segments
        const fenceGeo = new THREE.BoxGeometry(plotSize, 1.0, 0.2);
        const fence = new THREE.Mesh(fenceGeo, fenceMat);
        fence.position.set(plotCenterX, 0.5, plotCenterZ + plotSize / 2);
        suburbsGroup.add(fence);

        // Add Collider for House
        colliders.push({
          box: new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(plotCenterX + 2, (houseH + roofH) / 2, plotCenterZ - 2),
            new THREE.Vector3(houseW, houseH + roofH, houseD)
          ),
          type: 'building',
          height: houseH + roofH
        });
      }
    }

    root.add(suburbsGroup);
  }
}

import * as THREE from 'three';
import { BuildingCollider } from './types';
import { WorldMaterials } from './materials';

export class CountrysideBuilder {
  public static buildCountryside(root: THREE.Group, colliders: BuildingCollider[], mats: WorldMaterials) {
    // Paved stone tile village floor overlay across entire residential village
    const villageFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      mats.pavedTileMat
    );
    villageFloor.rotation.x = -Math.PI / 2;
    villageFloor.position.set(175, 0.08, 175);
    villageFloor.receiveShadow = true;
    root.add(villageFloor);

    // 24 Detailed Cottage Villas with Private Gardens & Tiled Courtyards
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const hx = 115 + col * 24;
        const hz = 115 + row * 34;

        // Skip Gateway Plaza and road intersections
        if (Math.abs(hx - 95) < 20 && Math.abs(hz - 95) < 20) continue;
        if (Math.abs(hx - 150) < 9 || Math.abs(hx - 200) < 9) continue;
        if (Math.abs(hz - 150) < 9 || Math.abs(hz - 200) < 9) continue;

        const hColor = mats.houseColors[(row * 6 + col) % mats.houseColors.length];
        const rColor = mats.roofColors[(row * 6 + col) % mats.roofColors.length];

        const cottage = new THREE.Group();
        cottage.position.set(hx, 0, hz);

        // Main 2-Story Villa Body
        const bodyW = 14;
        const bodyH = 7.5;
        const bodyD = 12;
        const houseBody = new THREE.Mesh(
          new THREE.BoxGeometry(bodyW, bodyH, bodyD),
          new THREE.MeshStandardMaterial({ color: hColor, roughness: 0.6 })
        );
        houseBody.position.y = bodyH / 2;
        houseBody.castShadow = true;
        houseBody.receiveShadow = true;

        // Gabled Roof with Overhanging Eaves
        const roofH = 4.8;
        const houseRoof = new THREE.Mesh(
          new THREE.ConeGeometry(bodyW * 0.78, roofH, 4),
          new THREE.MeshStandardMaterial({ color: rColor, roughness: 0.5 })
        );
        houseRoof.rotation.y = Math.PI / 4;
        houseRoof.position.y = bodyH + roofH / 2;
        houseRoof.castShadow = true;

        // Red Brick Chimney
        const chimney = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 4.0, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x800e13, roughness: 0.8 })
        );
        chimney.position.set(3.8, bodyH + 2.5, -2);
        chimney.castShadow = true;

        // Front Porch with Portico Columns
        const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 3), new THREE.MeshStandardMaterial({ color: rColor }));
        porchRoof.position.set(0, 3.6, bodyD / 2 + 1.5);
        const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.4, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        colL.position.set(-2.2, 1.7, bodyD / 2 + 2.8);
        const colR = colL.clone();
        colR.position.x = 2.2;

        // Front Door
        const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x332211 }));
        door.position.set(0, 1.6, bodyD / 2 + 0.12);

        // Private Flower Garden
        const gardenMat = new THREE.MeshStandardMaterial({
          color: mats.flowerbedColors[(row * 6 + col) % mats.flowerbedColors.length],
          roughness: 0.6
        });
        const flowerBed = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 3), gardenMat);
        flowerBed.position.set(-4, 0.2, bodyD / 2 + 3);

        // Picket Fence surrounding property
        const fenceFront = new THREE.Mesh(new THREE.BoxGeometry(20, 0.9, 0.2), mats.fenceMat);
        fenceFront.position.set(0, 0.45, bodyD / 2 + 5.5);

        // Garden fruit tree
        const tree = new THREE.Group();
        const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.2, 6), mats.trunkMat);
        tTrunk.position.y = 1.6;
        const tLeaves = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0), mats.treeMat);
        tLeaves.position.y = 3.8;
        tree.position.set(6, 0, bodyD / 2 + 3);
        tree.add(tTrunk, tLeaves);

        cottage.add(houseBody, houseRoof, chimney, porchRoof, colL, colR, door, flowerBed, fenceFront, tree);
        root.add(cottage);

        colliders.push({
          box: new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(hx, (bodyH + roofH) / 2, hz),
            new THREE.Vector3(bodyW + 2, bodyH + roofH, bodyD + 2)
          ),
          type: 'building',
          height: bodyH + roofH
        });
      }
    }
  }
}

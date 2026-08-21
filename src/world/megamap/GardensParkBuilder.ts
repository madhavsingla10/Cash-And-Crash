import * as THREE from 'three';
import { BuildingCollider } from '../CityBuilder';

export class GardensParkBuilder {
  public static buildGardens(
    root: THREE.Group,
    colliders: BuildingCollider[],
    centerX: number,
    centerZ: number,
    radius: number = 95
  ) {
    const gardenGroup = new THREE.Group();
    gardenGroup.position.set(centerX, 0, centerZ);

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.9 });
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.8 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.3, metalness: 0.1 });
    const fountainWaterMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });

    const flowerColors = [0xff0054, 0x9b5de5, 0xf15bb5, 0xfee440, 0x00f5d4];

    // 1. Garden Circular Lawn Base
    const lawn = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.3, 32), grassMat);
    lawn.position.y = 0.15;
    lawn.receiveShadow = true;
    gardenGroup.add(lawn);

    // 2. Cross and Ring Pathways
    const ringPath = new THREE.Mesh(new THREE.RingGeometry(radius * 0.45, radius * 0.55, 32), pathMat);
    ringPath.rotation.x = -Math.PI / 2;
    ringPath.position.y = 0.32;
    gardenGroup.add(ringPath);

    const path1 = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.9, 8), pathMat);
    path1.rotation.x = -Math.PI / 2;
    path1.position.y = 0.31;
    const path2 = path1.clone();
    path2.rotation.z = Math.PI / 2;
    gardenGroup.add(path1, path2);

    // 3. Central Grand Marble Water Fountain
    const fountainBasin = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 2.2, 24), marbleMat);
    fountainBasin.position.y = 1.1;
    fountainBasin.castShadow = true;
    const waterMesh = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 13.2, 1.8, 24), fountainWaterMat);
    waterMesh.position.y = 1.4;

    const centerPillar = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.2, 6.5, 12), marbleMat);
    centerPillar.position.y = 3.25;

    const topBowl = new THREE.Mesh(new THREE.CylinderGeometry(6, 4, 1.4, 16), marbleMat);
    topBowl.position.y = 6.8;

    gardenGroup.add(fountainBasin, waterMesh, centerPillar, topBowl);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX, 4, centerZ),
        new THREE.Vector3(30, 8, 30)
      ),
      type: 'building',
      height: 8
    });

    // 4. Botanical Flower Beds
    for (let f = 0; f < 8; f++) {
      const angle = (f * Math.PI) / 4 + Math.PI / 8;
      const dist = radius * 0.72;
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * dist;

      const fColor = flowerColors[f % flowerColors.length];
      const flowerBed = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 7.5, 0.8, 12),
        new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.6 })
      );
      flowerBed.position.set(fx, 0.4, fz);
      flowerBed.castShadow = true;
      gardenGroup.add(flowerBed);
    }

    // 5. Classic Stone Gazebos (North & South)
    const gazeboOffsets = [[0, radius * 0.75], [0, -radius * 0.75]];
    for (let [gx, gz] of gazeboOffsets) {
      const gazebo = new THREE.Group();
      gazebo.position.set(gx, 0, gz);

      // Gazebo base
      const gBase = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1.2, 8), marbleMat);
      gBase.position.y = 0.6;
      gazebo.add(gBase);

      // Pillars
      for (let p = 0; p < 6; p++) {
        const pAngle = (p * Math.PI) / 3;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5.5, 6), marbleMat);
        post.position.set(Math.cos(pAngle) * 4.8, 3.5, Math.sin(pAngle) * 4.8);
        post.castShadow = true;
        gazebo.add(post);
      }

      // Gazebo Roof
      const gRoof = new THREE.Mesh(
        new THREE.ConeGeometry(7, 4.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.5 })
      );
      gRoof.position.y = 8.5;
      gRoof.castShadow = true;
      gazebo.add(gRoof);

      gardenGroup.add(gazebo);

      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(centerX + gx, 5, centerZ + gz),
          new THREE.Vector3(13, 10, 13)
        ),
        type: 'building',
        height: 10
      });
    }

    // 6. Sculpted Oak & Pine Park Trees
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });

    for (let t = 0; t < 12; t++) {
      const angle = (t * Math.PI) / 6;
      const tDist = radius * (0.35 + Math.random() * 0.45);
      const tx = Math.cos(angle) * tDist;
      const tz = Math.sin(angle) * tDist;

      if (Math.abs(tx) < 6 || Math.abs(tz) < 6) continue; // Keep paths clear

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 4.5, 6), trunkMat);
      trunk.position.y = 2.25;
      trunk.castShadow = true;

      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2), treeMat);
      foliage.position.y = 6.0;
      foliage.castShadow = true;

      tree.position.set(tx, 0, tz);
      tree.add(trunk, foliage);
      gardenGroup.add(tree);
    }

    root.add(gardenGroup);
  }
}

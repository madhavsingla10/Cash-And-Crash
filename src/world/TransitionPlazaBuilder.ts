import * as THREE from 'three';
import { WorldMaterials } from './materials';

export class TransitionPlazaBuilder {
  public static buildTransitionPlaza(root: THREE.Group, mats: WorldMaterials) {
    // 1. Greenery Transition Belt (City to Countryside Transition Zone)
    const transitionGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(45, 200),
      mats.transitionGrassMat
    );
    transitionGrass.rotation.x = -Math.PI / 2;
    transitionGrass.position.set(72, 0.08, 175);
    transitionGrass.receiveShadow = true;
    root.add(transitionGrass);

    // Transition Boundary Trees & Rustic Split-Rail Fencing
    const transitionFenceMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
    for (let fz = 60; fz < 250; fz += 20) {
      const fenceRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 18), transitionFenceMat);
      fenceRail.position.set(60, 0.45, fz + 9);
      root.add(fenceRail);

      const tTree = new THREE.Group();
      const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4.0, 6), mats.trunkMat);
      tTrunk.position.y = 2.0;
      tTrunk.castShadow = true;
      const tFoliage = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6.5, 6), mats.treeMat);
      tFoliage.position.y = 5.2;
      tFoliage.castShadow = true;
      tTree.position.set(75, 0, fz + (Math.random() - 0.5) * 8);
      tTree.add(tTrunk, tFoliage);
      root.add(tTree);
    }

    // 2. Gateway Tiled Plaza (Replicated from 'image copy.png': X = 95, Z = 95)
    const gatewayPlaza = new THREE.Group();
    gatewayPlaza.position.set(95, 0, 95);

    // Paved Stone Tile Ground Slab
    const plazaFloor = new THREE.Mesh(new THREE.BoxGeometry(50, 0.25, 50), mats.pavedTileMat);
    plazaFloor.position.y = 0.12;
    plazaFloor.receiveShadow = true;
    gatewayPlaza.add(plazaFloor);

    // Linear Raised Dark Planter Boxes with Dome Topiary Hedges
    const planterBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x22543d, roughness: 0.8 });

    // Planter Row 1 (North side of plaza)
    for (let px = -18; px <= 18; px += 7) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.8, 4.0), planterBoxMat);
      box.position.set(px, 0.4, -18);
      box.castShadow = true;

      const hedge = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), hedgeMat);
      hedge.scale.set(1.4, 1.0, 1.0);
      hedge.position.set(px, 1.4, -18);
      hedge.castShadow = true;

      gatewayPlaza.add(box, hedge);
    }

    // Planter Row 2 (West side of plaza)
    for (let pz = -12; pz <= 18; pz += 7) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 5.5), planterBoxMat);
      box.position.set(-18, 0.4, pz);
      box.castShadow = true;

      const hedge = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), hedgeMat);
      hedge.scale.set(1.0, 1.0, 1.4);
      hedge.position.set(-18, 1.4, pz);
      hedge.castShadow = true;

      gatewayPlaza.add(box, hedge);
    }

    // Low-poly Triangular Pine/Fir Trees on Dirt Mulch Islands
    const mulchMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    const mulchIsland = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 0.4, 8), mulchMat);
    mulchIsland.position.set(12, 0.2, -12);
    gatewayPlaza.add(mulchIsland);

    const firTree1 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 9, 5), mats.treeMat);
    firTree1.position.set(12, 4.7, -12);
    firTree1.castShadow = true;
    gatewayPlaza.add(firTree1);

    const firTree2 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 7, 5), mats.treeMat);
    firTree2.position.set(16, 3.7, -6);
    firTree2.castShadow = true;
    gatewayPlaza.add(firTree2);

    // Modern Angled Street Lamp Poles
    const angledLampMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const lampPositions = [[-16, -16], [16, -16], [-16, 16]];
    for (let [lx, lz] of lampPositions) {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 6, 0.25), angledLampMat);
      pole.position.set(lx, 3, lz);
      pole.castShadow = true;

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.4), angledLampMat);
      arm.position.set(lx + 0.8, 6, lz);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.4), mats.lampBulbMat);
      lampHead.position.set(lx + 1.4, 5.8, lz);

      gatewayPlaza.add(pole, arm, lampHead);
    }

    // Illuminated Store / Metro Sign Post with Orange [K] Logo
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6.5, 6), angledLampMat);
    signPole.position.set(16, 3.25, 14);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.4), new THREE.MeshBasicMaterial({ color: 0xe65100 }));
    signBoard.position.set(16, 5.5, 14);
    const logoK = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    logoK.position.set(16, 5.5, 14.22);
    gatewayPlaza.add(signPole, signBoard, logoK);

    root.add(gatewayPlaza);
  }
}

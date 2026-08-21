import * as THREE from 'three';
import { WorldMaterials } from './materials';

export interface HouseOptions {
  seed: number;
  width: number;
  depth: number;
  height: number;
  style: 'victorian_manor' | 'neoclassical_villa' | 'tudor_estate';
  baseColor: number;
  roofColor: number;
  trimColor: number;
}

export class ResidentialGenerator {
  /**
   * Generates procedurally crafted architectural residential houses
   * adopting the architectural principles of webgpu_generator_building.html:
   * - Stepped setbacks & multi-tier vertical hierarchy
   * - Rusticated stone plinth & quoins
   * - Chamfered corner buttresses & pilasters
   * - Horizontal cornice stringcourses & entablatures
   * - Grand column portico entrances & balustrades
   * - Cantilevered bay windows & oriel balconies
   * - Multi-gabled & mansard roofs with attic dormers & chimney flue pots
   */
  public static generateHouse(options: HouseOptions, mats: WorldMaterials): THREE.Group {
    const root = new THREE.Group();
    const { width, depth, height, style, baseColor, roofColor, trimColor } = options;

    const wallMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.65 });
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }); // Dark slate plinth
    const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.5 }); // Stone trim / cornices
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.45 });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.85,
      emissive: 0xffedd5,
      emissiveIntensity: 0.35
    });
    const woodMat = mats.woodPlankMat;

    const floorH = height / 2.2;
    const halfW = width / 2;
    const halfD = depth / 2;

    // =============================================================
    // 1. TIER 1: RUSTICATED STONE PLINTH BASE
    // =============================================================
    const plinthH = 0.8;
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.6, plinthH, depth + 0.6),
      plinthMat
    );
    plinth.position.y = plinthH / 2;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    root.add(plinth);

    // =============================================================
    // 2. TIER 2: GROUND FLOOR WITH ENTRANCE PORTICO & CORNICES
    // =============================================================
    const groundBody = new THREE.Mesh(
      new THREE.BoxGeometry(width, floorH, depth),
      wallMat
    );
    groundBody.position.y = plinthH + floorH / 2;
    groundBody.castShadow = true;
    groundBody.receiveShadow = true;
    root.add(groundBody);

    // Ground Floor Windows (Front & Sides)
    const winGeo = new THREE.BoxGeometry(1.8, 2.4, 0.25);
    const winFrameGeo = new THREE.BoxGeometry(2.1, 2.7, 0.2);

    for (let side of [-1, 1]) {
      // Front Windows
      const winFront = new THREE.Mesh(winGeo, windowMat);
      winFront.position.set(side * (halfW * 0.55), plinthH + floorH * 0.55, halfD + 0.1);
      const frameFront = new THREE.Mesh(winFrameGeo, trimMat);
      frameFront.position.set(side * (halfW * 0.55), plinthH + floorH * 0.55, halfD + 0.05);
      root.add(winFront, frameFront);
    }

    // Mid-Floor Decorative Cornice Stringcourse (Setback transition)
    const midCornice = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.8, 0.4, depth + 0.8),
      trimMat
    );
    midCornice.position.y = plinthH + floorH;
    midCornice.castShadow = true;
    root.add(midCornice);

    // =============================================================
    // 3. TIER 3: SECOND FLOOR WITH CORNER PILASTERS & BAY WINDOWS
    // =============================================================
    const upperW = width - 0.6;
    const upperD = depth - 0.6;
    const upperBody = new THREE.Mesh(
      new THREE.BoxGeometry(upperW, floorH, upperD),
      wallMat
    );
    upperBody.position.y = plinthH + floorH + floorH / 2;
    upperBody.castShadow = true;
    upperBody.receiveShadow = true;
    root.add(upperBody);

    // Chamfered 45° Corner Pilasters / Buttresses
    const pilasterGeo = new THREE.BoxGeometry(0.5, floorH, 0.5);
    for (let sx of [-1, 1]) {
      for (let sz of [-1, 1]) {
        const pilaster = new THREE.Mesh(pilasterGeo, trimMat);
        pilaster.position.set(sx * (upperW / 2 + 0.1), plinthH + floorH + floorH / 2, sz * (upperD / 2 + 0.1));
        pilaster.castShadow = true;
        root.add(pilaster);
      }
    }

    // Cantilevered Bay Window / Oriel Projection
    const bayW = 3.6;
    const bayH = 2.4;
    const bayD = 1.4;
    const bayBox = new THREE.Mesh(new THREE.BoxGeometry(bayW, bayH, bayD), wallMat);
    bayBox.position.set(0, plinthH + floorH + floorH * 0.5, halfD + bayD / 2 - 0.3);
    bayBox.castShadow = true;

    const bayWindow = new THREE.Mesh(new THREE.BoxGeometry(bayW * 0.8, bayH * 0.75, 0.2), windowMat);
    bayWindow.position.set(0, plinthH + floorH + floorH * 0.5, halfD + bayD - 0.2);

    const bayRoof = new THREE.Mesh(new THREE.ConeGeometry(bayW * 0.7, 1.2, 4), roofMat);
    bayRoof.rotation.y = Math.PI / 4;
    bayRoof.position.set(0, plinthH + floorH + floorH * 0.5 + bayH / 2 + 0.6, halfD + bayD / 2 - 0.3);

    root.add(bayBox, bayWindow, bayRoof);

    // Eaves Upper Cornice
    const upperCornice = new THREE.Mesh(
      new THREE.BoxGeometry(upperW + 1.2, 0.45, upperD + 1.2),
      trimMat
    );
    upperCornice.position.y = plinthH + floorH * 2;
    upperCornice.castShadow = true;
    root.add(upperCornice);

    // =============================================================
    // 4. GRAND COLUMN PORTICO ENTRANCE & STEPS
    // =============================================================
    const porticoGroup = new THREE.Group();
    const porticoW = 5.2;
    const porticoD = 3.2;
    const porticoH = plinthH + floorH * 0.85;

    // Stone Steps
    for (let st = 0; st < 3; st++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(porticoW + 0.6 - st * 0.4, 0.25, 0.6),
        trimMat
      );
      step.position.set(0, (st + 0.5) * 0.25, halfD + 0.3 + (3 - st) * 0.5);
      step.receiveShadow = true;
      porticoGroup.add(step);
    }

    // Classical Fluted Columns
    const colGeo = new THREE.CylinderGeometry(0.2, 0.24, porticoH - plinthH, 8);
    for (let cs of [-1, 1]) {
      const col = new THREE.Mesh(colGeo, trimMat);
      col.position.set(cs * (porticoW / 2 - 0.4), plinthH + (porticoH - plinthH) / 2, halfD + porticoD - 0.4);
      col.castShadow = true;
      porticoGroup.add(col);
    }

    // Portico Pediment & Roof Canopy
    const pediment = new THREE.Mesh(
      new THREE.ConeGeometry(porticoW * 0.65, 1.6, 4),
      roofMat
    );
    pediment.rotation.y = Math.PI / 4;
    pediment.position.set(0, porticoH + 0.8, halfD + porticoD / 2);
    pediment.castShadow = true;

    // Ornate Front Timber Door with Brass Knob
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 0.25), woodMat);
    door.position.set(0, plinthH + 1.7, halfD + 0.12);

    const brassKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    );
    brassKnob.position.set(0.7, plinthH + 1.7, halfD + 0.28);

    porticoGroup.add(pediment, door, brassKnob);
    root.add(porticoGroup);

    // =============================================================
    // 5. STYLE-SPECIFIC ROOFS, DORMERS & TURRETS
    // =============================================================
    const totalWallH = plinthH + floorH * 2;

    if (style === 'victorian_manor') {
      // High-Pitched Multi-Gabled Roof
      const roofH = 5.8;
      const mainRoof = new THREE.Mesh(
        new THREE.ConeGeometry(upperW * 0.76, roofH, 4),
        roofMat
      );
      mainRoof.rotation.y = Math.PI / 4;
      mainRoof.position.y = totalWallH + roofH / 2;
      mainRoof.castShadow = true;
      root.add(mainRoof);

      // Corner Octagonal Turret with Witch-Hat Spire
      const turretR = 2.4;
      const turretBody = new THREE.Mesh(
        new THREE.CylinderGeometry(turretR, turretR, totalWallH + 2.0, 8),
        wallMat
      );
      turretBody.position.set(-halfW + 0.5, (totalWallH + 2.0) / 2, halfD - 0.5);
      turretBody.castShadow = true;

      const turretSpire = new THREE.Mesh(
        new THREE.ConeGeometry(turretR * 1.15, 6.5, 8),
        roofMat
      );
      turretSpire.position.set(-halfW + 0.5, totalWallH + 2.0 + 3.25, halfD - 0.5);
      turretSpire.castShadow = true;

      const spireFinial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.2, 4),
        trimMat
      );
      spireFinial.position.set(-halfW + 0.5, totalWallH + 2.0 + 6.5 + 1.1, halfD - 0.5);

      root.add(turretBody, turretSpire, spireFinial);

    } else if (style === 'neoclassical_villa') {
      // Mansard Roof with Balustrade
      const mansardH = 4.5;
      const mansard = new THREE.Mesh(
        new THREE.CylinderGeometry(upperW * 0.55, upperW * 0.75, mansardH, 4),
        roofMat
      );
      mansard.rotation.y = Math.PI / 4;
      mansard.position.y = totalWallH + mansardH / 2;
      mansard.castShadow = true;
      root.add(mansard);

      // 2 Attic Gabled Dormer Windows
      for (let dx of [-2.8, 2.8]) {
        const dormer = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.8), wallMat);
        dormer.position.set(dx, totalWallH + 1.8, halfD - 0.5);
        const dormerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.2, 4), roofMat);
        dormerRoof.rotation.y = Math.PI / 4;
        dormerRoof.position.set(dx, totalWallH + 3.2, halfD - 0.5);
        root.add(dormer, dormerRoof);
      }

    } else {
      // Tudor Estate: Cross-Gabled Roof with Timber Framing
      const tudorRoofH = 5.2;
      const tRoof1 = new THREE.Mesh(new THREE.ConeGeometry(upperW * 0.75, tudorRoofH, 4), roofMat);
      tRoof1.rotation.y = Math.PI / 4;
      tRoof1.position.y = totalWallH + tudorRoofH / 2;
      tRoof1.castShadow = true;

      const crossGable = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4.0, 3.0), wallMat);
      crossGable.position.set(2.5, totalWallH + 1.8, halfD - 0.2);

      const crossRoof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 3.2, 4), roofMat);
      crossRoof.rotation.y = Math.PI / 4;
      crossRoof.position.set(2.5, totalWallH + 4.8, halfD - 0.2);

      root.add(tRoof1, crossGable, crossRoof);
    }

    // =============================================================
    // 6. STRATIFIED RED BRICK CHIMNEY WITH TERRACOTTA FLUE POTS
    // =============================================================
    const chimneyW = 1.6;
    const chimneyH = totalWallH + 6.5;
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 }); // Red brick

    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(chimneyW, chimneyH, chimneyW),
      chimneyMat
    );
    chimney.position.set(halfW - 1.2, chimneyH / 2, -halfD + 1.6);
    chimney.castShadow = true;

    // Stepped Brick Cap
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(chimneyW + 0.4, 0.4, chimneyW + 0.4),
      trimMat
    );
    cap.position.set(halfW - 1.2, chimneyH + 0.2, -halfD + 1.6);

    // 2 Terracotta Flue Pots
    const potMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7 });
    for (let p of [-0.35, 0.35]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.9, 8), potMat);
      pot.position.set(halfW - 1.2 + p, chimneyH + 0.85, -halfD + 1.6);
      root.add(pot);
    }

    root.add(chimney, cap);

    return root;
  }
}

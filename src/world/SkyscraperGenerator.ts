import * as THREE from 'three';
import { WorldMaterials } from './materials';

export interface SkyscraperConfig {
  seed: number;
  width: number;
  depth: number;
  totalHeight: number;
  style: 'gothic-terracotta' | 'art-deco' | 'modern-curtain' | 'cyber-megatower';
}

export class SkyscraperGenerator {
  public static createSkyscraper(config: SkyscraperConfig, mats: WorldMaterials): THREE.Group {
    const group = new THREE.Group();
    const { width, depth, totalHeight, style } = config;

    // Pick architectural materials based on style
    let masonryMat: THREE.MeshStandardMaterial;
    let accentMat: THREE.MeshStandardMaterial;
    let glassMat: THREE.MeshStandardMaterial;
    let trimMat: THREE.MeshStandardMaterial;
    let neonMat: THREE.MeshBasicMaterial;

    if (style === 'gothic-terracotta') {
      // Warm terracotta masonry & bronze details (like Woolworth / Fisher Building)
      masonryMat = new THREE.MeshStandardMaterial({
        color: 0xc47e5a, // Terracotta clay
        map: mats.windowTexture,
        roughness: 0.65,
        metalness: 0.15
      });
      accentMat = new THREE.MeshStandardMaterial({ color: 0xd99b79, roughness: 0.5, metalness: 0.2 });
      glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 });
      trimMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.4, metalness: 0.7 });
      neonMat = mats.neonGoldMat;
    } else if (style === 'art-deco') {
      // Limestone, dark iron & chrome (like Chrysler / Empire State Building)
      masonryMat = new THREE.MeshStandardMaterial({
        color: 0xd8d3c5, // Limestone
        map: mats.windowTexture,
        roughness: 0.55,
        metalness: 0.2
      });
      accentMat = new THREE.MeshStandardMaterial({ color: 0x2b303a, roughness: 0.3, metalness: 0.8 });
      glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
      trimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
      neonMat = mats.neonCyanMat;
    } else if (style === 'cyber-megatower') {
      // Obsidian granite, carbon composite & glowing neon edge trims
      masonryMat = new THREE.MeshStandardMaterial({
        color: 0x181e29,
        map: mats.windowTexture,
        roughness: 0.3,
        metalness: 0.7
      });
      accentMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 });
      glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.95 });
      trimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });
      neonMat = mats.neonPinkMat;
    } else {
      // Modernist glass curtain wall with white ceramic ribs
      masonryMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a5f,
        map: mats.windowTexture,
        roughness: 0.2,
        metalness: 0.75
      });
      accentMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.3 });
      glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });
      trimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.6 });
      neonMat = mats.neonCyanMat;
    }

    // ==================== 1. PODIUM / GRAND BASE TIER ====================
    const podiumHeight = Math.min(14, totalHeight * 0.14);
    const podiumGeo = new THREE.BoxGeometry(width, podiumHeight, depth);
    const podium = new THREE.Mesh(podiumGeo, accentMat);
    podium.position.y = podiumHeight / 2;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    // Grand Entrance Columns (Portico)
    const numCols = 6;
    for (let c = 0; c < numCols; c++) {
      const colX = -width / 2 + 3 + (c / (numCols - 1)) * (width - 6);
      const colMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, podiumHeight - 1, 8),
        trimMat
      );
      colMesh.position.set(colX, podiumHeight / 2, depth / 2 + 0.4);
      colMesh.castShadow = true;
      group.add(colMesh);
    }

    // Base Cornice Ledge
    const baseCornice = new THREE.Mesh(
      new THREE.BoxGeometry(width + 1.2, 0.9, depth + 1.2),
      trimMat
    );
    baseCornice.position.y = podiumHeight;
    baseCornice.castShadow = true;
    group.add(baseCornice);

    // ==================== 2. MULTI-TIER TOWER SHAFT (WITH STEPPED SETBACKS) ====================
    const numTiers = totalHeight > 80 ? 3 : 2;
    let currentY = podiumHeight;
    let currentW = width - 1.6;
    let currentD = depth - 1.6;
    const remainingHeight = totalHeight - podiumHeight - 16; // Leaves room for crown
    const tierHeight = remainingHeight / numTiers;

    for (let t = 0; t < numTiers; t++) {
      const tierH = tierHeight;

      // Main Tier Body with window facade
      const tierMesh = new THREE.Mesh(
        new THREE.BoxGeometry(currentW, tierH, currentD),
        masonryMat
      );
      tierMesh.position.y = currentY + tierH / 2;
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      group.add(tierMesh);

      // Chamfered 45° Corner Pilasters / Buttresses
      const cornerOffsets = [
        [-currentW / 2, -currentD / 2],
        [currentW / 2, -currentD / 2],
        [-currentW / 2, currentD / 2],
        [currentW / 2, currentD / 2]
      ];

      for (let [cx, cz] of cornerOffsets) {
        const cornerCol = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, tierH, 1.2),
          accentMat
        );
        cornerCol.position.set(cx, currentY + tierH / 2, cz);
        cornerCol.rotation.y = Math.PI / 4; // 45 degree chamfer
        cornerCol.castShadow = true;
        group.add(cornerCol);
      }

      // Vertical Fluted Architectural Pilasters
      const numPilasters = 4;
      for (let p = 1; p < numPilasters; p++) {
        const px = -currentW / 2 + (p / numPilasters) * currentW;
        const pilasterFront = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, tierH, 0.4),
          accentMat
        );
        pilasterFront.position.set(px, currentY + tierH / 2, currentD / 2 + 0.1);
        pilasterFront.castShadow = true;
        group.add(pilasterFront);

        const pilasterBack = pilasterFront.clone();
        pilasterBack.position.z = -currentD / 2 - 0.1;
        group.add(pilasterBack);
      }

      // Horizontal Architectural Belt Cornice at setback level
      currentY += tierH;
      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(currentW + 0.8, 0.75, currentD + 0.8),
        trimMat
      );
      cornice.position.y = currentY;
      cornice.castShadow = true;
      group.add(cornice);

      // Apply stepped setback for next higher tier
      currentW = Math.max(10, currentW - 3.2);
      currentD = Math.max(10, currentD - 3.2);
    }

    // ==================== 3. ART DECO / GOTHIC CROWN & SPIRE ====================
    const crownBaseH = 5;
    const crownMesh = new THREE.Mesh(
      new THREE.BoxGeometry(currentW, crownBaseH, currentD),
      accentMat
    );
    crownMesh.position.y = currentY + crownBaseH / 2;
    crownMesh.castShadow = true;
    group.add(crownMesh);
    currentY += crownBaseH;

    // Stepped Pyramid Roof / Octagonal Lantern
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(currentW * 0.28, currentW * 0.45, 6, 8),
      trimMat
    );
    lantern.position.y = currentY + 3;
    lantern.castShadow = true;
    group.add(lantern);

    // Glowing Architectural Neon Band at top
    const neonBand = new THREE.Mesh(
      new THREE.RingGeometry(currentW * 0.29, currentW * 0.35, 16),
      neonMat
    );
    neonBand.rotation.x = -Math.PI / 2;
    neonBand.position.y = currentY + 6.05;
    group.add(neonBand);

    // Sky Piercing Spire & Antenna Mast
    const spireH = Math.max(12, totalHeight * 0.16);
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, spireH, 8),
      trimMat
    );
    spire.position.y = currentY + 6 + spireH / 2;
    spire.castShadow = true;
    group.add(spire);

    // Beacon Antenna Mast on Spire Tip
    const antennaMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
    );
    antennaMast.position.y = currentY + 6 + spireH + 4;
    group.add(antennaMast);

    // Red Flashing Aircraft Warning Beacon Light
    const beaconLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff1122 })
    );
    beaconLight.position.y = currentY + 6 + spireH + 8;
    group.add(beaconLight);

    // 4 Corner Pinnacles / Gargoyle Spires
    const pinH = 3.5;
    const pinOffsets = [
      [-currentW / 2 + 0.5, -currentD / 2 + 0.5],
      [currentW / 2 - 0.5, -currentD / 2 + 0.5],
      [-currentW / 2 + 0.5, currentD / 2 - 0.5],
      [currentW / 2 - 0.5, currentD / 2 - 0.5]
    ];

    for (let [px, pz] of pinOffsets) {
      const pinnacle = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, pinH, 4),
        trimMat
      );
      pinnacle.position.set(px, currentY + pinH / 2, pz);
      pinnacle.castShadow = true;
      group.add(pinnacle);
    }

    return group;
  }
}

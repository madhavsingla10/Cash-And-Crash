import * as THREE from 'three';
import { WorldMaterials } from './materials';

export class FenceGenerator {
  /**
   * Generates Victorian & Neo-Gothic Wrought-Iron Estate Railings:
   * - Rusticated stone masonry piers with chamfered pyramid caps
   * - Top and bottom horizontal forged iron runner rails
   * - Vertical wrought iron pickets with pointed spearhead finials
   * - Polished brass or iron spearhead accents
   */
  public static buildWroughtIronFence(
    length: number,
    height: number = 1.4,
    pierSpacing: number = 6.0,
    mats?: WorldMaterials
  ): THREE.Group {
    const group = new THREE.Group();

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.85
    });

    const stonePierMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slate stone masonry
      roughness: 0.75
    });

    const pierCapMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Chiseled capstone
      roughness: 0.6
    });

    const spearTipMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Polished brass spearhead
      metalness: 0.9,
      roughness: 0.2
    });

    const numPiers = Math.max(2, Math.round(length / pierSpacing) + 1);
    const actualSpacing = length / (numPiers - 1);
    const halfLen = length / 2;

    const pierW = 0.55;
    const pierH = height + 0.3;

    // 1. Stone Masonry Boundary Piers with Chamfered Caps
    for (let p = 0; p < numPiers; p++) {
      const px = -halfLen + p * actualSpacing;
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(pierW, pierH, pierW),
        stonePierMat
      );
      pier.position.set(px, pierH / 2, 0);
      pier.castShadow = true;
      pier.receiveShadow = true;

      // Chamfered Pyramid Capstone
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(pierW * 0.8, 0.35, 4),
        pierCapMat
      );
      cap.rotation.y = Math.PI / 4;
      cap.position.set(px, pierH + 0.175, 0);
      cap.castShadow = true;

      // Small Stone Ball Lantern or Finial
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        pierCapMat
      );
      ball.position.set(px, pierH + 0.35 + 0.12, 0);

      group.add(pier, cap, ball);
    }

    // 2. Horizontal Forged Steel Runner Rails
    const railThick = 0.08;
    const railW = length - pierW * 0.5;

    // Bottom Rail
    const railBottom = new THREE.Mesh(
      new THREE.BoxGeometry(railW, railThick, railThick),
      ironMat
    );
    railBottom.position.set(0, 0.25, 0);
    railBottom.castShadow = true;

    // Top Rail
    const railTop = new THREE.Mesh(
      new THREE.BoxGeometry(railW, railThick, railThick),
      ironMat
    );
    railTop.position.set(0, height - 0.15, 0);
    railTop.castShadow = true;

    // Middle Runner Rail
    const railMid = new THREE.Mesh(
      new THREE.BoxGeometry(railW, railThick * 0.8, railThick * 0.8),
      ironMat
    );
    railMid.position.set(0, height - 0.45, 0);

    group.add(railBottom, railTop, railMid);

    // 3. Vertical Wrought Iron Pickets with Spearhead Finials
    const picketSpacing = 0.35;
    const numPickets = Math.floor(length / picketSpacing);
    const picketGeo = new THREE.BoxGeometry(0.045, height, 0.045);
    const spearGeo = new THREE.ConeGeometry(0.06, 0.22, 4);

    for (let i = 0; i <= numPickets; i++) {
      const ix = -halfLen + i * picketSpacing;

      // Skip pickets that intersect stone piers
      let nearPier = false;
      for (let p = 0; p < numPiers; p++) {
        const px = -halfLen + p * actualSpacing;
        if (Math.abs(ix - px) < pierW * 0.6) {
          nearPier = true;
          break;
        }
      }
      if (nearPier) continue;

      const picket = new THREE.Mesh(picketGeo, ironMat);
      picket.position.set(ix, height / 2, 0);
      picket.castShadow = true;

      // Pointed Spearhead Finial Top
      const spear = new THREE.Mesh(spearGeo, (i % 2 === 0) ? spearTipMat : ironMat);
      spear.rotation.y = Math.PI / 4;
      spear.position.set(ix, height + 0.11, 0);
      spear.castShadow = true;

      group.add(picket, spear);
    }

    return group;
  }

  /**
   * Generates Classical Moulded Stone Balustrade:
   * - Solid stone base plinth
   * - Classical rounded urn baluster spindles
   * - Moulded top coping handrail
   */
  public static buildClassicalBalustrade(
    length: number,
    height: number = 1.1
  ): THREE.Group {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Light marble stone
      roughness: 0.55
    });

    const plinthH = 0.2;
    const handrailH = 0.18;
    const balusterH = height - plinthH - handrailH;

    // Plinth Base
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(length, plinthH, 0.32),
      stoneMat
    );
    plinth.position.y = plinthH / 2;
    plinth.receiveShadow = true;

    // Handrail Coping
    const handrail = new THREE.Mesh(
      new THREE.BoxGeometry(length, handrailH, 0.35),
      stoneMat
    );
    handrail.position.y = height - handrailH / 2;
    handrail.castShadow = true;

    group.add(plinth, handrail);

    // Balusters
    const balusterSpacing = 0.45;
    const numBalusters = Math.floor(length / balusterSpacing);
    const balusterGeo = new THREE.CylinderGeometry(0.08, 0.1, balusterH, 8);

    for (let b = 0; b <= numBalusters; b++) {
      const bx = -length / 2 + b * balusterSpacing;
      const baluster = new THREE.Mesh(balusterGeo, stoneMat);
      baluster.position.set(bx, plinthH + balusterH / 2, 0);
      baluster.castShadow = true;
      group.add(baluster);
    }

    return group;
  }

  /**
   * Generates Rustic Beveled Post-and-Rail Fence for Transitions & Farmland
   */
  public static buildRusticPostAndRailFence(
    length: number,
    height: number = 1.1,
    postSpacing: number = 4.0
  ): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033, // Weathered cedar timber
      roughness: 0.85
    });

    const numPosts = Math.max(2, Math.round(length / postSpacing) + 1);
    const actualSpacing = length / (numPosts - 1);
    const halfLen = length / 2;

    const postGeo = new THREE.BoxGeometry(0.2, height, 0.2);

    for (let p = 0; p < numPosts; p++) {
      const px = -halfLen + p * actualSpacing;
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, height / 2, 0);
      post.castShadow = true;

      // Beveled Timber Cap
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.15, 4), woodMat);
      cap.rotation.y = Math.PI / 4;
      cap.position.set(px, height + 0.075, 0);

      group.add(post, cap);
    }

    // 3 Horizontal Split Timber Rails
    const railLength = length;
    for (let r of [0.35, 0.65, 0.95]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(railLength, 0.1, 0.08),
        woodMat
      );
      rail.position.set(0, r * height, 0);
      rail.castShadow = true;
      group.add(rail);
    }

    return group;
  }
}

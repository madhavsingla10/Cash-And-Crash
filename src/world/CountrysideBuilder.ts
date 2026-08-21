import * as THREE from 'three';
import { BuildingCollider } from './types';
import { WorldMaterials } from './materials';
import { ResidentialGenerator, HouseOptions } from './ResidentialGenerator';
import { FenceGenerator } from './FenceGenerator';

export class CountrysideBuilder {
  public static buildCountryside(root: THREE.Group, colliders: BuildingCollider[], mats: WorldMaterials) {
    // 1. Paved stone tile village floor overlay across entire residential village
    const villageFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      mats.pavedTileMat
    );
    villageFloor.rotation.x = -Math.PI / 2;
    villageFloor.position.set(175, 0.08, 175);
    villageFloor.receiveShadow = true;
    root.add(villageFloor);

    // Architectural Palette inspired by webgpu_generator_building.html
    const masonryColors = [
      0xf1ede4, // Cream French Limestone Stucco
      0xe2d9cc, // Pale Roman Travertine
      0xd8a47f, // Warm Sandstone
      0xb85d3b, // Terracotta Brick
      0x475569, // Slate Manor Grey
      0x334155  // Deep Charcoal Siding
    ];

    const roofPalettes = [
      0x1e293b, // Charcoal Slate
      0x881337, // Burgundy Glazed Tile
      0x164e63, // Deep Teal Copper Oxide
      0x78350f, // Terracotta Clay Tile
      0x3f3f46  // Weathered Zinc
    ];

    const trimColors = [
      0xffffff, // Crisp White Trim
      0xf8fafc, // Pearl White
      0xe2e8f0, // Soft Marble Trim
      0xd1d5db  // Light Limestone
    ];

    const styles: Array<'victorian_manor' | 'neoclassical_villa' | 'tudor_estate'> = [
      'victorian_manor',
      'neoclassical_villa',
      'tudor_estate'
    ];

    // 2. Procedural Residential Estates with Gardens & Courtyards
    let houseIndex = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const hx = 115 + col * 24;
        const hz = 115 + row * 34;

        // Skip Gateway Plaza and road corridors
        if (Math.abs(hx - 95) < 20 && Math.abs(hz - 95) < 20) continue;
        if (Math.abs(hx - 150) < 10 || Math.abs(hx - 200) < 10) continue;
        if (Math.abs(hz - 150) < 10 || Math.abs(hz - 200) < 10) continue;

        const style = styles[(row + col) % styles.length];
        const baseColor = masonryColors[houseIndex % masonryColors.length];
        const roofColor = roofPalettes[houseIndex % roofPalettes.length];
        const trimColor = trimColors[houseIndex % trimColors.length];

        const houseW = 14 + (houseIndex % 3) * 1.5;
        const houseD = 12 + ((houseIndex + 1) % 2) * 2;
        const houseH = 8.5 + (houseIndex % 2) * 1.2;

        const options: HouseOptions = {
          seed: houseIndex + 10,
          width: houseW,
          depth: houseD,
          height: houseH,
          style,
          baseColor,
          roofColor,
          trimColor
        };

        const estate = new THREE.Group();
        estate.position.set(hx, 0, hz);

        // Generate procedural architectural villa
        const houseMesh = ResidentialGenerator.generateHouse(options, mats);
        estate.add(houseMesh);

        // Private Garden with Stone Planter Border
        const gardenW = 8;
        const gardenD = 4;
        const gardenBorder = new THREE.Mesh(
          new THREE.BoxGeometry(gardenW + 0.6, 0.4, gardenD + 0.6),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
        );
        gardenBorder.position.set(-houseW / 2 + gardenW / 2 + 1, 0.2, houseD / 2 + gardenD / 2 + 1.2);
        estate.add(gardenBorder);

        const flowerMat = new THREE.MeshStandardMaterial({
          color: mats.flowerbedColors[houseIndex % mats.flowerbedColors.length],
          roughness: 0.6
        });
        const flowerBed = new THREE.Mesh(new THREE.BoxGeometry(gardenW, 0.35, gardenD), flowerMat);
        flowerBed.position.set(-houseW / 2 + gardenW / 2 + 1, 0.25, houseD / 2 + gardenD / 2 + 1.2);
        estate.add(flowerBed);

        // Flowering Ornamental Garden Tree
        const tree = new THREE.Group();
        const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 3.8, 6), mats.trunkMat);
        tTrunk.position.y = 1.9;
        const leavesColor = (houseIndex % 2 === 0) ? 0xf472b6 : 0x22c55e; // Cherry blossom pink or rich green
        const tLeaves = new THREE.Mesh(
          new THREE.DodecahedronGeometry(2.4),
          new THREE.MeshStandardMaterial({ color: leavesColor, roughness: 0.65 })
        );
        tLeaves.position.y = 4.4;
        tree.position.set(houseW / 2 - 1.5, 0, houseD / 2 + 3.2);
        tree.add(tTrunk, tLeaves);
        estate.add(tree);

        // Vintage Cast-Iron Street Lamp at property entrance
        const lampGroup = new THREE.Group();
        lampGroup.position.set(-houseW / 2 - 1.2, 0, houseD / 2 + 4.5);
        const lampPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 })
        );
        lampPole.position.y = 2.1;
        const lantern = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.8, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.6 })
        );
        lantern.position.y = 4.2;
        lampGroup.add(lampPole, lantern);
        estate.add(lampGroup);

        // Victorian Wrought Iron Estate Railing with Stone Piers & Brass Spearheads
        const fenceLength = houseW + 5;
        const fenceFront = FenceGenerator.buildWroughtIronFence(fenceLength, 1.3, 5.0, mats);
        fenceFront.position.set(0, 0, houseD / 2 + 5.8);
        estate.add(fenceFront);

        root.add(estate);

        // Register 3D physical collider
        const totalHeight = houseH + 7.5;
        colliders.push({
          box: new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(hx, totalHeight / 2, hz),
            new THREE.Vector3(houseW + 3, totalHeight, houseD + 3)
          ),
          type: 'building',
          height: totalHeight
        });

        houseIndex++;
      }
    }
  }
}

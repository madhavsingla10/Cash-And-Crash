import * as THREE from 'three';
import { BuildingCollider, StuntRamp, CityData } from './types';
import { createWorldMaterials } from './materials';
import { RoadNetworkBuilder } from './RoadNetworkBuilder';
import { DowntownBuilder } from './DowntownBuilder';
import { CentralParkBuilder } from './CentralParkBuilder';
import { FarmlandBuilder } from './FarmlandBuilder';
import { TransitionPlazaBuilder } from './TransitionPlazaBuilder';
import { CountrysideBuilder } from './CountrysideBuilder';
import { SeaportBuilder } from './SeaportBuilder';

export * from './types';
export * from './materials';

export class CityBuilder {
  public static buildCity(scene: THREE.Scene): CityData {
    const root = new THREE.Group();
    const colliders: BuildingCollider[] = [];
    const ramps: StuntRamp[] = [];
    const spawnPoints: THREE.Vector3[] = [];
    const moneyLocations: THREE.Vector3[] = [];

    const mapSize = 660; // 660x660m dense metropolis world
    const halfMap = mapSize / 2;
    const waterLevel = -2.5;

    // 1. Shared World Materials & Procedural Textures
    const mats = createWorldMaterials();

    // 2. Ocean Water Plane
    const oceanGeo = new THREE.PlaneGeometry(2200, 2200, 32, 32);
    const ocean = new THREE.Mesh(oceanGeo, mats.waterMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = waterLevel;
    root.add(ocean);

    // 3. Island Ground Slab with Cliff Edges
    const islandGeo = new THREE.BoxGeometry(mapSize, 6, mapSize);
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.9 });
    const islandMesh = new THREE.Mesh(islandGeo, cliffMat);
    islandMesh.position.set(0, -3, 0);
    islandMesh.receiveShadow = true;
    root.add(islandMesh);

    // 4. Build Road Network & Avenues (11x11 Grid & Highway Exit Tile Transitions)
    RoadNetworkBuilder.buildRoads(root, mapSize, mats);

    // 5. Build Grand Central Park (84x84m open drift lawn, fountain, jumps, perimeter trees)
    CentralParkBuilder.buildCentralPark(root, colliders, ramps, mats);

    // 6. Build Dense Downtown Skyscraper District (80+ Towers & Commercial Blocks)
    DowntownBuilder.buildDowntown(root, colliders, mats);

    // 7. Build Vast Farmland Sector (Wheat fields, barns, silos, windmills, sand dunes)
    FarmlandBuilder.buildFarmland(root, colliders, ramps, mats);

    // 8. Build Greenery Transition Belt & Gateway Tiled Plaza (Per 'image copy.png')
    TransitionPlazaBuilder.buildTransitionPlaza(root, mats);

    // 9. Build Countryside Residential Village (Tiled streets, 2-story cottages with flower gardens)
    CountrysideBuilder.buildCountryside(root, colliders, mats);

    // 10. Build Seaport Harbor (Deep water cargo ships, 40+ climbable container stacks, rooftop bridges)
    SeaportBuilder.buildSeaport(root, colliders, ramps, mats, waterLevel);

    // 11. Strictly Road-Aligned Money Bag Loot Locations & Rooftop Stages (27 Locations)
    const streetMoney = [
      // Central Roads around Central Park
      new THREE.Vector3(50, 0.8, -50),
      new THREE.Vector3(-50, 0.8, 50),
      new THREE.Vector3(50, 0.8, 50),
      new THREE.Vector3(-50, 0.8, -50),
      new THREE.Vector3(0, 0.8, -50),
      new THREE.Vector3(0, 0.8, 50),
      new THREE.Vector3(50, 0.8, 0),
      new THREE.Vector3(-50, 0.8, 0),
      // Dense Downtown Streets
      new THREE.Vector3(-100, 0.8, -50),
      new THREE.Vector3(-100, 0.8, 50),
      new THREE.Vector3(-150, 0.8, -50),
      new THREE.Vector3(-150, 0.8, -100),
      new THREE.Vector3(-150, 0.8, -150),
      new THREE.Vector3(-200, 0.8, -50),
      new THREE.Vector3(-200, 0.8, -150),
      new THREE.Vector3(-250, 0.8, 0),
      new THREE.Vector3(0, 0.8, -150),
      new THREE.Vector3(0, 0.8, -250),
      new THREE.Vector3(-100, 0.8, -200),
      // Farmland & Windmills Sector
      new THREE.Vector3(150, 0.8, -100),
      new THREE.Vector3(150, 0.8, -200),
      new THREE.Vector3(200, 0.8, -150),
      // Crowded Countryside Suburbs Sector
      new THREE.Vector3(150, 0.8, 100),
      new THREE.Vector3(150, 0.8, 200),
      new THREE.Vector3(200, 0.8, 150),
      // Seaport Harbor Container Aisle & Ship Pier Loot!
      new THREE.Vector3(-154, 0.8, 167),
      new THREE.Vector3(-190, 0.8, 175),
      new THREE.Vector3(-304, 0.8, 180) // On Ocean Boardwalk Pier to Cargo Ship
    ];
    moneyLocations.push(...streetMoney);

    // 12. Police Patrol Spawn Points
    spawnPoints.push(
      new THREE.Vector3(-250, 0.5, -250),
      new THREE.Vector3(250, 0.5, -250),
      new THREE.Vector3(-250, 0.5, 250),
      new THREE.Vector3(250, 0.5, 250),
      new THREE.Vector3(0, 0.5, -250),
      new THREE.Vector3(0, 0.5, 250)
    );

    // 13. Extraction Helipad at Grand North Boulevard Plaza (X = 0, Z = -240)
    const extractionPoint = new THREE.Vector3(0, 0.1, -240);
    const helipadMat = new THREE.MeshBasicMaterial({ color: 0x00ffee, transparent: true, opacity: 0.85 });
    const helipad = new THREE.Mesh(new THREE.RingGeometry(8, 10, 32), helipadMat);
    helipad.rotation.x = -Math.PI / 2;
    helipad.position.copy(extractionPoint);
    root.add(helipad);

    const hMat = new THREE.MeshBasicMaterial({ color: 0x00ffee });
    const h1 = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 8), hMat);
    h1.rotation.x = -Math.PI / 2;
    h1.position.set(extractionPoint.x - 2.4, 0.14, extractionPoint.z);
    const h2 = h1.clone();
    h2.position.x = extractionPoint.x + 2.4;
    const h3 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.3), hMat);
    h3.rotation.x = -Math.PI / 2;
    h3.position.set(extractionPoint.x, 0.14, extractionPoint.z);
    root.add(h1, h2, h3);

    scene.add(root);

    return {
      root,
      colliders,
      ramps,
      spawnPoints,
      moneyLocations,
      cityBounds: {
        minX: -halfMap,
        maxX: halfMap,
        minZ: -halfMap,
        maxZ: halfMap
      },
      waterLevel,
      extractionPoint
    };
  }
}

import * as THREE from 'three';
import { BuildingCollider, StuntRamp, CityData } from '../CityBuilder';
import { LondonBridgeBuilder } from './LondonBridgeBuilder';
import { DowntownCityBuilder } from './DowntownCityBuilder';
import { SuburbsBuilder } from './SuburbsBuilder';
import { FarmlandBuilder } from './FarmlandBuilder';
import { GardensParkBuilder } from './GardensParkBuilder';
import { BattleArenaBuilder } from './BattleArenaBuilder';
import { ShowdownPlazaBuilder } from './ShowdownPlazaBuilder';

export class MegaMapBuilder {
  public static buildMegaWorld(scene: THREE.Scene): CityData {
    const root = new THREE.Group();
    const colliders: BuildingCollider[] = [];
    const ramps: StuntRamp[] = [];
    const spawnPoints: THREE.Vector3[] = [];
    const moneyLocations: THREE.Vector3[] = [];

    const mapSize = 760; // Massive 760x760m World
    const halfMap = mapSize / 2;
    const waterLevel = -2.5;

    // 1. Endless Ocean Plane
    const oceanGeo = new THREE.PlaneGeometry(2400, 2400, 32, 32);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x006699,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = waterLevel;
    root.add(ocean);

    // 2. North & South Island Landmass Slabs (Divided by Central River)
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x222933, roughness: 0.9 });
    const islandH = 6;
    const riverGap = 65; // Central river width

    // North Island (Downtown, Suburbs, Gardens)
    const northIslandGeo = new THREE.BoxGeometry(mapSize, islandH, halfMap - riverGap / 2);
    const northIsland = new THREE.Mesh(northIslandGeo, islandMat);
    northIsland.position.set(0, -islandH / 2, -(halfMap + riverGap / 2) / 2);
    northIsland.receiveShadow = true;
    root.add(northIsland);

    // South Island (Farmland, Battle Arena, Showdown Plaza)
    const southIslandGeo = new THREE.BoxGeometry(mapSize, islandH, halfMap - riverGap / 2);
    const southIsland = new THREE.Mesh(southIslandGeo, islandMat);
    southIsland.position.set(0, -islandH / 2, (halfMap + riverGap / 2) / 2);
    southIsland.receiveShadow = true;
    root.add(southIsland);

    // 3. Asphalt Highway Network connecting ALL Biomes
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.9 });
    const roadMarkMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // Main Central Spine Highway (N-S crossing London Bridge)
    const mainSpine = new THREE.Mesh(new THREE.PlaneGeometry(22, mapSize), asphaltMat);
    mainSpine.rotation.x = -Math.PI / 2;
    mainSpine.position.set(0, 0.04, 0);
    mainSpine.receiveShadow = true;
    root.add(mainSpine);

    // North Cross Avenue (E-W)
    const northAvenue = new THREE.Mesh(new THREE.PlaneGeometry(mapSize, 20), asphaltMat);
    northAvenue.rotation.x = -Math.PI / 2;
    northAvenue.position.set(0, 0.04, -180);
    northAvenue.receiveShadow = true;
    root.add(northAvenue);

    // South Cross Avenue (E-W)
    const southAvenue = new THREE.Mesh(new THREE.PlaneGeometry(mapSize, 20), asphaltMat);
    southAvenue.rotation.x = -Math.PI / 2;
    southAvenue.position.set(0, 0.04, 180);
    southAvenue.receiveShadow = true;
    root.add(southAvenue);

    // West Causeway Bridge connecting Downtown & Battle Arena
    const westBridge = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, riverGap + 20), asphaltMat);
    westBridge.position.set(-220, 0.9, 0);
    root.add(westBridge);

    // East Causeway Bridge connecting Suburbs & Farmland
    const eastBridge = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, riverGap + 20), asphaltMat);
    eastBridge.position.set(220, 0.9, 0);
    root.add(eastBridge);

    // Continuous Road Center Markings
    const markGeo = new THREE.PlaneGeometry(1.2, 5.5);
    for (let z = -halfMap + 20; z < halfMap - 20; z += 12) {
      if (Math.abs(z) < 65) continue; // London bridge has own markings
      const mark = new THREE.Mesh(markGeo, roadMarkMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.06, z);
      root.add(mark);
    }

    // 4. Build Iconic LONDON TOWER BRIDGE (Center at X=0, Z=0)
    LondonBridgeBuilder.buildBridge(root, colliders, ramps, 0, 0, 130, 22);

    // 5. Build DOWNTOWN METROPOLIS (North-West: X = -280 to -70, Z = -340 to -110)
    DowntownCityBuilder.buildDowntown(root, colliders, -300, -320, 3, 3, 58, 22);

    // 6. Build SUBURBS NEIGHBORHOOD (North-East: X = 80 to 320, Z = -320 to -120)
    SuburbsBuilder.buildSuburbs(root, colliders, 80, -320, 4, 3, 40, 18);

    // 7. Build BOTANICAL GARDENS PARK (Center-North: X = 0, Z = -220)
    GardensParkBuilder.buildGardens(root, colliders, 0, -220, 75);

    // 8. Build BATTLE / DEMOLITION ARENA (South-West: X = -200, Z = 220)
    BattleArenaBuilder.buildBattleArena(root, colliders, ramps, -200, 220, 170);

    // 9. Build GOLDEN FARMLAND & WINDMILLS (South-East: X = 200, Z = 220)
    FarmlandBuilder.buildFarmland(root, colliders, ramps, 200, 220, 200, 200);

    // 10. Build GRAND SHOWDOWN PLAZA & DRAG STRIP (South-Center: X = 0, Z = 220)
    ShowdownPlazaBuilder.buildShowdownPlaza(root, colliders, ramps, 0, 220, 200, 36);

    // 11. Stunt Jumps along the Mega Highways
    ramps.push(
      { position: new THREE.Vector3(-110, 0, -180), rotationY: Math.PI / 2, width: 10, length: 14, height: 4.2 },
      { position: new THREE.Vector3(110, 0, -180), rotationY: -Math.PI / 2, width: 10, length: 14, height: 4.2 },
      { position: new THREE.Vector3(-110, 0, 180), rotationY: Math.PI / 2, width: 10, length: 14, height: 4.2 },
      { position: new THREE.Vector3(110, 0, 180), rotationY: -Math.PI / 2, width: 10, length: 14, height: 4.2 }
    );

    // 12. Diverse Money Bag Coordinates across ALL BIOMES
    const allMoneyRoads = [
      // London Bridge Area
      new THREE.Vector3(0, 1.9, 0),
      new THREE.Vector3(0, 0.8, -55),
      new THREE.Vector3(0, 0.8, 55),
      // Downtown Metropolis
      new THREE.Vector3(-220, 0.8, -180),
      new THREE.Vector3(-140, 0.8, -240),
      new THREE.Vector3(-300, 0.8, -240),
      new THREE.Vector3(-220, 0.8, -320),
      // Gardens Park
      new THREE.Vector3(0, 0.8, -180),
      new THREE.Vector3(0, 0.8, -260),
      new THREE.Vector3(-45, 0.8, -220),
      new THREE.Vector3(45, 0.8, -220),
      // Suburbs Neighborhood
      new THREE.Vector3(160, 0.8, -180),
      new THREE.Vector3(220, 0.8, -240),
      new THREE.Vector3(140, 0.8, -300),
      new THREE.Vector3(280, 0.8, -200),
      // Battle Demolition Arena
      new THREE.Vector3(-200, 0.8, 180),
      new THREE.Vector3(-200, 0.8, 260),
      new THREE.Vector3(-150, 0.8, 220),
      new THREE.Vector3(-250, 0.8, 220),
      // Farmland & Windmills
      new THREE.Vector3(200, 0.8, 180),
      new THREE.Vector3(200, 0.8, 260),
      new THREE.Vector3(150, 0.8, 220),
      new THREE.Vector3(260, 0.8, 220),
      // Showdown Plaza & Runway
      new THREE.Vector3(0, 0.8, 140),
      new THREE.Vector3(0, 0.8, 220),
      new THREE.Vector3(0, 0.8, 280)
    ];
    moneyLocations.push(...allMoneyRoads);

    // 13. Police Spawn Points distributed across regions
    spawnPoints.push(
      new THREE.Vector3(-220, 0.5, -180),
      new THREE.Vector3(220, 0.5, -180),
      new THREE.Vector3(-200, 0.5, 180),
      new THREE.Vector3(200, 0.5, 180),
      new THREE.Vector3(0, 0.5, -340),
      new THREE.Vector3(0, 0.5, 340),
      new THREE.Vector3(-340, 0.5, 0),
      new THREE.Vector3(340, 0.5, 0)
    );

    // 14. Ultimate Extraction Helipad at Grand Showdown Plaza
    const extractionPoint = new THREE.Vector3(0, 0.1, 310);
    const helipadMat = new THREE.MeshBasicMaterial({ color: 0x00ffee, transparent: true, opacity: 0.85 });
    const helipad = new THREE.Mesh(new THREE.RingGeometry(8, 10, 32), helipadMat);
    helipad.rotation.x = -Math.PI / 2;
    helipad.position.copy(extractionPoint);
    root.add(helipad);

    const hMat = new THREE.MeshBasicMaterial({ color: 0x00ffee });
    const h1 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 9), hMat);
    h1.rotation.x = -Math.PI / 2;
    h1.position.set(extractionPoint.x - 2.5, 0.14, extractionPoint.z);
    const h2 = h1.clone();
    h2.position.x = extractionPoint.x + 2.5;
    const h3 = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.4), hMat);
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

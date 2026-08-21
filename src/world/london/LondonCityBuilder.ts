import * as THREE from 'three';
import { BuildingCollider, StuntRamp, CityData } from '../CityBuilder';
import { LandmarksBuilder } from './LandmarksBuilder';
import { LondonPropsBuilder } from './LondonPropsBuilder';
import { LondonBridgeBuilder } from '../megamap/LondonBridgeBuilder';

export class LondonCityBuilder {
  public static buildLondonCity(scene: THREE.Scene): CityData {
    const root = new THREE.Group();
    const colliders: BuildingCollider[] = [];
    const ramps: StuntRamp[] = [];
    const spawnPoints: THREE.Vector3[] = [];
    const moneyLocations: THREE.Vector3[] = [];

    const citySize = 750;
    const halfCity = citySize / 2;
    const waterLevel = -2.5;

    // 1. Endless River Thames & Water Plane
    const thamesGeo = new THREE.PlaneGeometry(2400, 2400, 32, 32);
    const thamesMat = new THREE.MeshStandardMaterial({
      color: 0x1d3557, // Deep Thames navy blue
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.92
    });
    const thames = new THREE.Mesh(thamesGeo, thamesMat);
    thames.rotation.x = -Math.PI / 2;
    thames.position.y = waterLevel;
    root.add(thames);

    // 2. North & South Riverbank Landmasses (Divided by River Thames)
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x24242e, roughness: 0.9 });
    const bankH = 6;
    const riverWidth = 70;

    // North Bank (Westminster, Buckingham, Piccadilly, City of London)
    const northBankGeo = new THREE.BoxGeometry(citySize, bankH, halfCity - riverWidth / 2);
    const northBank = new THREE.Mesh(northBankGeo, bankMat);
    northBank.position.set(0, -bankH / 2, -(halfCity + riverWidth / 2) / 2);
    northBank.receiveShadow = true;
    root.add(northBank);

    // South Bank (London Eye, Southwark, The Shard Quarter)
    const southBankGeo = new THREE.BoxGeometry(citySize, bankH, halfCity - riverWidth / 2);
    const southBank = new THREE.Mesh(southBankGeo, bankMat);
    southBank.position.set(0, -bankH / 2, (halfCity + riverWidth / 2) / 2);
    southBank.receiveShadow = true;
    root.add(southBank);

    // 3. Central London Road Network (Thames Embankment, Westminster Bridge, Tower Bridge Avenues)
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.9 });
    const roadMarkMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // Tower Bridge Approach Highway (N-S crossing Tower Bridge)
    const towerBridgeRoad = new THREE.Mesh(new THREE.PlaneGeometry(22, citySize), asphaltMat);
    towerBridgeRoad.rotation.x = -Math.PI / 2;
    towerBridgeRoad.position.set(0, 0.04, 0);
    towerBridgeRoad.receiveShadow = true;
    root.add(towerBridgeRoad);

    // Westminster Bridge Crossing (X = -220)
    const westminsterBridge = new THREE.Mesh(new THREE.BoxGeometry(20, 1.8, riverWidth + 24), asphaltMat);
    westminsterBridge.position.set(-220, 0.9, 0);
    westminsterBridge.receiveShadow = true;
    root.add(westminsterBridge);

    // Victoria Embankment (North Riverside Boulevard, Z = -50)
    const northEmbankment = new THREE.Mesh(new THREE.PlaneGeometry(citySize, 22), asphaltMat);
    northEmbankment.rotation.x = -Math.PI / 2;
    northEmbankment.position.set(0, 0.04, -50);
    northEmbankment.receiveShadow = true;
    root.add(northEmbankment);

    // South Bank Embankment (South Riverside Boulevard, Z = 50)
    const southEmbankment = new THREE.Mesh(new THREE.PlaneGeometry(citySize, 22), asphaltMat);
    southEmbankment.rotation.x = -Math.PI / 2;
    southEmbankment.position.set(0, 0.04, 50);
    southEmbankment.receiveShadow = true;
    root.add(southEmbankment);

    // Piccadilly & Mall Grand Avenues (Z = -200, Z = 200)
    const northAvenue = new THREE.Mesh(new THREE.PlaneGeometry(citySize, 20), asphaltMat);
    northAvenue.rotation.x = -Math.PI / 2;
    northAvenue.position.set(0, 0.04, -200);
    northAvenue.receiveShadow = true;
    root.add(northAvenue);

    const southAvenue = new THREE.Mesh(new THREE.PlaneGeometry(citySize, 20), asphaltMat);
    southAvenue.rotation.x = -Math.PI / 2;
    southAvenue.position.set(0, 0.04, 200);
    southAvenue.receiveShadow = true;
    root.add(southAvenue);

    // Connectors
    const westConnector = new THREE.Mesh(new THREE.PlaneGeometry(20, citySize), asphaltMat);
    westConnector.rotation.x = -Math.PI / 2;
    westConnector.position.set(-220, 0.04, 0);
    root.add(westConnector);

    const eastConnector = new THREE.Mesh(new THREE.PlaneGeometry(20, citySize), asphaltMat);
    eastConnector.rotation.x = -Math.PI / 2;
    eastConnector.position.set(220, 0.04, 0);
    root.add(eastConnector);

    // 4. BUILD ICONIC LONDON LANDMARKS
    // A. Tower Bridge spanning River Thames at X=0, Z=0
    LondonBridgeBuilder.buildBridge(root, colliders, ramps, 0, 0, 130, 22);

    // B. Big Ben & Houses of Parliament at Westminster (X = -220, Z = -95)
    LandmarksBuilder.buildBigBen(root, colliders, -220, -95);

    // C. The London Eye on the South Bank (X = -170, Z = 75)
    LandmarksBuilder.buildLondonEye(root, colliders, -170, 75);

    // D. The Shard at London Bridge Quarter (X = 95, Z = 110)
    LandmarksBuilder.buildTheShard(root, colliders, 95, 110);

    // E. The Gherkin in the City Financial District (X = 140, Z = -120)
    LandmarksBuilder.buildTheGherkin(root, colliders, 140, -120);

    // F. Buckingham Palace & Royal Courtyard (X = -200, Z = -270)
    LandmarksBuilder.buildBuckinghamPalace(root, colliders, -200, -270);

    // G. Piccadilly Circus (X = -70, Z = -160)
    LandmarksBuilder.buildPiccadillyCircus(root, colliders, -70, -160);

    // H. Victorian Terraced Townhouses (Chelsea & Kensington Rows)
    LandmarksBuilder.buildTerracedRow(root, colliders, 50, -270, 6, 12, 15, 18);
    LandmarksBuilder.buildTerracedRow(root, colliders, 50, -220, 6, 12, 15, 18);
    LandmarksBuilder.buildTerracedRow(root, colliders, 140, 240, 6, 12, 15, 18);
    LandmarksBuilder.buildTerracedRow(root, colliders, -280, 240, 6, 12, 15, 18);

    // 5. HYDE PARK & ROYAL BOTANIC GARDENS (X = 0, Z = -280)
    const parkGrass = new THREE.Mesh(
      new THREE.CylinderGeometry(85, 85, 0.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.9 })
    );
    parkGrass.position.set(0, 0.2, -280);
    parkGrass.receiveShadow = true;
    root.add(parkGrass);

    // 6. SCATTERED LONDON PROPS (Red Buses, Black Cabs, Phone Booths, Lamps)
    // Red Double-Decker Buses
    root.add(LondonPropsBuilder.createDoubleDeckerBus(-20, -50, Math.PI / 2));
    root.add(LondonPropsBuilder.createDoubleDeckerBus(20, 50, -Math.PI / 2));
    root.add(LondonPropsBuilder.createDoubleDeckerBus(-220, -140, 0));
    root.add(LondonPropsBuilder.createDoubleDeckerBus(110, -200, Math.PI / 2));

    // Black Cabs
    root.add(LondonPropsBuilder.createBlackCab(-45, -45, Math.PI / 4));
    root.add(LondonPropsBuilder.createBlackCab(45, 45, -Math.PI / 3));
    root.add(LondonPropsBuilder.createBlackCab(-80, -135, Math.PI / 2));
    root.add(LondonPropsBuilder.createBlackCab(-190, -230, 0));

    // Red Phone Booths & Post Boxes
    root.add(LondonPropsBuilder.createPhoneBooth(-14, -42, 0));
    root.add(LondonPropsBuilder.createPhoneBooth(14, 42, Math.PI));
    root.add(LondonPropsBuilder.createPhoneBooth(-55, -165, Math.PI / 2));
    root.add(LondonPropsBuilder.createPostBox(-12, -42));
    root.add(LondonPropsBuilder.createPostBox(12, 42));

    // Victorian Gas Lamps along Embankments
    for (let lx = -halfCity + 30; lx < halfCity - 30; lx += 45) {
      root.add(LondonPropsBuilder.createVictorianStreetLamp(lx, -42));
      root.add(LondonPropsBuilder.createVictorianStreetLamp(lx, 42));
      root.add(LondonPropsBuilder.createVictorianStreetLamp(lx, -192));
      root.add(LondonPropsBuilder.createVictorianStreetLamp(lx, 192));
    }

    // 7. Stunt Ramps along the Embankment and Bridges
    ramps.push(
      { position: new THREE.Vector3(0, 0, -65), rotationY: 0, width: 10, length: 12, height: 3.8 },
      { position: new THREE.Vector3(0, 0, 65), rotationY: Math.PI, width: 10, length: 12, height: 3.8 },
      { position: new THREE.Vector3(-110, 0, -50), rotationY: Math.PI / 2, width: 10, length: 12, height: 3.5 },
      { position: new THREE.Vector3(110, 0, 50), rotationY: -Math.PI / 2, width: 10, length: 12, height: 3.5 }
    );

    // 8. Money Bag Pickup Coordinates across London
    const londonMoneyRoads = [
      // Tower Bridge
      new THREE.Vector3(0, 1.9, 0),
      new THREE.Vector3(0, 0.8, -50),
      new THREE.Vector3(0, 0.8, 50),
      // Big Ben & Westminster
      new THREE.Vector3(-220, 0.8, -50),
      new THREE.Vector3(-220, 0.8, -140),
      new THREE.Vector3(-160, 0.8, -50),
      // London Eye South Bank
      new THREE.Vector3(-170, 0.8, 50),
      new THREE.Vector3(-220, 0.8, 120),
      // The Shard
      new THREE.Vector3(95, 0.8, 50),
      new THREE.Vector3(140, 0.8, 110),
      // The Gherkin City Financial District
      new THREE.Vector3(140, 0.8, -50),
      new THREE.Vector3(220, 0.8, -120),
      // Buckingham Palace & The Mall
      new THREE.Vector3(-200, 0.8, -200),
      new THREE.Vector3(-120, 0.8, -200),
      // Piccadilly Circus
      new THREE.Vector3(-70, 0.8, -120),
      new THREE.Vector3(0, 0.8, -200),
      // Hyde Park
      new THREE.Vector3(0, 0.8, -270),
      new THREE.Vector3(80, 0.8, -200),
      // South London
      new THREE.Vector3(0, 0.8, 200),
      new THREE.Vector3(-120, 0.8, 200),
      new THREE.Vector3(120, 0.8, 200)
    ];
    moneyLocations.push(...londonMoneyRoads);

    // 9. Police Spawn Locations
    spawnPoints.push(
      new THREE.Vector3(-220, 0.5, -200),
      new THREE.Vector3(220, 0.5, -200),
      new THREE.Vector3(-220, 0.5, 200),
      new THREE.Vector3(220, 0.5, 200),
      new THREE.Vector3(0, 0.5, -320),
      new THREE.Vector3(0, 0.5, 320)
    );

    // 10. Getaway Helipad at London Docklands / Tower Bridge Pier
    const extractionPoint = new THREE.Vector3(220, 0.1, 50);
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
        minX: -halfCity,
        maxX: halfCity,
        minZ: -halfCity,
        maxZ: halfCity
      },
      waterLevel,
      extractionPoint
    };
  }
}

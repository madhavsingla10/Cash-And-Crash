import * as THREE from 'three';
import { BuildingCollider } from '../CityBuilder';

export class LandmarksBuilder {
  // Shared materials for authentic London stone, glass, and steel
  private static stoneMat = new THREE.MeshStandardMaterial({ color: 0xdfd3c3, roughness: 0.85 }); // Portland sandstone
  private static gothicStoneMat = new THREE.MeshStandardMaterial({ color: 0xc8b69e, roughness: 0.9 });
  private static brickMat = new THREE.MeshStandardMaterial({ color: 0x8a3324, roughness: 0.8 }); // London red/brown brick
  private static goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
  private static glassMat = new THREE.MeshStandardMaterial({ color: 0x113f67, roughness: 0.1, metalness: 0.9 });
  private static shardGlassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 });
  private static steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 });
  private static blueBridgeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.4 });
  private static clockFaceMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });

  // 1. BIG BEN & HOUSES OF PARLIAMENT (WESTMINSTER)
  public static buildBigBen(root: THREE.Group, colliders: BuildingCollider[], posX: number, posZ: number) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const towerW = 14;
    const towerH = 75; // Elizabeth Tower

    // Main Tower Shaft
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), this.gothicStoneMat);
    shaft.position.y = towerH / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // 4-Sided Clock Belfry
    const belfryH = 14;
    const belfry = new THREE.Mesh(new THREE.BoxGeometry(towerW + 2, belfryH, towerW + 2), this.gothicStoneMat);
    belfry.position.y = towerH + belfryH / 2;
    belfry.castShadow = true;
    group.add(belfry);

    // 4 Glowing Clock Faces
    const clockGeo = new THREE.CircleGeometry(3.6, 24);
    const clockOffsets = [
      { pos: [0, towerH + belfryH / 2, towerW / 2 + 1.05], rotY: 0 },
      { pos: [0, towerH + belfryH / 2, -towerW / 2 - 1.05], rotY: Math.PI },
      { pos: [towerW / 2 + 1.05, towerH + belfryH / 2, 0], rotY: Math.PI / 2 },
      { pos: [-towerW / 2 - 1.05, towerH + belfryH / 2, 0], rotY: -Math.PI / 2 }
    ];

    for (let c of clockOffsets) {
      const clock = new THREE.Mesh(clockGeo, this.clockFaceMat);
      clock.position.set(c.pos[0], c.pos[1], c.pos[2]);
      clock.rotation.y = c.rotY;
      group.add(clock);
    }

    // Gothic Spire & Gold Lantern
    const spireH = 22;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.65, spireH, 4), this.steelMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.y = towerH + belfryH + spireH / 2;
    spire.castShadow = true;
    group.add(spire);

    const goldFinial = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), this.goldMat);
    goldFinial.position.y = towerH + belfryH + spireH + 1.5;
    group.add(goldFinial);

    // Palace of Westminster (Parliament Hall Attached)
    const hallW = 80;
    const hallH = 24;
    const hallD = 35;
    const hall = new THREE.Mesh(new THREE.BoxGeometry(hallW, hallH, hallD), this.gothicStoneMat);
    hall.position.set(-hallW / 2 + towerW / 2, hallH / 2, -hallD / 2 + towerW / 2);
    hall.castShadow = true;
    hall.receiveShadow = true;
    group.add(hall);

    // Gothic roof spires on Parliament
    for (let sp = 0; sp < 6; sp++) {
      const pSpire = new THREE.Mesh(new THREE.ConeGeometry(2.5, 9, 4), this.steelMat);
      pSpire.rotation.y = Math.PI / 4;
      pSpire.position.set(-hallW + 10 + sp * 14, hallH + 4.5, -hallD / 2);
      group.add(pSpire);
    }

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX, towerH / 2, posZ),
        new THREE.Vector3(towerW + 4, towerH + belfryH, towerW + 4)
      ),
      type: 'building',
      height: towerH + belfryH
    });

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX - hallW / 2 + towerW / 2, hallH / 2, posZ - hallD / 2 + towerW / 2),
        new THREE.Vector3(hallW, hallH, hallD)
      ),
      type: 'building',
      height: hallH
    });

    root.add(group);
  }

  // 2. THE LONDON EYE (GIANT OBSERVATION WHEEL)
  public static buildLondonEye(root: THREE.Group, colliders: BuildingCollider[], posX: number, posZ: number) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const radius = 42;
    const wheelCenterY = 50;

    // A-Frame Support Legs
    const legGeo = new THREE.CylinderGeometry(0.8, 1.4, 60, 8);
    const leg1 = new THREE.Mesh(legGeo, this.steelMat);
    leg1.position.set(-14, 25, -12);
    leg1.rotation.z = -0.3;
    leg1.rotation.x = -0.25;

    const leg2 = new THREE.Mesh(legGeo, this.steelMat);
    leg2.position.set(14, 25, -12);
    leg2.rotation.z = 0.3;
    leg2.rotation.x = -0.25;

    const legBack = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 55, 8), this.steelMat);
    legBack.position.set(0, 25, 14);
    legBack.rotation.x = 0.35;

    group.add(leg1, leg2, legBack);

    // Central Spindle Hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 8, 16), this.steelMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, wheelCenterY, 0);
    group.add(hub);

    // Outer & Inner Wheel Rims
    const outerRim = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.9, 8, 48),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 })
    );
    outerRim.position.set(0, wheelCenterY, 0);
    group.add(outerRim);

    // 16 Spokes & 16 Passenger Capsules
    const spokeGeo = new THREE.CylinderGeometry(0.18, 0.18, radius * 2, 6);
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(spokeGeo, this.steelMat);
      spoke.position.set(0, wheelCenterY, 0);
      spoke.rotation.z = (i * Math.PI) / 8;
      group.add(spoke);
    }

    const podGeo = new THREE.SphereGeometry(2.4, 12, 10);
    for (let p = 0; p < 16; p++) {
      const angle = (p * Math.PI) / 8;
      const pod = new THREE.Mesh(podGeo, this.glassMat);
      pod.scale.set(1.4, 0.9, 0.9);
      pod.position.set(Math.cos(angle) * radius, wheelCenterY + Math.sin(angle) * radius, 0);
      group.add(pod);
    }

    // Riverside Boarding Terminal
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(45, 6, 22), this.stoneMat);
    terminal.position.set(0, 3, -15);
    terminal.castShadow = true;
    group.add(terminal);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX, 15, posZ),
        new THREE.Vector3(48, 30, 35)
      ),
      type: 'building',
      height: 30
    });

    root.add(group);
  }

  // 3. THE SHARD (LONDON BRIDGE QUARTER)
  public static buildTheShard(root: THREE.Group, colliders: BuildingCollider[], posX: number, posZ: number) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const baseW = 38;
    const height = 115; // Tallest iconic pyramid glass skyscraper

    // Tapering 8-sided pyramid shard geometry
    const shardGeo = new THREE.ConeGeometry(baseW, height, 8);
    const shardMesh = new THREE.Mesh(shardGeo, this.shardGlassMat);
    shardMesh.position.y = height / 2;
    shardMesh.castShadow = true;
    group.add(shardMesh);

    // Glowing spire tip
    const spireLight = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    spireLight.position.y = height + 1;
    group.add(spireLight);

    // Podium Base
    const podium = new THREE.Mesh(new THREE.BoxGeometry(baseW + 12, 10, baseW + 12), this.stoneMat);
    podium.position.y = 5;
    podium.castShadow = true;
    group.add(podium);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX, height / 2, posZ),
        new THREE.Vector3(baseW + 8, height, baseW + 8)
      ),
      type: 'building',
      height
    });

    root.add(group);
  }

  // 4. THE GHERKIN (30 ST MARY AXE)
  public static buildTheGherkin(root: THREE.Group, colliders: BuildingCollider[], posX: number, posZ: number) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const maxRadius = 18;
    const height = 80;

    // Curved ellipsoid tower
    const gherkinGeo = new THREE.CylinderGeometry(6, maxRadius, height * 0.65, 16);
    const lowerMesh = new THREE.Mesh(gherkinGeo, this.glassMat);
    lowerMesh.position.y = (height * 0.65) / 2;
    lowerMesh.castShadow = true;

    const domeGeo = new THREE.SphereGeometry(maxRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMesh = new THREE.Mesh(domeGeo, this.glassMat);
    domeMesh.position.y = height * 0.65;
    domeMesh.scale.set(1, 1.2, 1);
    domeMesh.castShadow = true;

    group.add(lowerMesh, domeMesh);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX, height / 2, posZ),
        new THREE.Vector3(maxRadius * 2, height, maxRadius * 2)
      ),
      type: 'building',
      height
    });

    root.add(group);
  }

  // 5. BUCKINGHAM PALACE & ROYAL COURTYARD
  public static buildBuckinghamPalace(root: THREE.Group, colliders: BuildingCollider[], posX: number, posZ: number) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const palaceW = 120;
    const palaceH = 22;
    const palaceD = 35;

    // Main Central Palace Facade (Portland Stone)
    const centralBlock = new THREE.Mesh(new THREE.BoxGeometry(palaceW, palaceH, palaceD), this.stoneMat);
    centralBlock.position.y = palaceH / 2;
    centralBlock.castShadow = true;
    centralBlock.receiveShadow = true;
    group.add(centralBlock);

    // Royal Balcony & Pediment
    const pediment = new THREE.Mesh(new THREE.BoxGeometry(26, 6, 6), this.stoneMat);
    pediment.position.set(0, palaceH + 3, palaceD / 2 - 2);
    group.add(pediment);

    // North & South Wings
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(30, palaceH * 0.85, 45), this.stoneMat);
    wingL.position.set(-palaceW / 2 + 15, (palaceH * 0.85) / 2, 22);
    wingL.castShadow = true;
    const wingR = wingL.clone();
    wingR.position.x = palaceW / 2 - 15;
    group.add(wingL, wingR);

    // Royal Flagpole on roof
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 14, 6), this.goldMat);
    pole.position.set(0, palaceH + 7, 0);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), new THREE.MeshBasicMaterial({ color: 0xcc0000 }));
    flag.position.set(2.5, palaceH + 12, 0);
    group.add(pole, flag);

    // Royal Courtyard Gilded Gates
    const gateGeo = new THREE.BoxGeometry(palaceW - 40, 4, 0.4);
    const gate = new THREE.Mesh(gateGeo, this.goldMat);
    gate.position.set(0, 2, 45);
    group.add(gate);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX, palaceH / 2, posZ),
        new THREE.Vector3(palaceW, palaceH, palaceD)
      ),
      type: 'building',
      height: palaceH
    });

    root.add(group);
  }

  // 6. PICCADILLY CIRCUS (NEON BILLBOARDS & EROS MONUMENT)
  public static buildPiccadillyCircus(root: THREE.Group, colliders: BuildingCollider[], posX: number, posZ: number) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const cornerW = 55;
    const cornerH = 36;

    // Curved Corner Building with Famous Giant Curved Neon LED Screens
    const building = new THREE.Mesh(new THREE.BoxGeometry(cornerW, cornerH, 30), this.stoneMat);
    building.position.set(0, cornerH / 2, -15);
    building.castShadow = true;
    group.add(building);

    // Neon LED Digital Billboard Screens
    const screen1 = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 14),
      new THREE.MeshBasicMaterial({ color: 0xe63946 }) // SANYO / Coca Cola Red
    );
    screen1.position.set(-14, 20, 0.2);

    const screen2 = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 14),
      new THREE.MeshBasicMaterial({ color: 0x00b4d8 }) // TDK / Hyundai Blue
    );
    screen2.position.set(14, 20, 0.2);

    group.add(screen1, screen2);

    // Central Shaftesbury Memorial Fountain & Statue of Eros
    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 2.5, 16), this.stoneMat);
    fountainBase.position.set(0, 1.25, 25);

    const erosPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 7, 8), this.stoneMat);
    erosPedestal.position.set(0, 6, 25);

    const erosStatue = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4), this.goldMat);
    erosStatue.position.set(0, 10.5, 25);

    group.add(fountainBase, erosPedestal, erosStatue);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX, cornerH / 2, posZ - 15),
        new THREE.Vector3(cornerW, cornerH, 30)
      ),
      type: 'building',
      height: cornerH
    });

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX, 5, posZ + 25),
        new THREE.Vector3(18, 10, 18)
      ),
      type: 'building',
      height: 10
    });

    root.add(group);
  }

  // 7. VICTORIAN LONDON TOWNHOUSES (TERRACED STREET ROWS)
  public static buildTerracedRow(
    root: THREE.Group,
    colliders: BuildingCollider[],
    startX: number,
    startZ: number,
    numHouses: number = 5,
    houseW: number = 10,
    houseH: number = 14,
    houseD: number = 16
  ) {
    const rowGroup = new THREE.Group();
    const rowLength = numHouses * houseW;

    for (let h = 0; h < numHouses; h++) {
      const hx = startX + h * houseW;
      const hz = startZ;

      // London Red/Brown Brick Facade
      const house = new THREE.Mesh(new THREE.BoxGeometry(houseW - 0.4, houseH, houseD), this.brickMat);
      house.position.set(hx, houseH / 2, hz);
      house.castShadow = true;
      house.receiveShadow = true;
      rowGroup.add(house);

      // Mansard Slate Roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(houseW * 0.7, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.7 })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.set(hx, houseH + 2, hz);
      rowGroup.add(roof);

      // Chimney Pots
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.5, 1.4), this.brickMat);
      chimney.position.set(hx + 2.5, houseH + 3, hz);
      rowGroup.add(chimney);

      // White Portico Door
      const portico = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.4), this.stoneMat);
      portico.position.set(hx, 1.6, hz + houseD / 2 + 0.2);
      rowGroup.add(portico);
    }

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(startX + rowLength / 2 - houseW / 2, houseH / 2, startZ),
        new THREE.Vector3(rowLength, houseH + 4, houseD)
      ),
      type: 'building',
      height: houseH + 4
    });

    root.add(rowGroup);
  }
}

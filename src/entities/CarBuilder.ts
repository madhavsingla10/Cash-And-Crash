import * as THREE from 'three';

export interface CarMeshes {
  root: THREE.Group;
  body: THREE.Mesh;
  wheels: THREE.Mesh[];
  lightBar?: THREE.Group;
  redLight?: THREE.Mesh;
  blueLight?: THREE.Mesh;
  turret?: THREE.Group;
  muzzle?: THREE.Object3D;
  headlights?: THREE.Mesh[];
  taillights?: THREE.Mesh[];
  exhausts?: THREE.Vector3[];
}

export class CarBuilder {
  // Shared materials for performance & low draw calls
  private static wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
  private static wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  private static rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 6);
  private static rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
  private static glassMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 });
  private static lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
  private static brakeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });

  public static createPlayerCar(): CarMeshes {
    const root = new THREE.Group();

    // Main Chassis
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88, // Neon Cyber Green Getaway Car
      metalness: 0.6,
      roughness: 0.3
    });

    const bodyGroup = new THREE.Group();
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 4.4), bodyMat);
    lowerBody.position.y = 0.55;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    bodyGroup.add(lowerBody);

    // Cabin / Roof
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.2), this.glassMat);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Spoiler
    const spoilerPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), bodyMat);
    spoilerPost1.position.set(-0.7, 0.95, 1.9);
    const spoilerPost2 = spoilerPost1.clone();
    spoilerPost2.position.set(0.7, 0.95, 1.9);
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.4), bodyMat);
    spoilerWing.position.set(0, 1.15, 1.9);
    bodyGroup.add(spoilerPost1, spoilerPost2, spoilerWing);

    // Headlights
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), this.lightMat);
    hl1.position.set(-0.75, 0.6, -2.21);
    const hl2 = hl1.clone();
    hl2.position.x = 0.75;
    bodyGroup.add(hl1, hl2);

    // Taillights
    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.1), this.brakeMat);
    tl1.position.set(-0.75, 0.6, 2.21);
    const tl2 = tl1.clone();
    tl2.position.x = 0.75;
    bodyGroup.add(tl1, tl2);

    // Neon underglow mesh
    const underglowMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.6 });
    const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.2), underglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.08;
    bodyGroup.add(underglow);

    // Forward Spotlights (Car Headlights illuminating the road)
    const headSpot = new THREE.SpotLight(0xfffaed, 5, 45, Math.PI / 4, 0.4, 1.2);
    headSpot.position.set(0, 0.6, -2.0);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0.2, -30);
    bodyGroup.add(spotTarget);
    headSpot.target = spotTarget;
    bodyGroup.add(headSpot);

    root.add(bodyGroup);

    // 4 Wheels
    const wheels = this.attachWheels(root, 2.0, 4.2, 0.42);

    return {
      root,
      body: lowerBody,
      wheels,
      headlights: [hl1, hl2],
      taillights: [tl1, tl2],
      exhausts: [new THREE.Vector3(-0.5, 0.35, 2.25), new THREE.Vector3(0.5, 0.35, 2.25)]
    };
  }

  public static createPoliceCruiser(): CarMeshes {
    const root = new THREE.Group();

    // Body: Black with White doors/roof
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    const bodyGroup = new THREE.Group();
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 4.3), blackMat);
    chassis.position.y = 0.58;
    chassis.castShadow = true;
    bodyGroup.add(chassis);

    // White door panel stripes
    const doorStripe = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.5, 1.8), whiteMat);
    doorStripe.position.set(0, 0.58, 0);
    bodyGroup.add(doorStripe);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 2.1), this.glassMat);
    cabin.position.set(0, 1.05, -0.1);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Roof White
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.1, 1.6), whiteMat);
    roof.position.set(0, 1.34, -0.1);
    bodyGroup.add(roof);

    // Front Push-bar / Bullbar
    const bullbarMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.2), bullbarMat);
    bullbar.position.set(0, 0.55, -2.25);
    bodyGroup.add(bullbar);

    // Lightbar on roof
    const lightBar = new THREE.Group();
    lightBar.position.set(0, 1.45, -0.1);

    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });

    const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), redMat);
    redLight.position.x = -0.4;
    const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), blueMat);
    blueLight.position.x = 0.4;
    const centerBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff }));

    lightBar.add(redLight, blueLight, centerBar);
    bodyGroup.add(lightBar);

    root.add(bodyGroup);
    const wheels = this.attachWheels(root, 2.0, 4.1, 0.42);

    return {
      root,
      body: chassis,
      wheels,
      lightBar,
      redLight,
      blueLight
    };
  }

  public static createSwatVan(): CarMeshes {
    const root = new THREE.Group();

    const swatMat = new THREE.MeshStandardMaterial({
      color: 0x1c2430, // Deep Navy Tactical Matte
      roughness: 0.8,
      metalness: 0.4
    });

    const bodyGroup = new THREE.Group();
    // Armored chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 5.2), swatMat);
    body.position.y = 1.2;
    body.castShadow = true;
    bodyGroup.add(body);

    // Armored Grill
    const grill = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 0.3), new THREE.MeshStandardMaterial({ color: 0x050505 }));
    grill.position.set(0, 0.85, -2.7);
    bodyGroup.add(grill);

    // Slit windows
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.3, 1.4), this.glassMat);
    win.position.set(0, 1.4, -1.3);
    bodyGroup.add(win);

    // Roof Gun Turret
    const turret = new THREE.Group();
    turret.position.set(0, 2.0, -0.4);

    const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.2, -0.7);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.2, -1.3);

    turret.add(turretBase, barrel, muzzle);
    bodyGroup.add(turret);

    // Flashing Strobe Lights
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });
    const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), redMat);
    redLight.position.set(-0.8, 1.95, -2.4);
    const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), blueMat);
    blueLight.position.set(0.8, 1.95, -2.4);
    bodyGroup.add(redLight, blueLight);

    root.add(bodyGroup);

    // 6 Heavy Wheels
    const wheels = this.attach6Wheels(root, 2.4, 5.0, 0.55);

    return {
      root,
      body,
      wheels,
      turret,
      muzzle,
      redLight,
      blueLight
    };
  }

  public static createHelicopter(): { root: THREE.Group; mainRotor: THREE.Mesh; tailRotor: THREE.Mesh; spotlight: THREE.SpotLight } {
    const root = new THREE.Group();
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x152238, roughness: 0.5 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 3.8), heliMat);
    body.position.y = 1.0;
    root.add(body);

    // Cockpit Glass
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.4), this.glassMat);
    glass.position.set(0, 1.1, -1.5);
    root.add(glass);

    // Tail boom
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 3.5), heliMat);
    tail.position.set(0, 1.2, 3.2);
    root.add(tail);

    // Main Rotor
    const mainRotor = new THREE.Mesh(
      new THREE.BoxGeometry(7.0, 0.05, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    mainRotor.position.set(0, 2.0, 0);
    root.add(mainRotor);

    // Tail Rotor
    const tailRotor = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.5, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    tailRotor.position.set(0.3, 1.4, 4.8);
    root.add(tailRotor);

    // Skids
    const skidMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const skidL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.4), skidMat);
    skidL.position.set(-1.0, 0.1, 0);
    const skidR = skidL.clone();
    skidR.position.x = 1.0;
    root.add(skidL, skidR);

    // Searchlight Spotlight
    const spotlight = new THREE.SpotLight(0xffffff, 5, 80, Math.PI / 6, 0.4, 1);
    spotlight.position.set(0, 0.2, -1.2);
    spotlight.castShadow = true;
    root.add(spotlight);
    root.add(spotlight.target);

    return { root, mainRotor, tailRotor, spotlight };
  }

  private static attachWheels(parent: THREE.Group, width: number, length: number, radius: number): THREE.Mesh[] {
    const wheels: THREE.Mesh[] = [];
    const xOffsets = [-width * 0.48, width * 0.48];
    const zOffsets = [-length * 0.32, length * 0.32];

    for (let x of xOffsets) {
      for (let z of zOffsets) {
        const wheel = new THREE.Mesh(this.wheelGeo, this.wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, radius, z);
        wheel.castShadow = true;

        const rim = new THREE.Mesh(this.rimGeo, this.rimMat);
        wheel.add(rim);

        parent.add(wheel);
        wheels.push(wheel);
      }
    }
    return wheels;
  }

  private static attach6Wheels(parent: THREE.Group, width: number, length: number, radius: number): THREE.Mesh[] {
    const wheels: THREE.Mesh[] = [];
    const xOffsets = [-width * 0.48, width * 0.48];
    const zOffsets = [-length * 0.35, 0, length * 0.35];

    for (let x of xOffsets) {
      for (let z of zOffsets) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.45, 12), this.wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, radius, z);
        wheel.castShadow = true;

        const rim = new THREE.Mesh(this.rimGeo, this.rimMat);
        wheel.add(rim);

        parent.add(wheel);
        wheels.push(wheel);
      }
    }
    return wheels;
  }
}

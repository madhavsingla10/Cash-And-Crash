import * as THREE from 'three';

export class LondonPropsBuilder {
  private static busRedMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 }); // London Bus Red
  private static glassMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 });
  private static blackCabMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
  private static taxiYellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  private static postBoxRedMat = new THREE.MeshStandardMaterial({ color: 0xba181b, roughness: 0.5 });
  private static lampIronMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.8 });
  private static warmLightMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });

  // 1. ICONIC RED DOUBLE-DECKER BUS (ROUTEMASTER)
  public static createDoubleDeckerBus(posX: number, posZ: number, rotY: number = 0): THREE.Group {
    const bus = new THREE.Group();
    bus.position.set(posX, 0, posZ);
    bus.rotation.y = rotY;

    const busW = 2.6;
    const busH = 4.8;
    const busL = 9.5;

    // Lower Deck
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(busW, 2.2, busL), this.busRedMat);
    lowerBody.position.y = 1.4;
    lowerBody.castShadow = true;

    // Upper Deck
    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(busW, 2.0, busL), this.busRedMat);
    upperBody.position.y = 3.5;
    upperBody.castShadow = true;

    // Window Strips (Lower & Upper)
    const lowerWin = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.1, 0.9, busL - 1.2), this.glassMat);
    lowerWin.position.y = 1.6;
    const upperWin = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.1, 0.9, busL - 1.2), this.glassMat);
    upperWin.position.y = 3.6;

    // Front Destination Blind
    const destBlind = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
    destBlind.position.set(0, 4.2, -busL / 2 - 0.05);

    bus.add(lowerBody, upperBody, lowerWin, upperWin, destBlind);

    // 6 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const wheelZ = [-busL * 0.35, 0, busL * 0.35];

    for (let z of wheelZ) {
      const wL = new THREE.Mesh(wheelGeo, wheelMat);
      wL.rotation.z = Math.PI / 2;
      wL.position.set(-busW / 2, 0.5, z);
      const wR = wL.clone();
      wR.position.x = busW / 2;
      bus.add(wL, wR);
    }

    return bus;
  }

  // 2. ICONIC BLACK LONDON CAB (TX4 TAXI)
  public static createBlackCab(posX: number, posZ: number, rotY: number = 0): THREE.Group {
    const cab = new THREE.Group();
    cab.position.set(posX, 0, posZ);
    cab.rotation.y = rotY;

    // Main Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 4.4), this.blackCabMat);
    body.position.y = 0.65;
    body.castShadow = true;

    // Tall Classic Roof
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 2.4), this.blackCabMat);
    cabin.position.set(0, 1.4, -0.1);
    cabin.castShadow = true;

    // Glass Windows
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.5, 2.2), this.glassMat);
    win.position.set(0, 1.4, -0.1);

    // TAXI Roof Light
    const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.2), this.taxiYellowMat);
    taxiSign.position.set(0, 1.9, -0.9);

    cab.add(body, cabin, win, taxiSign);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const xOffsets = [-1.0, 1.0];
    const zOffsets = [-1.4, 1.4];

    for (let x of xOffsets) {
      for (let z of zOffsets) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.42, z);
        cab.add(w);
      }
    }

    return cab;
  }

  // 3. RED ROYAL MAIL K6 TELEPHONE BOOTH
  public static createPhoneBooth(posX: number, posZ: number, rotY: number = 0): THREE.Group {
    const booth = new THREE.Group();
    booth.position.set(posX, 0, posZ);
    booth.rotation.y = rotY;

    const w = 1.2;
    const h = 2.8;

    // Red Cast-Iron Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), this.postBoxRedMat);
    frame.position.y = h / 2;
    frame.castShadow = true;

    // Glass Window Panes
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 1.8, w + 0.05), this.glassMat);
    glass.position.y = 1.5;

    // Domed Roof
    const dome = new THREE.Mesh(new THREE.SphereGeometry(w * 0.65, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), this.postBoxRedMat);
    dome.position.y = h;

    booth.add(frame, glass, dome);
    return booth;
  }

  // 4. RED PILLAR POST BOX
  public static createPostBox(posX: number, posZ: number): THREE.Group {
    const postBox = new THREE.Group();
    postBox.position.set(posX, 0, posZ);

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 12), this.postBoxRedMat);
    cylinder.position.y = 0.8;
    cylinder.castShadow = true;

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), this.postBoxRedMat);
    cap.position.y = 1.6;

    postBox.add(cylinder, cap);
    return postBox;
  }

  // 5. VICTORIAN CAST-IRON STREET GAS LAMP
  public static createVictorianStreetLamp(posX: number, posZ: number): THREE.Group {
    const lamp = new THREE.Group();
    lamp.position.set(posX, 0, posZ);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 5.2, 6), this.lampIronMat);
    pole.position.y = 2.6;
    pole.castShadow = true;

    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), this.lampIronMat);
    lantern.position.y = 5.4;

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), this.warmLightMat);
    bulb.position.y = 5.4;

    lamp.add(pole, lantern, bulb);
    return lamp;
  }
}

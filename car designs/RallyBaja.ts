import * as THREE from 'three';
import { CarMeshes } from '../entities/CarBuilder';

const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 12);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.34, 6);
const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 });
const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });

function attachWheels(parent: THREE.Group, width: number, length: number, radius: number): THREE.Mesh[] {
  const wheels: THREE.Mesh[] = [];
  const xOffsets = [-width * 0.48, width * 0.48];
  const zOffsets = [-length * 0.33, length * 0.33];

  for (let x of xOffsets) {
    for (let z of zOffsets) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, radius, z);
      wheel.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheel.add(rim);
      parent.add(wheel);
      wheels.push(wheel);
    }
  }
  return wheels;
}

export function createRallyBaja(): CarMeshes {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6, metalness: 0.2 });

  const bodyGroup = new THREE.Group();

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.2), bodyMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  bodyGroup.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 1.8), glassMat);
  cabin.position.set(0, 0.9, -0.2);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  const rollBarFront = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 }));
  rollBarFront.position.set(0, 1.2, -1.3);
  const rollBarRear = rollBarFront.clone();
  rollBarRear.position.z = 1.1;
  bodyGroup.add(rollBarFront, rollBarRear);

  const roofRack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 2.0), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
  roofRack.position.set(0, 1.25, -0.1);
  bodyGroup.add(roofRack);

  const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  spareTire.rotation.x = Math.PI / 2;
  spareTire.position.set(0, 1.35, 0.8);
  bodyGroup.add(spareTire);

  const skidPlate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 3.5), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 }));
  skidPlate.position.set(0, 0.35, -0.1);
  bodyGroup.add(skidPlate);

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.08), lightMat);
  hl1.position.set(-0.65, 0.55, -2.11);
  const hl2 = hl1.clone();
  hl2.position.x = 0.65;
  bodyGroup.add(hl1, hl2);

  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), brakeMat);
  tl1.position.set(-0.7, 0.55, 2.11);
  const tl2 = tl1.clone();
  tl2.position.x = 0.7;
  bodyGroup.add(tl1, tl2);

  root.add(bodyGroup);
  const wheels = attachWheels(root, 2.0, 4.2, 0.42);

  return { root, body: chassis, wheels, headlights: [hl1, hl2], taillights: [tl1, tl2], exhausts: [new THREE.Vector3(-0.5, 0.35, 2.2), new THREE.Vector3(0.5, 0.35, 2.2)] };
}

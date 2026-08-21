import * as THREE from 'three';
import { CarMeshes } from '../entities/CarBuilder';

const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 12);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.34, 6);
const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a1525, roughness: 0.1, metalness: 0.9 });
const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
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

export function createArmoredLimousine(): CarMeshes {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.3, metalness: 0.8 });

  const bodyGroup = new THREE.Group();

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 6.5), bodyMat);
  chassis.position.y = 0.7;
  chassis.castShadow = true;
  bodyGroup.add(chassis);

  const cabinFront = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 1.6), glassMat);
  cabinFront.position.set(0, 1.15, -1.8);
  cabinFront.castShadow = true;
  bodyGroup.add(cabinFront);

  const cabinRear = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 2.2), glassMat);
  cabinRear.position.set(0, 1.15, 0.3);
  cabinRear.castShadow = true;
  bodyGroup.add(cabinRear);

  const divider = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.5, 0.15), bodyMat);
  divider.position.set(0, 1.0, -1.05);
  bodyGroup.add(divider);

  const roofRail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 5.8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 }));
  roofRail1.position.set(-0.85, 1.5, -0.1);
  const roofRail2 = roofRail1.clone();
  roofRail2.position.x = 0.85;
  bodyGroup.add(roofRail1, roofRail2);

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.08), lightMat);
  hl1.position.set(-0.6, 0.55, -3.26);
  const hl2 = hl1.clone();
  hl2.position.x = 0.6;
  bodyGroup.add(hl1, hl2);

  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), brakeMat);
  tl1.position.set(-0.7, 0.6, 3.26);
  const tl2 = tl1.clone();
  tl2.position.x = 0.7;
  bodyGroup.add(tl1, tl2);

  root.add(bodyGroup);
  const wheels = attachWheels(root, 2.2, 6.3, 0.42);

  return { root, body: chassis, wheels, headlights: [hl1, hl2], taillights: [tl1, tl2], exhausts: [new THREE.Vector3(-0.5, 0.4, 3.2), new THREE.Vector3(0.5, 0.4, 3.2)] };
}

import * as THREE from 'three';
import { CarMeshes } from '../entities/CarBuilder';

const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 12);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.34, 6);
const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 0.1, metalness: 0.9 });
const lightMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

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

export function createRetroMuscleCar(): CarMeshes {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.4, metalness: 0.5 });

  const bodyGroup = new THREE.Group();

  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.5), bodyMat);
  lower.position.y = 0.55;
  lower.castShadow = true;
  bodyGroup.add(lower);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 1.6), bodyMat);
  hood.position.set(0, 0.75, -1.3);
  bodyGroup.add(hood);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 1.6), glassMat);
  cabin.position.set(0, 0.85, 0.0);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.2, 1.2), bodyMat);
  trunk.position.set(0, 0.75, 1.4);
  bodyGroup.add(trunk);

  const scoop1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.8), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7 }));
  scoop1.position.set(-0.5, 0.95, -1.3);
  const scoop2 = scoop1.clone();
  scoop2.position.x = 0.5;
  bodyGroup.add(scoop1, scoop2);

  const spoilerPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), bodyMat);
  spoilerPost1.position.set(-0.7, 0.95, 1.85);
  const spoilerPost2 = spoilerPost1.clone();
  spoilerPost2.position.x = 0.7;
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.35), bodyMat);
  spoilerWing.position.set(0, 1.1, 1.85);
  bodyGroup.add(spoilerPost1, spoilerPost2, spoilerWing);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.08, 4.3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  stripe.position.set(0, 0.58, 0);
  bodyGroup.add(stripe);

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.08), lightMat);
  hl1.position.set(-0.7, 0.55, -2.26);
  const hl2 = hl1.clone();
  hl2.position.x = 0.7;
  bodyGroup.add(hl1, hl2);

  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.08), brakeMat);
  tl1.position.set(-0.75, 0.55, 2.26);
  const tl2 = tl1.clone();
  tl2.position.x = 0.75;
  bodyGroup.add(tl1, tl2);

  root.add(bodyGroup);
  const wheels = attachWheels(root, 2.0, 4.4, 0.4);

  return { root, body: lower, wheels, headlights: [hl1, hl2], taillights: [tl1, tl2], exhausts: [new THREE.Vector3(-0.5, 0.4, 2.25), new THREE.Vector3(0.5, 0.4, 2.25)] };
}

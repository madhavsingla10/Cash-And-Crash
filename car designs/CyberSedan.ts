import * as THREE from 'three';
import { CarMeshes } from '../src/entities/CarBuilder';

const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 6);
const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 });
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

export function createCyberSedan(): CarMeshes {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 });

  const bodyGroup = new THREE.Group();

  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 4.3), bodyMat);
  lower.position.y = 0.5;
  lower.castShadow = true;
  bodyGroup.add(lower);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.4, 2.0), glassMat);
  cabin.position.set(0, 0.85, -0.1);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.15), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
  grille.position.set(0, 0.5, -2.18);
  bodyGroup.add(grille);

  const trim = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 });
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 4.2), trim);
  trimL.position.set(-1.0, 0.52, 0);
  const trimR = trimL.clone();
  trimR.position.x = 1.0;
  bodyGroup.add(trimL, trimR);

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.08), lightMat);
  hl1.position.set(-0.6, 0.52, -2.21);
  const hl2 = hl1.clone();
  hl2.position.x = 0.6;
  bodyGroup.add(hl1, hl2);

  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), brakeMat);
  tl1.position.set(-0.7, 0.58, 2.21);
  const tl2 = tl1.clone();
  tl2.position.x = 0.7;
  bodyGroup.add(tl1, tl2);

  root.add(bodyGroup);
  const wheels = attachWheels(root, 2.0, 4.2, 0.42);

  return { root, body: lower, wheels, headlights: [hl1, hl2], taillights: [tl1, tl2], exhausts: [new THREE.Vector3(-0.5, 0.35, 2.25), new THREE.Vector3(0.5, 0.35, 2.25)] };
}

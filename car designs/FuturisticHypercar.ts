import * as THREE from 'three';
import { CarMeshes } from '../entities/CarBuilder';

const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.5 });
const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 8);
const rimMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, metalness: 0.9, roughness: 0.2, emissive: 0x003366 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a1525, roughness: 0.1, metalness: 0.9 });
const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

function attachWheels(parent: THREE.Group, width: number, length: number, radius: number): THREE.Mesh[] {
  const wheels: THREE.Mesh[] = [];
  const xOffsets = [-width * 0.48, width * 0.48];
  const zOffsets = [-length * 0.34, length * 0.34];

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

export function createFuturisticHypercar(): CarMeshes {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.2, metalness: 0.9 });

  const bodyGroup = new THREE.Group();

  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 4.2), bodyMat);
  lower.position.y = 0.45;
  lower.castShadow = true;
  bodyGroup.add(lower);

  const mid = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.25, 3.0), bodyMat);
  mid.position.set(0, 0.72, -0.1);
  mid.castShadow = true;
  bodyGroup.add(mid);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 1.8), glassMat);
  cabin.position.set(0, 0.85, -0.3);
  bodyGroup.add(cabin);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 4), bodyMat);
  nose.rotation.x = -Math.PI / 2;
  nose.rotation.z = Math.PI / 4;
  nose.position.set(0, 0.5, -2.5);
  bodyGroup.add(nose);

  const rearWingPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), bodyMat);
  rearWingPost1.position.set(-0.65, 0.9, 1.9);
  const rearWingPost2 = rearWingPost1.clone();
  rearWingPost2.position.x = 0.65;
  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.35), bodyMat);
  rearWing.position.set(0, 1.1, 1.9);
  bodyGroup.add(rearWingPost1, rearWingPost2, rearWing);

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.08), lightMat);
  hl1.position.set(-0.6, 0.5, -2.21);
  const hl2 = hl1.clone();
  hl2.position.x = 0.6;
  bodyGroup.add(hl1, hl2);

  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.08), brakeMat);
  tl1.position.set(-0.65, 0.65, 2.21);
  const tl2 = tl1.clone();
  tl2.position.x = 0.65;
  bodyGroup.add(tl1, tl2);

  const neonStrip = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 3.8), neonStrip);
  strip.position.set(0, 0.35, -0.1);
  bodyGroup.add(strip);

  root.add(bodyGroup);
  const wheels = attachWheels(root, 1.9, 4.1, 0.38);

  return { root, body: lower, wheels, headlights: [hl1, hl2], taillights: [tl1, tl2], exhausts: [new THREE.Vector3(-0.3, 0.3, 2.2), new THREE.Vector3(0.3, 0.3, 2.2)] };
}

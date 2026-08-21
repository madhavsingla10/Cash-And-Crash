import * as THREE from 'three';
import { CarMeshes } from '../src/entities/CarBuilder';

const wheelGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.6, 16);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.4 });
const rimGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.65, 8);
const rimMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.3 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

function attachWheels(parent: THREE.Group, width: number, length: number, radius: number): THREE.Mesh[] {
  const wheels: THREE.Mesh[] = [];
  const xOffsets = [-width * 0.48, width * 0.48];
  const zOffsets = [-length * 0.35, length * 0.35];

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

export function createMonsterTruck(): CarMeshes {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5, metalness: 0.3 });

  const bodyGroup = new THREE.Group();

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 4.8), bodyMat);
  chassis.position.y = 1.1;
  chassis.castShadow = true;
  bodyGroup.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.4), glassMat);
  cabin.position.set(0, 1.65, -0.1);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  const cage1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2.4), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
  cage1.position.set(-0.9, 1.6, -0.1);
  const cage2 = cage1.clone();
  cage2.position.x = 0.9;
  const cageTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 2.4), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
  cageTop.position.set(0, 2.0, -0.1);
  bodyGroup.add(cage1, cage2, cageTop);

  const bullbar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 }));
  bullbar.position.set(0, 0.9, -2.5);
  bodyGroup.add(bullbar);

  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 }));
  winch.rotation.x = Math.PI / 2;
  winch.position.set(0, 1.0, -2.7);
  bodyGroup.add(winch);

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.1), lightMat);
  hl1.position.set(-0.8, 0.9, -2.41);
  const hl2 = hl1.clone();
  hl2.position.x = 0.8;
  bodyGroup.add(hl1, hl2);

  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.1), brakeMat);
  tl1.position.set(-0.9, 0.9, 2.41);
  const tl2 = tl1.clone();
  tl2.position.x = 0.9;
  bodyGroup.add(tl1, tl2);

  root.add(bodyGroup);
  const wheels = attachWheels(root, 2.4, 4.6, 0.75);

  return { root, body: chassis, wheels, headlights: [hl1, hl2], taillights: [tl1, tl2], exhausts: [new THREE.Vector3(-0.4, 0.8, 2.3), new THREE.Vector3(0.4, 0.8, 2.3)] };
}

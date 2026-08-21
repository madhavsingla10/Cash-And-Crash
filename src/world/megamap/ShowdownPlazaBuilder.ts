import * as THREE from 'three';
import { BuildingCollider, StuntRamp } from '../CityBuilder';

export class ShowdownPlazaBuilder {
  public static buildShowdownPlaza(
    root: THREE.Group,
    colliders: BuildingCollider[],
    ramps: StuntRamp[],
    centerX: number,
    centerZ: number,
    runwayLength: number = 220,
    runwayWidth: number = 40
  ) {
    const showdownGroup = new THREE.Group();
    showdownGroup.position.set(centerX, 0, centerZ);

    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x14171f, roughness: 0.8 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const neonGoldMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
    const tribuneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

    // 1. Runway Drag Strip & Showdown Arena Pad
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(runwayWidth, runwayLength), runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 0.08;
    runway.receiveShadow = true;
    showdownGroup.add(runway);

    // Burnout Donut Circles at Plaza Ends
    const circle1 = new THREE.Mesh(new THREE.RingGeometry(10, 18, 32), lineMat);
    circle1.rotation.x = -Math.PI / 2;
    circle1.position.set(0, 0.12, -runwayLength / 2 + 30);
    const circle2 = new THREE.Mesh(new THREE.RingGeometry(10, 18, 32), lineMat);
    circle2.rotation.x = -Math.PI / 2;
    circle2.position.set(0, 0.12, runwayLength / 2 - 30);
    showdownGroup.add(circle1, circle2);

    // 2. Grand Spectator Stadium Tribunes (East & West)
    const tribuneH = 14;
    const tribuneW = 12;
    const tribuneL = runwayLength * 0.7;

    const tribuneWest = new THREE.Mesh(new THREE.BoxGeometry(tribuneW, tribuneH, tribuneL), tribuneMat);
    tribuneWest.position.set(-runwayWidth / 2 - tribuneW / 2, tribuneH / 2, 0);
    tribuneWest.castShadow = true;
    showdownGroup.add(tribuneWest);

    const tribuneEast = new THREE.Mesh(new THREE.BoxGeometry(tribuneW, tribuneH, tribuneL), tribuneMat);
    tribuneEast.position.set(runwayWidth / 2 + tribuneW / 2, tribuneH / 2, 0);
    tribuneEast.castShadow = true;
    showdownGroup.add(tribuneEast);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX - runwayWidth / 2 - tribuneW / 2, tribuneH / 2, centerZ),
        new THREE.Vector3(tribuneW, tribuneH, tribuneL)
      ),
      type: 'building',
      height: tribuneH
    });

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX + runwayWidth / 2 + tribuneW / 2, tribuneH / 2, centerZ),
        new THREE.Vector3(tribuneW, tribuneH, tribuneL)
      ),
      type: 'building',
      height: tribuneH
    });

    // 3. Glowing Neon Speed Arch Gates
    for (let g = 0; g < 4; g++) {
      const gz = -runwayLength * 0.35 + g * (runwayLength * 0.24);
      const arch = new THREE.Group();
      arch.position.set(0, 0, gz);

      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 8), neonCyanMat);
      postL.position.set(-runwayWidth / 2 + 2, 6, 0);
      const postR = postL.clone();
      postR.position.x = runwayWidth / 2 - 2;

      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(runwayWidth - 4, 0.8, 0.8), neonCyanMat);
      crossbar.position.set(0, 12, 0);

      arch.add(postL, postR, crossbar);
      showdownGroup.add(arch);
    }

    // 4. Stunt Loop / High Launchpad Ramps
    ramps.push({
      position: new THREE.Vector3(centerX, 0, centerZ - 25),
      rotationY: 0,
      width: 14,
      length: 18,
      height: 5.5
    });

    ramps.push({
      position: new THREE.Vector3(centerX, 0, centerZ + 25),
      rotationY: Math.PI,
      width: 14,
      length: 18,
      height: 5.5
    });

    root.add(showdownGroup);
  }
}

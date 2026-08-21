import * as THREE from 'three';

export class WaypointArrow {
  public root: THREE.Group;
  private arrowMesh: THREE.Group;
  private glowRing: THREE.Mesh;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();

    // 3D Stylized Holographic Waypoint Arrow
    this.arrowMesh = new THREE.Group();

    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      emissive: 0x00aa66,
      roughness: 0.2,
      metalness: 0.8
    });

    // Arrow Cone / Head
    const headGeo = new THREE.ConeGeometry(0.7, 1.6, 6);
    headGeo.rotateX(-Math.PI / 2); // Point forward along -Z
    const headMesh = new THREE.Mesh(headGeo, arrowMat);
    headMesh.position.set(0, 0, -1.0);
    this.arrowMesh.add(headMesh);

    // Arrow Shaft
    const shaftGeo = new THREE.BoxGeometry(0.35, 0.35, 1.2);
    const shaftMesh = new THREE.Mesh(shaftGeo, arrowMat);
    shaftMesh.position.set(0, 0, 0.1);
    this.arrowMesh.add(shaftMesh);

    // Rotating Glowing Energy Ring around the arrow
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    this.glowRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 6, 16), ringMat);
    this.glowRing.rotation.x = Math.PI / 2;
    this.arrowMesh.add(this.glowRing);

    this.root.add(this.arrowMesh);
    this.root.position.set(0, 3.8, 0);
    this.scene.add(this.root);
  }

  public update(playerPos: THREE.Vector3, targetPos: THREE.Vector3 | null, isExtraction: boolean, dt: number) {
    if (!targetPos) {
      this.root.visible = false;
      return;
    }

    this.root.visible = true;

    // Follow smoothly above player car
    const hoverY = playerPos.y + 3.6 + Math.sin(performance.now() * 0.005) * 0.25;
    this.root.position.set(playerPos.x, hoverY, playerPos.z);

    // Rotate arrow to point towards the target in the horizontal XZ plane
    const dir = targetPos.clone().sub(playerPos);
    dir.y = 0; // horizontal only
    if (dir.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(dir.x, dir.z);
      this.arrowMesh.rotation.y = targetAngle + Math.PI;
    }

    // Spin ring
    this.glowRing.rotation.z += 3.5 * dt;

    // Color swap: Neon Cyan for extraction, Neon Green/Gold for money
    const color = isExtraction ? 0x00ffee : 0x00ff88;
    const emissive = isExtraction ? 0x0088cc : 0x00aa44;

    this.arrowMesh.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.setHex(color);
          child.material.emissive.setHex(emissive);
        } else if (child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.setHex(color);
        }
      }
    });
  }

  public dispose() {
    this.scene.remove(this.root);
  }
}

import * as THREE from 'three';

export class WaypointArrow {
  public root: THREE.Group;
  private arrowMesh: THREE.Mesh;
  private scene: THREE.Scene;

  private currentYaw: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();

    // -------------------------------------------------------------
    // CLASSIC, SIMPLE ARCADE 3D GUIDE ARROW
    // -------------------------------------------------------------
    // Clean 2D Arrow Profile in X-Y plane, extruded into 3D
    const shape = new THREE.Shape();
    // Tip (front along -Y locally, will be rotated to -Z)
    shape.moveTo(0, -1.5);
    // Right arrowhead wing tip
    shape.lineTo(0.7, -0.3);
    // Right inner notch
    shape.lineTo(0.3, -0.3);
    // Right shaft back
    shape.lineTo(0.3, 1.1);
    // Left shaft back
    shape.lineTo(-0.3, 1.1);
    // Left inner notch
    shape.lineTo(-0.3, -0.3);
    // Left arrowhead wing tip
    shape.lineTo(-0.7, -0.3);
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.32,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    // Rotate so arrow points forward along -Z (flat horizontal in XZ plane)
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffea00, // High-visibility bright arcade yellow
      emissive: 0xff8800,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.6
    });

    this.arrowMesh = new THREE.Mesh(geometry, material);
    this.arrowMesh.castShadow = true;

    this.root.add(this.arrowMesh);
    this.root.position.set(0, 3.2, 0);
    this.root.visible = false;
    this.scene.add(this.root);
  }

  public update(playerPos: THREE.Vector3, targetPos: THREE.Vector3 | null, isExtraction: boolean, dt: number) {
    if (!targetPos) {
      this.root.visible = false;
      return;
    }

    this.root.visible = true;

    // 1. Hover smoothly directly above the car roof
    const hoverY = playerPos.y + 3.2 + Math.sin(performance.now() * 0.005) * 0.15;
    this.root.position.set(playerPos.x, hoverY, playerPos.z);

    // 2. Direct horizontal angle to destination (tip strictly points at target)
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.1) {
      const targetAngle = Math.atan2(dx, dz) + Math.PI;

      let delta = targetAngle - this.currentYaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;

      this.currentYaw += delta * Math.min(1.0, 16 * dt);
      this.arrowMesh.rotation.set(0, this.currentYaw, 0);
    }

    // 3. Simple High-Visibility Colors:
    // Electric Cyan for Extraction Helipad, Vibrant Arcade Yellow/Green for Cash Drops
    const color = isExtraction ? 0x00f0ff : (dist < 30 ? 0x00ff66 : 0xffea00);
    const emissive = isExtraction ? 0x0088cc : (dist < 30 ? 0x00aa33 : 0xff8800);

    const mat = this.arrowMesh.material as THREE.MeshStandardMaterial;
    mat.color.setHex(color);
    mat.emissive.setHex(emissive);
  }

  public dispose() {
    this.scene.remove(this.root);
  }
}

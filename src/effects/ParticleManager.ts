import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  rotationSpeed?: THREE.Vector3;
  colorFade?: boolean;
}

interface BulletTracer {
  mesh: THREE.Line;
  start: THREE.Vector3;
  end: THREE.Vector3;
  progress: number;
  speed: number;
}

export class ParticleManager {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private bullets: BulletTracer[] = [];
  private skidmarks: THREE.Mesh[] = [];

  private smokeGeo: THREE.SphereGeometry;
  private smokeMat: THREE.MeshBasicMaterial;
  private sparkGeo: THREE.BoxGeometry;
  private fireGeo: THREE.DodecahedronGeometry;
  private waterGeo: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.smokeGeo = new THREE.SphereGeometry(0.35, 5, 5);
    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.6
    });

    this.sparkGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.fireGeo = new THREE.DodecahedronGeometry(0.4);
    this.waterGeo = new THREE.SphereGeometry(0.3, 4, 4);
  }

  public emitTireSmoke(pos: THREE.Vector3, count: number = 2) {
    for (let i = 0; i < count; i++) {
      const mat = this.smokeMat.clone();
      const mesh = new THREE.Mesh(this.smokeGeo, mat);
      mesh.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        0.1 + Math.random() * 0.1,
        (Math.random() - 0.5) * 0.4
      ));
      const scale = 0.4 + Math.random() * 0.4;
      mesh.scale.set(scale, scale, scale);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.2,
          (Math.random() - 0.5) * 1.5
        ),
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4
      });
    }
  }

  public emitSandRoostertail(pos: THREE.Vector3, vel: THREE.Vector3, count: number = 3) {
    const sandColors = [0xdeb887, 0xd4a373, 0xca8a04, 0xb45309];
    for (let i = 0; i < count; i++) {
      const col = sandColors[Math.floor(Math.random() * sandColors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75 });
      const mesh = new THREE.Mesh(this.smokeGeo, mat);
      mesh.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        0.15 + Math.random() * 0.2,
        (Math.random() - 0.5) * 0.6
      ));
      const s = 0.5 + Math.random() * 0.5;
      mesh.scale.set(s, s, s);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          -vel.x * 0.4 + (Math.random() - 0.5) * 4,
          2.5 + Math.random() * 3.5,
          -vel.z * 0.4 + (Math.random() - 0.5) * 4
        ),
        life: 0,
        maxLife: 0.65 + Math.random() * 0.4,
        colorFade: true
      });
    }
  }

  public createExplosion(pos: THREE.Vector3, isBig: boolean = false) {
    const count = isBig ? 35 : 20;
    const colors = [0xff2200, 0xff7700, 0xffcc00, 0x333333];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(this.fireGeo, mat);
      mesh.position.copy(pos);
      const scale = 0.5 + Math.random() * (isBig ? 1.2 : 0.7);
      mesh.scale.set(scale, scale, scale);

      const speed = 6 + Math.random() * (isBig ? 14 : 8);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;

      const vel = new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * speed,
        Math.sin(phi) * speed + 3,
        Math.sin(theta) * Math.cos(phi) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.6,
        rotationSpeed: new THREE.Vector3(
          Math.random() * 8,
          Math.random() * 8,
          Math.random() * 8
        ),
        colorFade: true
      });
    }
  }

  public emitSparks(pos: THREE.Vector3, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(pos);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        2 + Math.random() * 6,
        (Math.random() - 0.5) * 8
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2
      });
    }
  }

  public emitWaterSplash(pos: THREE.Vector3) {
    const count = 25;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x48cae4,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(this.waterGeo, mat);
      mesh.position.copy(pos);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        6 + Math.random() * 8,
        (Math.random() - 0.5) * 10
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4
      });
    }
  }

  public fireBullet(origin: THREE.Vector3, target: THREE.Vector3) {
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffdd00,
      linewidth: 3
    });
    const geo = new THREE.BufferGeometry().setFromPoints([
      origin.clone(),
      origin.clone().add(new THREE.Vector3(0, 0, 0))
    ]);
    const mesh = new THREE.Line(geo, lineMat);
    this.scene.add(mesh);

    this.bullets.push({
      mesh,
      start: origin.clone(),
      end: target.clone(),
      progress: 0,
      speed: 4.5 // fast tracer
    });
  }

  public addSkidMark(pos: THREE.Vector3, heading: number) {
    if (this.skidmarks.length > 80) {
      const old = this.skidmarks.shift();
      if (old) {
        this.scene.remove(old);
        old.geometry.dispose();
      }
    }
    const skidGeo = new THREE.PlaneGeometry(0.35, 0.9);
    const skidMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const skid = new THREE.Mesh(skidGeo, skidMat);
    skid.rotation.x = -Math.PI / 2;
    skid.rotation.z = heading;
    skid.position.set(pos.x, 0.02, pos.z);
    this.scene.add(skid);
    this.skidmarks.push(skid);
  }

  public update(dt: number) {
    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach(m => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics motion + gravity
      p.velocity.y -= 12 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      if (p.rotationSpeed) {
        p.mesh.rotation.x += p.rotationSpeed.x * dt;
        p.mesh.rotation.y += p.rotationSpeed.y * dt;
      }

      // Fade out
      const progress = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      if (mat.transparent) {
        mat.opacity = Math.max(0, (1 - progress) * 0.8);
      }
      p.mesh.scale.multiplyScalar(1 + 0.3 * dt);
    }

    // Update bullet tracers
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.progress += b.speed * dt;

      if (b.progress >= 1) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        this.bullets.splice(i, 1);
        continue;
      }

      const curHead = b.start.clone().lerp(b.end, Math.min(1, b.progress));
      const curTail = b.start.clone().lerp(b.end, Math.max(0, b.progress - 0.25));
      b.mesh.geometry.setFromPoints([curTail, curHead]);
    }
  }

  public clearAll() {
    this.particles.forEach(p => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.particles = [];

    this.bullets.forEach(b => {
      this.scene.remove(b.mesh);
      b.mesh.geometry.dispose();
    });
    this.bullets = [];

    this.skidmarks.forEach(s => {
      this.scene.remove(s);
      s.geometry.dispose();
    });
    this.skidmarks = [];
  }
}

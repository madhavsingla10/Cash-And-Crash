import * as THREE from 'three';
import { LondonCityBuilder } from './world/london/LondonCityBuilder';

class LondonShowcase {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private hemiLight!: THREE.HemisphereLight;
  private dirLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;

  // Camera Orbit & Navigation State
  private targetLookAt = new THREE.Vector3(0, 10, 0);
  private cameraDistance = 220;
  private cameraAzimuth = Math.PI / 4;
  private cameraElevation = Math.PI / 6;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private autoRotate = true;

  // Landmarks Data
  private landmarks: { [key: string]: { pos: THREE.Vector3; look: THREE.Vector3; dist: number } } = {
    overview: {
      pos: new THREE.Vector3(0, 180, 260),
      look: new THREE.Vector3(0, 10, 0),
      dist: 320
    },
    towerBridge: {
      pos: new THREE.Vector3(65, 45, 85),
      look: new THREE.Vector3(0, 15, 0),
      dist: 110
    },
    bigBen: {
      pos: new THREE.Vector3(-160, 50, -35),
      look: new THREE.Vector3(-220, 35, -95),
      dist: 100
    },
    londonEye: {
      pos: new THREE.Vector3(-110, 60, 130),
      look: new THREE.Vector3(-170, 45, 75),
      dist: 110
    },
    theShard: {
      pos: new THREE.Vector3(180, 80, 190),
      look: new THREE.Vector3(95, 55, 110),
      dist: 140
    },
    theGherkin: {
      pos: new THREE.Vector3(200, 60, -60),
      look: new THREE.Vector3(140, 40, -120),
      dist: 110
    },
    buckingham: {
      pos: new THREE.Vector3(-130, 45, -200),
      look: new THREE.Vector3(-200, 15, -270),
      dist: 120
    },
    piccadilly: {
      pos: new THREE.Vector3(-20, 35, -110),
      look: new THREE.Vector3(-70, 18, -160),
      dist: 90
    },
    busesCabs: {
      pos: new THREE.Vector3(10, 18, -25),
      look: new THREE.Vector3(-20, 4, -50),
      dist: 55
    }
  };

  constructor() {
    this.initScene();
    this.initLighting();
    this.initControls();
    this.setupUI();
    this.animate();
  }

  private initScene() {
    const container = document.getElementById('canvas-container')!;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x162032);
    this.scene.fog = new THREE.Fog(0x162032, 250, 1000);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.5, 2000);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Build Full London 3D Map
    LondonCityBuilder.buildLondonCity(this.scene);

    window.addEventListener('resize', () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    });
  }

  private initLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    this.dirLight.position.set(160, 240, 140);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 700;
    const d = 350;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    this.fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    this.fillLight.position.set(-140, 80, -120);
    this.scene.add(this.fillLight);
  }

  private setTimeOfDay(time: 'day' | 'sunset' | 'night') {
    if (time === 'day') {
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.Fog(0x87ceeb, 280, 1100);
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x444444);
      this.hemiLight.intensity = 1.4;
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 2.4;
      this.fillLight.color.setHex(0xa0c4ff);
    } else if (time === 'sunset') {
      this.scene.background = new THREE.Color(0x723d46);
      this.scene.fog = new THREE.Fog(0x723d46, 220, 900);
      this.hemiLight.color.setHex(0xffb703);
      this.hemiLight.groundColor.setHex(0x283618);
      this.hemiLight.intensity = 1.1;
      this.dirLight.color.setHex(0xfb8500);
      this.dirLight.intensity = 2.2;
      this.fillLight.color.setHex(0x9d4edd);
    } else {
      // Cyber Night / London Twilight
      this.scene.background = new THREE.Color(0x0f172a);
      this.scene.fog = new THREE.Fog(0x0f172a, 240, 950);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.9;
      this.dirLight.color.setHex(0x00f0ff);
      this.dirLight.intensity = 1.8;
      this.fillLight.color.setHex(0xff0077);
    }
  }

  private initControls() {
    window.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.autoRotate = false;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.cameraAzimuth -= dx * 0.005;
      this.cameraElevation = Math.max(0.08, Math.min(Math.PI / 2.1, this.cameraElevation + dy * 0.005));
      this.updateCameraPosition();
    });

    window.addEventListener('wheel', (e) => {
      this.cameraDistance = Math.max(25, Math.min(600, this.cameraDistance + e.deltaY * 0.25));
      this.updateCameraPosition();
    });
  }

  private updateCameraPosition() {
    const x = this.targetLookAt.x + this.cameraDistance * Math.sin(this.cameraAzimuth) * Math.cos(this.cameraElevation);
    const y = this.targetLookAt.y + this.cameraDistance * Math.sin(this.cameraElevation);
    const z = this.targetLookAt.z + this.cameraDistance * Math.cos(this.cameraAzimuth) * Math.cos(this.cameraElevation);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.targetLookAt);
  }

  public flyToLandmark(key: string) {
    const lm = this.landmarks[key];
    if (!lm) return;

    this.autoRotate = false;
    const startLook = this.targetLookAt.clone();
    const startDist = this.cameraDistance;
    const endLook = lm.look;
    const endDist = lm.dist;

    let progress = 0;
    const anim = () => {
      progress += 0.04;
      if (progress >= 1) {
        this.targetLookAt.copy(endLook);
        this.cameraDistance = endDist;
        this.updateCameraPosition();
        return;
      }

      this.targetLookAt.lerpVectors(startLook, endLook, THREE.MathUtils.smoothstep(progress, 0, 1));
      this.cameraDistance = THREE.MathUtils.lerp(startDist, endDist, THREE.MathUtils.smoothstep(progress, 0, 1));
      this.updateCameraPosition();
      requestAnimationFrame(anim);
    };
    anim();
  }

  private setupUI() {
    // Landmark Buttons
    document.querySelectorAll('.landmark-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.target!;
        this.flyToLandmark(target);

        document.querySelectorAll('.landmark-btn').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
      });
    });

    // Time of Day Buttons
    document.querySelectorAll('.time-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const time = (e.currentTarget as HTMLElement).dataset.time as 'day' | 'sunset' | 'night';
        this.setTimeOfDay(time);

        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
      });
    });

    // Auto Rotate Toggle
    const autoBtn = document.getElementById('auto-rotate-btn');
    autoBtn?.addEventListener('click', () => {
      this.autoRotate = !this.autoRotate;
      autoBtn.textContent = this.autoRotate ? '⏸️ PAUSE ROTATE' : '🔄 AUTO ROTATE';
    });
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    if (this.autoRotate) {
      this.cameraAzimuth += 0.002;
      this.updateCameraPosition();
    }

    this.renderer.render(this.scene, this.camera);
  };
}

new LondonShowcase();

import * as THREE from 'three';
import { PlayerCar } from './PlayerCar';
import { AudioSystem } from '../engine/AudioSystem';
import { ParticleManager } from '../effects/ParticleManager';
import { getDesertDuneHeight } from '../world/FarmlandBuilder';

export class MoneyBagsManager {
  public totalBagsTarget: number = 12;
  public collectedCount: number = 0;
  public totalCash: number = 0;
  public isExtractionReady: boolean = false;

  private scene: THREE.Scene;
  private player: PlayerCar;
  private audio: AudioSystem;
  private particles: ParticleManager;

  private allLocations: THREE.Vector3[] = [];
  private activeBagGroup: THREE.Group | null = null;
  public activeBagPosition: THREE.Vector3 | null = null;
  private extractionBeacon: THREE.Group | null = null;

  // Animated elements inside active loot
  private floatingDollarSign: THREE.Group | null = null;
  private groundRadarRing1: THREE.Mesh | null = null;
  private groundRadarRing2: THREE.Mesh | null = null;
  private skyBeaconMesh: THREE.Mesh | null = null;
  private lootPointLight: THREE.PointLight | null = null;

  private onCollectCallback?: (count: number, cash: number) => void;

  constructor(
    scene: THREE.Scene,
    player: PlayerCar,
    audio: AudioSystem,
    particles: ParticleManager,
    onCollect?: (count: number, cash: number) => void
  ) {
    this.scene = scene;
    this.player = player;
    this.audio = audio;
    this.particles = particles;
    this.onCollectCallback = onCollect;
  }

  public setupPickups(locations: THREE.Vector3[]) {
    this.clearAll();
    this.allLocations = [...locations];
    this.collectedCount = 0;
    this.totalCash = 0;
    this.isExtractionReady = false;

    // Spawn 1 active heist loot bag to start
    this.spawnNextBag();
  }

  private spawnNextBag() {
    this.clearActiveBag();

    if (this.collectedCount >= this.totalBagsTarget) {
      return;
    }

    // Pick a road location not too close to current player position (at least 40m away)
    const validLocs = this.allLocations.filter(loc => loc.distanceTo(this.player.position) > 40);
    const chosenLoc = validLocs.length > 0
      ? validLocs[Math.floor(Math.random() * validLocs.length)]
      : this.allLocations[Math.floor(Math.random() * this.allLocations.length)];

    this.activeBagPosition = chosenLoc.clone();
    const duneHeight = getDesertDuneHeight(chosenLoc.x, chosenLoc.z);
    this.activeBagPosition.y = Math.max(chosenLoc.y, duneHeight + 0.5);

    const group = new THREE.Group();

    // -------------------------------------------------------------
    // 1. TACTICAL HEIST DUFFEL BAG (Ballistic Nylon + Webbing + Hardware)
    // -------------------------------------------------------------
    const bagGroup = new THREE.Group();

    // Materials
    const duffelMat = new THREE.MeshStandardMaterial({
      color: 0x18241c, // Dark tactical army olive-slate
      roughness: 0.7,
      metalness: 0.15
    });
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8
    });
    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.9,
      roughness: 0.2
    });
    const zipperMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.8,
      roughness: 0.3
    });
    const cashGreenMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // Banknote emerald
      roughness: 0.6
    });
    const cashBandMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Gold currency strap
      metalness: 0.5,
      roughness: 0.4
    });
    const goldBarMat = new THREE.MeshStandardMaterial({
      color: 0xffc700, // 24K pure gold bullion
      metalness: 0.95,
      roughness: 0.15
    });

    // Main Duffel Barrel Body (horizontal capsule/cylinder)
    const duffelBodyGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.5, 16);
    duffelBodyGeo.rotateZ(Math.PI / 2);
    const duffelBody = new THREE.Mesh(duffelBodyGeo, duffelMat);
    duffelBody.castShadow = true;
    bagGroup.add(duffelBody);

    // End Caps (Rounded Hemispheres on ends of duffel)
    const capGeo = new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftCap = new THREE.Mesh(capGeo, duffelMat);
    leftCap.rotation.z = Math.PI / 2;
    leftCap.position.set(-0.75, 0, 0);
    bagGroup.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, duffelMat);
    rightCap.rotation.z = -Math.PI / 2;
    rightCap.position.set(0.75, 0, 0);
    bagGroup.add(rightCap);

    // Side Utility Pockets
    const pocketGeo = new THREE.BoxGeometry(0.65, 0.4, 0.22);
    const frontPocket = new THREE.Mesh(pocketGeo, duffelMat);
    frontPocket.position.set(0, -0.08, 0.54);
    bagGroup.add(frontPocket);

    const backPocket = new THREE.Mesh(pocketGeo, duffelMat);
    backPocket.position.set(0, -0.08, -0.54);
    bagGroup.add(backPocket);

    // Double Webbing Straps Wrapping Around Body
    [-0.38, 0.38].forEach(x => {
      const strapRing = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.045, 6, 20), strapMat);
      strapRing.rotation.y = Math.PI / 2;
      strapRing.position.set(x, 0, 0);
      bagGroup.add(strapRing);

      // Silver Metal D-Ring Buckles
      const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), buckleMat);
      buckle.position.set(x, 0.56, 0);
      bagGroup.add(buckle);
    });

    // Top Carry Handles Arch
    const handleGeo = new THREE.TorusGeometry(0.42, 0.05, 8, 18, Math.PI);
    const handleMesh = new THREE.Mesh(handleGeo, strapMat);
    handleMesh.position.set(0, 0.55, 0);
    bagGroup.add(handleMesh);

    // Top Zipper Flap (Partially Open)
    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.12), zipperMat);
    zipper.position.set(0, 0.52, 0);
    bagGroup.add(zipper);

    // -------------------------------------------------------------
    // 2. VISIBLE LOOT: STACKS OF CASH & 24K GOLD BULLION BARS
    // -------------------------------------------------------------
    // Cash Stacks (Bundles of $100s)
    const stackGeo = new THREE.BoxGeometry(0.38, 0.14, 0.22);
    const bandGeo = new THREE.BoxGeometry(0.12, 0.145, 0.225);

    const stackPositions = [
      new THREE.Vector3(-0.25, 0.48, 0.15),
      new THREE.Vector3(0.08, 0.52, 0.12),
      new THREE.Vector3(-0.05, 0.58, 0.02)
    ];

    stackPositions.forEach((pos, idx) => {
      const stack = new THREE.Mesh(stackGeo, cashGreenMat);
      stack.rotation.y = (idx - 1) * 0.25;
      stack.position.copy(pos);
      bagGroup.add(stack);

      const band = new THREE.Mesh(bandGeo, cashBandMat);
      band.rotation.y = (idx - 1) * 0.25;
      band.position.copy(pos);
      bagGroup.add(band);
    });

    // Gold Bullion Bars
    const goldBarGeo = new THREE.BoxGeometry(0.34, 0.1, 0.16);
    const goldBar1 = new THREE.Mesh(goldBarGeo, goldBarMat);
    goldBar1.position.set(0.24, 0.48, -0.12);
    goldBar1.rotation.y = 0.4;
    goldBar1.castShadow = true;
    bagGroup.add(goldBar1);

    const goldBar2 = new THREE.Mesh(goldBarGeo, goldBarMat);
    goldBar2.position.set(0.18, 0.58, -0.10);
    goldBar2.rotation.y = 0.15;
    goldBar2.castShadow = true;
    bagGroup.add(goldBar2);

    // Enlarge the bag group
    bagGroup.scale.set(1.55, 1.55, 1.55);
    bagGroup.position.set(0, 0.85, 0);
    group.add(bagGroup);

    // -------------------------------------------------------------
    // 3. ENLARGED SCULPTED 3D GOLDEN DOLLAR EMBLEM ($)
    // -------------------------------------------------------------
    const dollarGroup = new THREE.Group();
    const dollarSignMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa500,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.95
    });

    // Elegant Sculpted S-Shape for Dollar Sign
    const sShape = new THREE.Shape();
    // Top hook
    sShape.moveTo(-0.32, 0.65);
    sShape.lineTo(0.32, 0.65);
    sShape.lineTo(0.32, 0.28);
    sShape.lineTo(-0.12, 0.18);
    sShape.lineTo(-0.12, -0.18);
    sShape.lineTo(0.32, -0.18);
    sShape.lineTo(0.32, -0.65);
    sShape.lineTo(-0.32, -0.65);
    sShape.lineTo(-0.32, -0.28);
    sShape.lineTo(0.12, -0.18);
    sShape.lineTo(0.12, 0.18);
    sShape.lineTo(-0.32, 0.18);
    sShape.closePath();

    const dollarExtrude: THREE.ExtrudeGeometryOptions = {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05
    };

    const dollarGeo = new THREE.ExtrudeGeometry(sShape, dollarExtrude);
    dollarGeo.center();
    const dollarMesh = new THREE.Mesh(dollarGeo, dollarSignMat);
    dollarMesh.castShadow = true;
    dollarGroup.add(dollarMesh);

    // Two Thick Polished Gold Spine Columns Through Center
    const spineGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.7, 12);
    const spine1 = new THREE.Mesh(spineGeo, dollarSignMat);
    spine1.position.set(-0.10, 0, 0);
    spine1.castShadow = true;
    dollarGroup.add(spine1);

    const spine2 = new THREE.Mesh(spineGeo, dollarSignMat);
    spine2.position.set(0.10, 0, 0);
    spine2.castShadow = true;
    dollarGroup.add(spine2);

    // Dual Glowing Holographic Energy Halos
    const haloMat1 = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.85
    });
    const halo1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 8, 32), haloMat1);
    halo1.rotation.x = Math.PI / 2;
    dollarGroup.add(halo1);

    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.7
    });
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.035, 6, 24), haloMat2);
    halo2.rotation.x = Math.PI / 2.3;
    dollarGroup.add(halo2);

    // Floating Star Sparkles on corners
    const starGeo = new THREE.OctahedronGeometry(0.12, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [[-0.45, 0.7, 0], [0.45, -0.7, 0], [0, 0.95, 0]].forEach(pos => {
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(pos[0], pos[1], pos[2]);
      dollarGroup.add(star);
    });

    dollarGroup.scale.set(1.35, 1.35, 1.35);
    dollarGroup.position.set(0, 2.5, 0);
    group.add(dollarGroup);
    this.floatingDollarSign = dollarGroup;

    // -------------------------------------------------------------
    // 4. VOLUMETRIC SKY BEACON & GROUND RADAR RINGS
    // -------------------------------------------------------------
    // Main Light Pillar
    const beaconGeo = new THREE.CylinderGeometry(0.25, 0.45, 90, 12);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 45, 0);
    group.add(beacon);
    this.skyBeaconMesh = beacon;

    // Outer Ground Radar Ring (Rotating with tick segments)
    const radarGeo1 = new THREE.RingGeometry(1.6, 1.95, 32);
    const radarMat1 = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const radarRing1 = new THREE.Mesh(radarGeo1, radarMat1);
    radarRing1.rotation.x = -Math.PI / 2;
    radarRing1.position.y = 0.04;
    group.add(radarRing1);
    this.groundRadarRing1 = radarRing1;

    // Inner Concentric Pulse Ring
    const radarGeo2 = new THREE.RingGeometry(0.9, 1.15, 24);
    const radarMat2 = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const radarRing2 = new THREE.Mesh(radarGeo2, radarMat2);
    radarRing2.rotation.x = -Math.PI / 2;
    radarRing2.position.y = 0.05;
    group.add(radarRing2);
    this.groundRadarRing2 = radarRing2;

    // Local Point Light illuminating ground & vehicles
    const pointLight = new THREE.PointLight(0x00ff88, 3.2, 12);
    pointLight.position.set(0, 1.5, 0);
    group.add(pointLight);
    this.lootPointLight = pointLight;

    group.position.copy(this.activeBagPosition);
    this.scene.add(group);
    this.activeBagGroup = group;
  }

  public activateExtractionBeacon(pos: THREE.Vector3) {
    this.isExtractionReady = true;
    this.clearActiveBag();

    const extGroup = new THREE.Group();

    // High-power Extraction Laser Column
    const extGeo = new THREE.CylinderGeometry(4.0, 4.0, 120, 16);
    const extMat = new THREE.MeshBasicMaterial({
      color: 0x00ffee,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const colMesh = new THREE.Mesh(extGeo, extMat);
    colMesh.position.set(0, 60, 0);
    extGroup.add(colMesh);

    // Extraction Helipad Landing Pulse Ring
    const padRingGeo = new THREE.RingGeometry(5.5, 7.5, 32);
    const padRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const padRing = new THREE.Mesh(padRingGeo, padRingMat);
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.y = 0.1;
    extGroup.add(padRing);

    // Point Light
    const extLight = new THREE.PointLight(0x00ffee, 4.5, 25);
    extLight.position.set(0, 3, 0);
    extGroup.add(extLight);

    extGroup.position.set(pos.x, 0, pos.z);
    this.scene.add(extGroup);
    this.extractionBeacon = extGroup;
    this.audio.playAlertSound();
  }

  public update(dt: number) {
    const time = performance.now() * 0.003;

    // Animate the 1 active money bag
    if (this.activeBagGroup && this.activeBagPosition) {
      // Smooth levitating hover and bob
      const hoverOffset = Math.sin(time * 3.5) * 0.18;
      this.activeBagGroup.position.y = this.activeBagPosition.y + hoverOffset;

      // Slow rotation for the duffel bag
      this.activeBagGroup.rotation.y += 1.6 * dt;

      // Fast counter-rotation for floating 3D dollar symbol
      if (this.floatingDollarSign) {
        this.floatingDollarSign.rotation.y -= 3.2 * dt;
        this.floatingDollarSign.position.y = 2.5 + Math.sin(time * 5.0) * 0.15;
      }

      // Counter-rotating ground radar rings
      if (this.groundRadarRing1) {
        this.groundRadarRing1.rotation.z += 2.0 * dt;
      }
      if (this.groundRadarRing2) {
        this.groundRadarRing2.rotation.z -= 3.0 * dt;
        const ringScale = 1.0 + Math.sin(time * 4.0) * 0.15;
        this.groundRadarRing2.scale.set(ringScale, ringScale, 1.0);
      }

      // Sky Beacon Glow Pulsing
      if (this.skyBeaconMesh) {
        (this.skyBeaconMesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 6.0) * 0.18;
      }
      if (this.lootPointLight) {
        this.lootPointLight.intensity = 3.2 + Math.sin(time * 6.0) * 1.2;
      }

      // Check distance to player for collection (2.5D distance with generous vertical tolerance for dunes)
      const dx = this.player.position.x - this.activeBagPosition.x;
      const dz = this.player.position.z - this.activeBagPosition.z;
      const dy = Math.abs(this.player.position.y - this.activeBagPosition.y);
      const horizDist = Math.hypot(dx, dz);

      if (horizDist < 5.8 && dy < 6.0) {
        this.collectCurrentBag();
      }
    }

    // Pulse extraction beacon
    if (this.extractionBeacon) {
      this.extractionBeacon.rotation.y += 1.2 * dt;
    }
  }

  private collectCurrentBag() {
    if (!this.activeBagPosition) return;

    this.collectedCount++;
    this.totalCash += 10000;

    // VFX & Audio
    this.particles.emitSparks(this.activeBagPosition, 30);
    this.audio.playCashPickup();
    this.player.repairAndBoost(15, 45);

    if (this.onCollectCallback) {
      this.onCollectCallback(this.collectedCount, this.totalCash);
    }

    // Spawn NEXT single money bag
    if (!this.isExtractionReady) {
      this.spawnNextBag();
    }
  }

  public getNearestTarget(playerPos: THREE.Vector3, extractionPos: THREE.Vector3): { pos: THREE.Vector3; isExtraction: boolean; distance: number } | null {
    if (this.isExtractionReady) {
      return {
        pos: extractionPos,
        isExtraction: true,
        distance: Math.round(playerPos.distanceTo(extractionPos))
      };
    }

    if (this.activeBagPosition) {
      return {
        pos: this.activeBagPosition,
        isExtraction: false,
        distance: Math.round(playerPos.distanceTo(this.activeBagPosition))
      };
    }

    return null;
  }

  private clearActiveBag() {
    if (this.activeBagGroup) {
      this.scene.remove(this.activeBagGroup);
      this.activeBagGroup = null;
      this.activeBagPosition = null;
      this.floatingDollarSign = null;
      this.groundRadarRing1 = null;
      this.groundRadarRing2 = null;
      this.skyBeaconMesh = null;
      this.lootPointLight = null;
    }
  }

  public clearAll() {
    this.clearActiveBag();

    if (this.extractionBeacon) {
      this.scene.remove(this.extractionBeacon);
      this.extractionBeacon = null;
    }
  }
}

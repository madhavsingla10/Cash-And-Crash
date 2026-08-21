import * as THREE from 'three';
import { PlayerCar } from './PlayerCar';
import { AudioSystem } from '../engine/AudioSystem';
import { ParticleManager } from '../effects/ParticleManager';

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
  private extractionBeacon: THREE.Mesh | null = null;

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

    // Spawn ONLY 1 active money bag to begin with!
    this.spawnNextBag();
  }

  private spawnNextBag() {
    if (this.activeBagGroup) {
      this.scene.remove(this.activeBagGroup);
      this.activeBagGroup = null;
      this.activeBagPosition = null;
    }

    if (this.collectedCount >= this.totalBagsTarget) {
      // All bags collected!
      return;
    }

    // Pick a road location not too close to the current player position (at least 35m away)
    const validLocs = this.allLocations.filter(loc => loc.distanceTo(this.player.position) > 35);
    const chosenLoc = validLocs.length > 0
      ? validLocs[Math.floor(Math.random() * validLocs.length)]
      : this.allLocations[Math.floor(Math.random() * this.allLocations.length)];

    this.activeBagPosition = chosenLoc.clone();

    // Create 3D Glowing Money Bag Mesh
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x006622,
      roughness: 0.2,
      metalness: 0.6
    });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const dollarMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    const group = new THREE.Group();

    // Duffel Bag Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 10), bagMat);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    group.add(body);

    // Duffel Strap Handle
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 6, 14), strapMat);
    strap.position.y = 0.6;
    group.add(strap);

    // Glowing Dollar Sign Emblem
    const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), dollarMat);
    emblem.position.set(0, 0, 0.72);
    group.add(emblem);

    // Sky Beam Beacon
    const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 80, 8);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.45
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 40, 0);
    group.add(beacon);

    // Pulsing floor ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.7;
    group.add(ring);

    group.position.copy(this.activeBagPosition);
    this.scene.add(group);
    this.activeBagGroup = group;
  }

  public activateExtractionBeacon(pos: THREE.Vector3) {
    this.isExtractionReady = true;

    // Remove remaining money bag
    if (this.activeBagGroup) {
      this.scene.remove(this.activeBagGroup);
      this.activeBagGroup = null;
      this.activeBagPosition = null;
    }

    const extGeo = new THREE.CylinderGeometry(4.0, 4.0, 100, 16);
    const extMat = new THREE.MeshBasicMaterial({
      color: 0x00ffee,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.extractionBeacon = new THREE.Mesh(extGeo, extMat);
    this.extractionBeacon.position.set(pos.x, 50, pos.z);
    this.scene.add(this.extractionBeacon);
    this.audio.playAlertSound();
  }

  public update(dt: number) {
    const time = performance.now() * 0.003;

    // Animate the 1 active money bag
    if (this.activeBagGroup && this.activeBagPosition) {
      this.activeBagGroup.rotation.y += 2.8 * dt;
      this.activeBagGroup.position.y = this.activeBagPosition.y + Math.sin(time * 4) * 0.3;

      // Check distance to player
      const dist = this.player.position.distanceTo(this.activeBagPosition);
      if (dist < 3.4) {
        this.collectCurrentBag();
      }
    }

    // Pulse extraction beacon
    if (this.extractionBeacon) {
      this.extractionBeacon.rotation.y += 1.2 * dt;
      const pulse = 0.35 + Math.sin(time * 4) * 0.18;
      (this.extractionBeacon.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  }

  private collectCurrentBag() {
    if (!this.activeBagPosition) return;

    this.collectedCount++;
    this.totalCash += 10000;

    // VFX & Audio
    this.particles.emitSparks(this.activeBagPosition, 25);
    this.audio.playCashPickup();
    this.player.repairAndBoost(12, 40);

    if (this.onCollectCallback) {
      this.onCollectCallback(this.collectedCount, this.totalCash);
    }

    // Spawn NEXT single money bag!
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

  public clearAll() {
    if (this.activeBagGroup) {
      this.scene.remove(this.activeBagGroup);
      this.activeBagGroup = null;
      this.activeBagPosition = null;
    }

    if (this.extractionBeacon) {
      this.scene.remove(this.extractionBeacon);
      this.extractionBeacon = null;
    }
  }
}

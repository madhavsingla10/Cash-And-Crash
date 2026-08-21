import * as THREE from 'three';
import { CarBuilder, CarMeshes } from './CarBuilder';
import { PlayerCar } from './PlayerCar';
import { ParticleManager } from '../effects/ParticleManager';
import { AudioSystem } from '../engine/AudioSystem';
import { CityData } from '../world/CityBuilder';
import { getDesertDuneHeight } from '../world/FarmlandBuilder';

export type PoliceType = 'cruiser' | 'interceptor' | 'swat' | 'chopper';

export interface PoliceUnit {
  type: PoliceType;
  meshes: CarMeshes;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  heading: number;
  speed: number;
  maxSpeed: number;
  turnRate: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  fellInWater: boolean;
  lightTimer: number;
  fireTimer: number;
  isCharging: boolean;
  chargeTimer: number;
  wallHits: number; // Counts moderate wall strikes (destroys at 2)
  stunTimer: number; // Brief recovery after hitting player
}

export interface ChopperUnit {
  root: THREE.Group;
  mainRotor: THREE.Mesh;
  tailRotor: THREE.Mesh;
  spotlight: THREE.SpotLight;
  position: THREE.Vector3;
  isAlive: boolean;
}

export class PoliceSquad {
  public units: PoliceUnit[] = [];
  public chopper: ChopperUnit | null = null;
  public wantedLevel: number = 0;
  public copsWrecked: number = 0;

  private scene: THREE.Scene;
  private player: PlayerCar;
  private particles: ParticleManager;
  private audio: AudioSystem;
  private cityData: CityData;

  private spawnCooldown: number = 0;
  private onTakedownCallback?: (title: string, cashBonus: number) => void;
  private onPlayerHitCallback?: (damage: number) => void;

  constructor(
    scene: THREE.Scene,
    player: PlayerCar,
    particles: ParticleManager,
    audio: AudioSystem,
    cityData: CityData,
    onTakedown?: (title: string, cashBonus: number) => void,
    onPlayerHit?: (damage: number) => void
  ) {
    this.scene = scene;
    this.player = player;
    this.particles = particles;
    this.audio = audio;
    this.cityData = cityData;
    this.onTakedownCallback = onTakedown;
    this.onPlayerHitCallback = onPlayerHit;
  }

  public setWantedLevel(level: number) {
    const oldLevel = this.wantedLevel;
    this.wantedLevel = Math.max(0, Math.min(5, level));

    if (this.wantedLevel > oldLevel) {
      this.audio.playAlertSound();
      this.audio.startSiren();

      if (this.wantedLevel >= 5 && !this.chopper) {
        this.spawnChopper();
      }
    } else if (this.wantedLevel === 0) {
      this.audio.stopSiren();
    }
  }

  public spawnUnit(type: PoliceType) {
    const validSpawns = this.cityData.spawnPoints.filter(sp => {
      return sp.distanceTo(this.player.position) > 40;
    });

    const spawnPos = (validSpawns.length > 0
      ? validSpawns[Math.floor(Math.random() * validSpawns.length)]
      : new THREE.Vector3(96, 0.05, -96)).clone();
    spawnPos.y = 0.05;

    let meshes: CarMeshes;
    let maxSpeed = 34;
    let turnRate = 2.4;
    let maxHealth = 100;

    if (type === 'swat') {
      meshes = CarBuilder.createSwatVan();
      maxSpeed = 28;
      turnRate = 1.6;
      maxHealth = 200;
    } else if (type === 'interceptor') {
      meshes = CarBuilder.createPoliceCruiser();
      maxSpeed = 44;
      turnRate = 2.8;
      maxHealth = 80;
    } else {
      meshes = CarBuilder.createPoliceCruiser();
      maxSpeed = 34;
      turnRate = 2.4;
      maxHealth = 100;
    }

    this.scene.add(meshes.root);

    const angleToPlayer = Math.atan2(
      -(this.player.position.x - spawnPos.x),
      -(this.player.position.z - spawnPos.z)
    );

    this.units.push({
      type,
      meshes,
      position: spawnPos,
      velocity: new THREE.Vector3(),
      heading: angleToPlayer,
      speed: 18,
      maxSpeed,
      turnRate,
      health: maxHealth,
      maxHealth,
      isAlive: true,
      fellInWater: false,
      lightTimer: Math.random(),
      fireTimer: 1.5 + Math.random() * 2,
      isCharging: false,
      chargeTimer: 0,
      wallHits: 0,
      stunTimer: 0
    });
  }

  private spawnChopper() {
    const heliData = CarBuilder.createHelicopter();
    const heliPos = new THREE.Vector3(this.player.position.x + 30, 22, this.player.position.z + 30);
    heliData.root.position.copy(heliPos);
    this.scene.add(heliData.root);
    this.chopper = { ...heliData, position: heliPos, isAlive: true };
  }

  private rayIntersectsBuilding(origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): boolean {
    const p2 = origin.clone().addScaledVector(dir, maxDist);
    const minRayX = Math.min(origin.x, p2.x);
    const maxRayX = Math.max(origin.x, p2.x);
    const minRayZ = Math.min(origin.z, p2.z);
    const maxRayZ = Math.max(origin.z, p2.z);

    for (let col of this.cityData.colliders) {
      if (col.type !== 'building') continue;
      const b = col.box;
      if (maxRayX < b.min.x || minRayX > b.max.x || maxRayZ < b.min.z || minRayZ > b.max.z) continue;

      const clampedX = Math.max(b.min.x, Math.min(p2.x, b.max.x));
      const clampedZ = Math.max(b.min.z, Math.min(p2.z, b.max.z));
      const distSq = (p2.x - clampedX) ** 2 + (p2.z - clampedZ) ** 2;
      if (distSq < 2.0 * 2.0) return true;
    }
    return false;
  }

  public update(dt: number) {
    // When 0 Wanted Stars (no theft yet), NO police spawn or chase the player!
    if (this.wantedLevel === 0) {
      if (this.units.length > 0) {
        for (let u of this.units) {
          this.scene.remove(u.meshes.root);
        }
        this.units = [];
      }
      return;
    }

    const targetSquadSize = this.wantedLevel === 1 ? 4
      : this.wantedLevel === 2 ? 5
      : this.wantedLevel === 3 ? 7
      : this.wantedLevel === 4 ? 9
      : 11;

    const baseCooldown = this.wantedLevel === 1 ? 1.8
      : this.wantedLevel === 2 ? 1.5
      : this.wantedLevel === 3 ? 1.3
      : this.wantedLevel === 4 ? 1.0
      : 0.8;

    this.spawnCooldown -= dt;
    if (this.units.length < targetSquadSize && this.spawnCooldown <= 0) {
      this.spawnCooldown = baseCooldown;

      let typeToSpawn: PoliceType = 'cruiser';
      if (this.wantedLevel === 5) {
        // Level 5: Heavy SWAT Vans dominate (75%), Interceptors (25%)
        typeToSpawn = Math.random() < 0.75 ? 'swat' : 'interceptor';
      } else if (this.wantedLevel === 4) {
        // Level 4: Increased SWAT Van frequency (55%), Interceptors (30%), Cruisers (15%)
        const r = Math.random();
        typeToSpawn = r < 0.55 ? 'swat' : (r < 0.85 ? 'interceptor' : 'cruiser');
      } else if (this.wantedLevel === 3) {
        // Level 3: Introduce SWAT Vans (35%), Interceptors (35%), Cruisers (30%)
        const r = Math.random();
        typeToSpawn = r < 0.35 ? 'swat' : (r < 0.70 ? 'interceptor' : 'cruiser');
      } else if (this.wantedLevel === 2) {
        // Level 2: Interceptors (40%), Cruisers (60%)
        typeToSpawn = Math.random() < 0.40 ? 'interceptor' : 'cruiser';
      } else {
        // Level 1: Cruisers (Pack of 4 actively deployed)
        typeToSpawn = 'cruiser';
      }

      this.spawnUnit(typeToSpawn);
    }

    // Update Chopper
    if (this.chopper && this.chopper.isAlive) {
      this.chopper.mainRotor.rotation.y += 28 * dt;
      this.chopper.tailRotor.rotation.x += 35 * dt;

      const targetHeliPos = new THREE.Vector3(
        this.player.position.x,
        24,
        this.player.position.z
      );
      this.chopper.position.lerp(targetHeliPos, 1.8 * dt);
      this.chopper.root.position.copy(this.chopper.position);

      this.chopper.spotlight.target.position.copy(this.player.position);
      this.chopper.spotlight.target.updateMatrixWorld();
    }

    // Update Police Ground Units
    for (let i = this.units.length - 1; i >= 0; i--) {
      const cop = this.units[i];
      if (!cop.isAlive) continue;

      // 1. Siren Lights
      cop.lightTimer += dt * 8;
      const isRedOn = Math.sin(cop.lightTimer) > 0;
      if (cop.meshes.redLight && cop.meshes.blueLight) {
        (cop.meshes.redLight.material as THREE.MeshBasicMaterial).color.setHex(isRedOn ? 0xff0022 : 0x220000);
        (cop.meshes.blueLight.material as THREE.MeshBasicMaterial).color.setHex(!isRedOn ? 0x0088ff : 0x001133);
      }

      // Handle hit stun
      if (cop.stunTimer > 0) {
        cop.stunTimer -= dt;
      }

      // 2. AI Steering
      const distToPlayer = cop.position.distanceTo(this.player.position);
      const toPlayer = this.player.position.clone().sub(cop.position);
      const angleToPlayer = Math.atan2(-toPlayer.x, -toPlayer.z);

      let angleDiffToPlayer = angleToPlayer - cop.heading;
      while (angleDiffToPlayer > Math.PI) angleDiffToPlayer -= Math.PI * 2;
      while (angleDiffToPlayer < -Math.PI) angleDiffToPlayer += Math.PI * 2;

      // Ramming Charge Mode when lined up
      if (distToPlayer < 28 && Math.abs(angleDiffToPlayer) < 0.45 && cop.stunTimer <= 0) {
        cop.isCharging = true;
        cop.chargeTimer = 1.8;
      }

      if (cop.chargeTimer > 0) {
        cop.chargeTimer -= dt;
        if (cop.chargeTimer <= 0) cop.isCharging = false;
      }

      // Intercept Target Angle
      const leadTime = Math.min(1.2, distToPlayer / 35);
      const targetPos = this.player.position.clone().addScaledVector(this.player.velocity, leadTime);
      const toTarget = targetPos.clone().sub(cop.position);
      const desiredAngle = Math.atan2(-toTarget.x, -toTarget.z);

      let targetSteerAngle = desiredAngle;

      // Whisker Avoidance
      if (!cop.isCharging) {
        const centerDir = new THREE.Vector3(-Math.sin(cop.heading), 0, -Math.cos(cop.heading));
        const leftDir = new THREE.Vector3(-Math.sin(cop.heading + 0.45), 0, -Math.cos(cop.heading + 0.45));
        const rightDir = new THREE.Vector3(-Math.sin(cop.heading - 0.45), 0, -Math.cos(cop.heading - 0.45));

        const hitCenter = this.rayIntersectsBuilding(cop.position, centerDir, 16);
        const hitLeft = this.rayIntersectsBuilding(cop.position, leftDir, 12);
        const hitRight = this.rayIntersectsBuilding(cop.position, rightDir, 12);

        if (hitCenter) {
          if (hitLeft && !hitRight) {
            targetSteerAngle = cop.heading - 1.2;
          } else if (hitRight && !hitLeft) {
            targetSteerAngle = cop.heading + 1.2;
          } else {
            targetSteerAngle = cop.heading + (angleDiffToPlayer > 0 ? 1.0 : -1.0);
          }
        } else if (hitLeft) {
          targetSteerAngle = cop.heading - 0.7;
        } else if (hitRight) {
          targetSteerAngle = cop.heading + 0.7;
        }
      }

      let angleDiff = targetSteerAngle - cop.heading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const currentTurnRate = cop.isCharging ? cop.turnRate * 0.4 : cop.turnRate;
      cop.heading += Math.sign(angleDiff) * Math.min(currentTurnRate * dt, Math.abs(angleDiff));

      // Acceleration
      if (cop.stunTimer <= 0) {
        const topSpeed = cop.isCharging ? cop.maxSpeed * 1.15 : cop.maxSpeed;
        cop.speed = Math.min(topSpeed, cop.speed + (cop.isCharging ? 30 : 20) * dt);
      }

      const forward = new THREE.Vector3(-Math.sin(cop.heading), 0, -Math.cos(cop.heading));
      cop.velocity = forward.clone().multiplyScalar(cop.speed);

      cop.position.x += cop.velocity.x * dt;
      cop.position.z += cop.velocity.z * dt;

      // 3. SWAT Turret Gunner
      if (cop.type === 'swat' && cop.meshes.turret && cop.meshes.muzzle) {
        const muzzleWorld = new THREE.Vector3();
        cop.meshes.muzzle.getWorldPosition(muzzleWorld);
        cop.meshes.turret.lookAt(this.player.position.x, muzzleWorld.y, this.player.position.z);

        cop.fireTimer -= dt;
        if (cop.fireTimer <= 0) {
          if (distToPlayer < 45 && distToPlayer > 5) {
            cop.fireTimer = 2.2 + Math.random() * 1.5;
            this.particles.fireBullet(muzzleWorld, this.player.position);
            this.audio.playGunshot();

            if (Math.random() > 0.45) {
              this.player.takeDamage(10);
              this.particles.emitSparks(this.player.position, 6);
            }
          }
        }
      }

      // 4. Physical Collision with Player (SOLID STRIKE - COP DOES NOT BURN ON PLAYER HIT!)
      if (distToPlayer < 3.3) {
        const relativeSpeed = Math.max(15, cop.velocity.distanceTo(this.player.velocity));
        const playerDamage = Math.max(10, Math.round(relativeSpeed * 0.65));

        // Damage player, emit heavy sparks and play solid crash impact sound
        this.player.takeDamage(playerDamage);
        this.particles.emitSparks(cop.position, 22);
        this.audio.playCrashExplosion(false);

        // Solid push direction on horizontal XZ plane
        const pushDir = new THREE.Vector3(
          this.player.position.x - cop.position.x,
          0,
          this.player.position.z - cop.position.z
        );
        if (pushDir.lengthSq() > 0.0001) {
          pushDir.normalize();
        } else {
          pushDir.set(1, 0, 0);
        }

        // 1. Separate overlapping car hulls solidly (no clipping through each other)
        const overlap = Math.max(0.4, 3.4 - distToPlayer);
        this.player.position.addScaledVector(pushDir, overlap * 0.65);
        cop.position.addScaledVector(pushDir, -overlap * 0.65);

        // 2. Momentum transfer along player driving axis (moves forward/backward as per collision)
        const playerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.heading);
        const forwardStrikeDot = pushDir.dot(playerForward);

        if (forwardStrikeDot > 0.3) {
          // Rear-ended: Solid shove forward
          this.player.speed = Math.max(this.player.speed + 10, cop.speed * 0.85);
        } else if (forwardStrikeDot < -0.3) {
          // Head-on strike: Solid deceleration and backward knock
          this.player.speed = -Math.abs(this.player.speed) * 0.4 - 8.0;
        } else {
          // T-bone / Flank strike: reduce speed and push laterally
          this.player.speed *= 0.6;
        }

        // 3. Cop solid rebound and stun (COP NEVER BURNS/DIES FROM HITTING PLAYER)
        cop.speed = -cop.speed * 0.45 - 6.0;
        cop.stunTimer = 0.45;
        cop.isCharging = false;

        if (this.onPlayerHitCallback) {
          this.onPlayerHitCallback(playerDamage);
        }
      }

      // 5. Cross Collision with other Police Cars
      for (let j = i - 1; j >= 0; j--) {
        const otherCop = this.units[j];
        if (!otherCop.isAlive) continue;

        const distBetween = cop.position.distanceTo(otherCop.position);
        if (distBetween < 3.2) {
          this.particles.createExplosion(cop.position, true);
          this.audio.playCrashExplosion(true);

          cop.wallHits += 2;
          otherCop.wallHits += 2;

          this.destroyCop(cop, i, '🚨 DOUBLE COP PILEUP!', 1000);
          this.destroyCop(otherCop, j, '💥 MULTI-COP CRASH!', 1000);
          break;
        }
      }

      // 6. Building Wall Collision & DESTRUCTION RULES:
      // - High speed strike (> 24) = 1 strike destruction / burn
      // - Moderate speed strike (> 12) = 2 strikes destruction / burn
      const copRadius = 1.6;
      let copDestroyed = false;

      for (let col of this.cityData.colliders) {
        if (col.type !== 'building') continue;
        const b = col.box;

        const clampedX = Math.max(b.min.x, Math.min(cop.position.x, b.max.x));
        const clampedZ = Math.max(b.min.z, Math.min(cop.position.z, b.max.z));

        const dx = cop.position.x - clampedX;
        const dz = cop.position.z - clampedZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < copRadius * copRadius) {
          let nx = 0;
          let nz = 0;

          if (distSq < 0.0001) {
            const dMinX = Math.abs(cop.position.x - b.min.x);
            const dMaxX = Math.abs(cop.position.x - b.max.x);
            const dMinZ = Math.abs(cop.position.z - b.min.z);
            const dMaxZ = Math.abs(cop.position.z - b.max.z);
            const minD = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);

            if (minD === dMinX) { nx = -1; cop.position.x = b.min.x - copRadius - 0.05; }
            else if (minD === dMaxX) { nx = 1; cop.position.x = b.max.x + copRadius + 0.05; }
            else if (minD === dMinZ) { nz = -1; cop.position.z = b.min.z - copRadius - 0.05; }
            else { nz = 1; cop.position.z = b.max.z + copRadius + 0.05; }
          } else {
            const dist = Math.sqrt(distSq);
            nx = dx / dist;
            nz = dz / dist;
            const penetration = copRadius - dist;
            cop.position.x += nx * penetration;
            cop.position.z += nz * penetration;
          }
          cop.position.y = 0.5;

          const impactSpeed = Math.abs(cop.speed);

          // 1-strike destruction on high speed ram (> 24 units/s or charging)
          if (impactSpeed >= 24 || cop.isCharging) {
            this.destroyCop(cop, i, '🏢 HIGH-SPEED WALL SMASH!', 1000);
            copDestroyed = true;
            break;
          } else if (impactSpeed >= 12) {
            // Moderate strike: increment wallHits
            cop.wallHits++;
            this.particles.emitSparks(cop.position, 14);
            this.audio.playCrashExplosion(false);

            if (cop.wallHits >= 2) {
              // Destroyed on 2nd strike!
              this.destroyCop(cop, i, '🏢 COP WRECKED ON 2ND WALL HIT!', 800);
              copDestroyed = true;
              break;
            } else {
              // 1st moderate strike: bounce back & slide
              cop.speed *= -0.4;
              cop.stunTimer = 0.3;
            }
          } else {
            // Low speed brush: slide along wall normal
            const dot = cop.velocity.x * nx + cop.velocity.z * nz;
            if (dot < 0) {
              cop.velocity.x -= dot * nx;
              cop.velocity.z -= dot * nz;
            }
            cop.speed = Math.max(8, cop.speed * 0.7);
          }
        }
      }

      if (copDestroyed) continue;

      // 7. Cliff Drop / Water Fall (Exempting Ocean Boardwalk Pier)
      const onOceanPier = cop.position.x >= -355 && cop.position.x <= -255 && Math.abs(cop.position.z - 180) <= 6.8;
      if (
        (cop.position.x < this.cityData.cityBounds.minX ||
        cop.position.x > this.cityData.cityBounds.maxX ||
        cop.position.z < this.cityData.cityBounds.minZ ||
        cop.position.z > this.cityData.cityBounds.maxZ) &&
        !onOceanPier
      ) {
        this.particles.emitWaterSplash(cop.position);
        this.destroyCop(cop, i, '🌊 COP FLEW OFF CLIFF INTO OCEAN!', 1500);
        continue;
      }

      // Update Mesh Transform & Desert Dune / Pier Elevation (Firmly planted on land)
      let copGroundY = 0.05;
      if (cop.position.x >= 50 && cop.position.z <= -50) {
        copGroundY = 0.05 + getDesertDuneHeight(cop.position.x, cop.position.z);
      } else if (onOceanPier) {
        copGroundY = 0.40;
      }
      cop.position.y = copGroundY;

      cop.meshes.root.position.copy(cop.position);
      cop.meshes.root.rotation.y = cop.heading;

      for (let w of cop.meshes.wheels) {
        w.rotation.x += (cop.speed / 0.42) * dt;
      }
    }
  }

  private destroyCop(cop: PoliceUnit, index: number, takedownTitle: string, cashReward: number) {
    cop.isAlive = false;
    this.copsWrecked++;
    this.particles.createExplosion(cop.position, true);
    this.audio.playCrashExplosion(true);

    this.scene.remove(cop.meshes.root);
    this.units.splice(index, 1);

    this.player.repairAndBoost(15, 45);

    if (this.onTakedownCallback) {
      this.onTakedownCallback(takedownTitle, cashReward);
    }
  }

  public reset() {
    for (let u of this.units) {
      this.scene.remove(u.meshes.root);
    }
    this.units = [];

    if (this.chopper) {
      this.scene.remove(this.chopper.root);
      this.chopper = null;
    }

    this.wantedLevel = 0;
    this.copsWrecked = 0;
    this.spawnCooldown = 0;
    this.audio.stopSiren();
  }
}

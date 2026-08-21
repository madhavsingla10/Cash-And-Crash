import * as THREE from 'three';
import { CarMeshes } from './CarBuilder';
import { InputManager } from '../engine/InputManager';
import { AudioSystem } from '../engine/AudioSystem';
import { ParticleManager } from '../effects/ParticleManager';
import { CityData } from '../world/CityBuilder';
import { getDesertDuneHeight } from '../world/FarmlandBuilder';
import { VEHICLE_CATALOG, VehicleInfo, getVehicleById } from './VehicleCatalog';

export class PlayerCar {
  public meshes: CarMeshes;
  public position: THREE.Vector3 = new THREE.Vector3(32, 0.4, 32);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public heading: number = 0; // Rotation around Y in radians
  public speed: number = 0; // Forward speed (units / sec)
  public verticalSpeed: number = 0;
  public isGrounded: boolean = true;

  // Car Stats
  public currentVehicleId: string = 'cyber_stinger';
  public currentVehicleInfo: VehicleInfo;
  public health: number = 100;
  public maxHealth: number = 100;
  public boost: number = 100;
  public maxBoost: number = 100;
  public ramPower: number = 1.0;
  public isBoosting: boolean = false;
  public isDrifting: boolean = false;
  public isAlive: boolean = true;
  public fellInWater: boolean = false;

  // Driving parameters
  private maxForwardSpeed: number = 38; // ~85 MPH
  private maxBoostSpeed: number = 54; // ~120 MPH
  private maxReverseSpeed: number = -16;
  private acceleration: number = 26;
  private brakeDeceleration: number = 32;
  private naturalFriction: number = 10;
  private steerRate: number = 2.5;
  private driftSlip: number = 0.85;

  private scene: THREE.Scene;
  private input: InputManager;
  private audio: AudioSystem;
  private particles: ParticleManager;
  private cityData: CityData;

  // Visual tilt angles
  private rollAngle: number = 0;
  private pitchAngle: number = 0;

  constructor(
    scene: THREE.Scene,
    input: InputManager,
    audio: AudioSystem,
    particles: ParticleManager,
    cityData: CityData
  ) {
    this.scene = scene;
    this.input = input;
    this.audio = audio;
    this.particles = particles;
    this.cityData = cityData;

    this.currentVehicleInfo = getVehicleById(this.currentVehicleId);
    this.meshes = this.currentVehicleInfo.createMesh();
    this.scene.add(this.meshes.root);
    this.applyVehicleStats(this.currentVehicleInfo);
    this.reset();
  }

  public setVehicle(vehicleId: string): VehicleInfo {
    const info = getVehicleById(vehicleId);
    if (!info) return this.currentVehicleInfo;

    // Remove old car mesh
    if (this.meshes && this.meshes.root) {
      this.scene.remove(this.meshes.root);
    }

    this.currentVehicleId = info.id;
    this.currentVehicleInfo = info;
    this.meshes = info.createMesh();
    this.scene.add(this.meshes.root);

    this.applyVehicleStats(info);

    // Sync mesh position & orientation
    this.meshes.root.position.copy(this.position);
    this.meshes.root.rotation.set(this.pitchAngle, this.heading, this.rollAngle);

    return info;
  }

  public cycleNextVehicle(): VehicleInfo {
    const currentIndex = VEHICLE_CATALOG.findIndex(v => v.id === this.currentVehicleId);
    const nextIndex = (currentIndex + 1) % VEHICLE_CATALOG.length;
    return this.setVehicle(VEHICLE_CATALOG[nextIndex].id);
  }

  private applyVehicleStats(info: VehicleInfo) {
    const s = info.stats;
    this.maxForwardSpeed = s.maxSpeedUnits;
    this.maxBoostSpeed = s.maxBoostUnits;
    this.acceleration = s.acceleration;
    this.steerRate = s.handling;
    this.driftSlip = s.driftSlip;
    this.ramPower = s.ramPower;
    this.maxHealth = s.armorHp;
    this.health = Math.min(this.health, this.maxHealth);
  }

  public repairAndBoost(healthAmount: number = 20, boostAmount: number = 40) {
    this.health = Math.min(this.maxHealth, this.health + healthAmount);
    this.boost = Math.min(this.maxBoost, this.boost + boostAmount);
  }

  public reset(spawnPos: THREE.Vector3 = new THREE.Vector3(32, 0.4, 32)) {
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.heading = 0;
    this.speed = 0;
    this.verticalSpeed = 0;
    this.isGrounded = true;
    this.health = this.maxHealth;
    this.boost = 100;
    this.isAlive = true;
    this.fellInWater = false;
    this.rollAngle = 0;
    this.pitchAngle = 0;

    this.audio.setNitro(false);
    this.audio.setTireSkid(false);
    this.audio.updateEnginePitch(0, false);

    this.meshes.root.position.copy(this.position);
    this.meshes.root.rotation.set(0, 0, 0);
  }

  public update(dt: number) {
    if (!this.isAlive) {
      this.audio.setNitro(false);
      this.audio.setTireSkid(false);
      return;
    }

    const isInDesert = this.position.x >= 50 && this.position.z <= -50;

    // Handle Boost
    this.isBoosting = this.input.state.boost && this.boost > 0 && this.speed > 5;
    if (this.isBoosting) {
      this.boost = Math.max(0, this.boost - 35 * dt);
    } else {
      this.boost = Math.min(this.maxBoost, this.boost + 12 * dt);
    }
    this.audio.setNitro(this.isBoosting);

    // Handle Drift & Sand Friction
    this.isDrifting = this.input.state.drift && Math.abs(this.speed) > 10;
    const isHardBraking = this.input.state.backward && this.speed > 8;
    this.audio.setTireSkid(this.isDrifting || isHardBraking, this.isDrifting ? 1.0 : 0.6);

    if (isInDesert && Math.abs(this.speed) > 5) {
      const carVel = new THREE.Vector3(
        -Math.sin(this.heading) * this.speed,
        0,
        -Math.cos(this.heading) * this.speed
      );
      const leftWheelPos = this.position.clone().add(new THREE.Vector3(-0.9, 0, 1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading));
      const rightWheelPos = this.position.clone().add(new THREE.Vector3(0.9, 0, 1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading));
      this.particles.emitSandRoostertail(leftWheelPos, carVel, this.isDrifting || this.isBoosting ? 3 : 1);
      this.particles.emitSandRoostertail(rightWheelPos, carVel, this.isDrifting || this.isBoosting ? 3 : 1);
    } else if (this.isDrifting) {
      // Emit tire smoke on asphalt
      const leftWheelPos = this.position.clone().add(new THREE.Vector3(-0.9, 0, 1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading));
      const rightWheelPos = this.position.clone().add(new THREE.Vector3(0.9, 0, 1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading));
      this.particles.emitTireSmoke(leftWheelPos, 2);
      this.particles.emitTireSmoke(rightWheelPos, 2);
    }

    // Throttle & Braking
    const topForward = this.isBoosting ? this.maxBoostSpeed : this.maxForwardSpeed;
    if (this.input.state.forward) {
      if (this.speed < 0) {
        this.speed += this.brakeDeceleration * dt;
      } else {
        this.speed = Math.min(topForward, this.speed + this.acceleration * dt);
      }
      this.audio.updateEnginePitch(Math.abs(this.speed) / topForward, this.isBoosting);
    } else if (this.input.state.backward) {
      if (this.speed > 0) {
        this.speed -= this.brakeDeceleration * dt;
      } else {
        this.speed = Math.max(this.maxReverseSpeed, this.speed - (this.acceleration * 0.6) * dt);
      }
      this.audio.updateEnginePitch(Math.abs(this.speed) / topForward, this.isBoosting);
    } else {
      // Natural rolling resistance friction
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.naturalFriction * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.naturalFriction * dt);
      }
      this.audio.updateEnginePitch(Math.abs(this.speed) / topForward, this.isBoosting);
    }

    // Steering
    let steerInput = 0;
    if (this.input.state.left) steerInput += 1;
    if (this.input.state.right) steerInput -= 1;

    if (steerInput !== 0 && Math.abs(this.speed) > 0.5) {
      const dirFactor = this.speed >= 0 ? 1 : -1;
      const speedRatio = Math.min(1.2, Math.abs(this.speed) / (this.maxForwardSpeed * 0.5));
      const driftMultiplier = this.isDrifting ? 1.6 : 1.0;
      this.heading += steerInput * this.steerRate * speedRatio * driftMultiplier * dirFactor * dt;
    }

    // Forward Direction Vector
    const forwardDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);

    // Compute Horizontal Velocity with Drift Slip
    if (this.isDrifting) {
      const currentDir = this.velocity.clone().normalize();
      const blendedDir = currentDir.lerp(forwardDir, (1 - this.driftSlip) * dt * 10).normalize();
      this.velocity.copy(blendedDir.multiplyScalar(Math.abs(this.speed)));
    } else {
      this.velocity.copy(forwardDir.multiplyScalar(this.speed));
    }

    // Move car on X/Z plane
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Check Ramp Ascents & Container Rooftop Heights
    let onRamp = false;
    let rampHeight = 0;

    for (let ramp of this.cityData.ramps) {
      const toCar = this.position.clone().sub(ramp.position);
      toCar.applyAxisAngle(new THREE.Vector3(0, 1, 0), -ramp.rotationY);

      if (Math.abs(toCar.x) < ramp.width / 2 && Math.abs(toCar.z) < ramp.length / 2) {
        // Linear height along ramp slope
        const progress = (toCar.z + ramp.length / 2) / ramp.length;
        rampHeight = progress * ramp.height;
        onRamp = true;
        break;
      }
    }

    // Determine current surface ground height (Island ground vs Container Rooftop vs Pier vs Water)
    const groundY = this.getGroundHeight();

    if (onRamp) {
      this.position.y = Math.max(groundY, rampHeight + 0.4);
      this.verticalSpeed = 0;
      this.isGrounded = true;
      if (this.speed > 25) {
        this.verticalSpeed = (this.speed / 30) * 8.0;
      }
    } else if (this.position.y > groundY + 0.1) {
      // Airborne with gravity
      this.isGrounded = false;
      this.verticalSpeed -= 28 * dt; // Gravity
      this.position.y += this.verticalSpeed * dt;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
        if (this.verticalSpeed < -12) {
          this.audio.playCrashExplosion(false);
          this.particles.emitSparks(this.position, 10);
          this.health -= Math.abs(this.verticalSpeed) * 0.8;
        }
        this.verticalSpeed = 0;
        this.isGrounded = true;
      }
    } else {
      // Solidly locked to ground or container rooftop
      this.position.y = groundY;
      this.verticalSpeed = 0;
    }

    // Check Cliff Water Fall
    if (this.position.y <= this.cityData.waterLevel + 0.5) {
      this.fellInWater = true;
      this.health = 0;
      this.isAlive = false;
      this.particles.emitWaterSplash(this.position);
      this.audio.playCrashExplosion(true);
      return;
    }

    // Check Building Collisions
    this.checkBuildingCollisions();

    // Visual Mesh updates (Suspension tilt, Dune slope pitch, and Wheel rotation)
    const targetRoll = -steerInput * (Math.abs(this.speed) / this.maxForwardSpeed) * 0.18;
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, 10 * dt);

    let targetPitch = (this.input.state.forward ? -0.06 : (this.input.state.backward ? 0.08 : 0));

    // Dynamic Dune Slope Pitch Adaptation
    if (isInDesert && this.isGrounded) {
      const eps = 1.2;
      const frontX = this.position.x - Math.sin(this.heading) * eps;
      const frontZ = this.position.z - Math.cos(this.heading) * eps;
      const backX = this.position.x + Math.sin(this.heading) * eps;
      const backZ = this.position.z + Math.cos(this.heading) * eps;

      const hFront = getDesertDuneHeight(frontX, frontZ);
      const hBack = getDesertDuneHeight(backX, backZ);
      const dunePitch = -Math.atan2(hFront - hBack, 2 * eps);
      targetPitch += dunePitch;

      // High-speed crest jump launch!
      if (this.speed > 16 && (hFront - hBack) < -0.8) {
        this.verticalSpeed = Math.max(this.verticalSpeed, (this.speed / 28) * 9.0);
        this.isGrounded = false;
      }
    }

    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, 10 * dt);

    this.meshes.root.position.copy(this.position);
    this.meshes.root.rotation.set(this.pitchAngle, this.heading, this.rollAngle);

    // Animate wheels
    const wheelRotSpeed = (this.speed / 0.42) * dt;
    for (let w of this.meshes.wheels) {
      w.rotation.x += wheelRotSpeed;
    }
  }

  private getGroundHeight(): number {
    const inIsland =
      this.position.x >= this.cityData.cityBounds.minX &&
      this.position.x <= this.cityData.cityBounds.maxX &&
      this.position.z >= this.cityData.cityBounds.minZ &&
      this.position.z <= this.cityData.cityBounds.maxZ;

    let groundY = inIsland ? 0.4 : this.cityData.waterLevel - 5.0;

    // Check Desert Sand Dune Elevation!
    if (this.position.x >= 50 && this.position.z <= -50) {
      const duneH = getDesertDuneHeight(this.position.x, this.position.z);
      groundY = Math.max(groundY, 0.4 + duneH);
    }

    // Check if on top of any container, pier, boardwalk, or building collider
    for (let col of this.cityData.colliders) {
      if (col.type === 'building' || col.type === 'prop' || col.type === 'ramp') {
        const b = col.box;
        if (this.position.x >= b.min.x - 0.2 && this.position.x <= b.max.x + 0.2 &&
            this.position.z >= b.min.z - 0.2 && this.position.z <= b.max.z + 0.2) {
          if (this.position.y >= col.height - 0.5) {
            groundY = Math.max(groundY, col.height + 0.4);
          }
        }
      }
    }
    return groundY;
  }

  private checkBuildingCollisions() {
    const carBox = new THREE.Box3().setFromCenterAndSize(
      this.position.clone().add(new THREE.Vector3(0, 0.4, 0)),
      new THREE.Vector3(2.0, 1.0, 4.0)
    );

    for (let col of this.cityData.colliders) {
      if (col.type === 'building' || col.type === 'prop') {
        if (carBox.intersectsBox(col.box)) {
          // If the car is driving high above the obstacle roof, don't collide with side walls
          if (this.position.y >= col.height + 0.2) {
            continue;
          }

          // Bounce Back Collision with Building
          const overlapX = Math.min(carBox.max.x - col.box.min.x, col.box.max.x - carBox.min.x);
          const overlapZ = Math.min(carBox.max.z - col.box.min.z, col.box.max.z - carBox.min.z);

          if (overlapX < overlapZ) {
            const pushDir = this.position.x < (col.box.min.x + col.box.max.x) / 2 ? -1 : 1;
            this.position.x += overlapX * pushDir;
          } else {
            const pushDir = this.position.z < (col.box.min.z + col.box.max.z) / 2 ? -1 : 1;
            this.position.z += overlapZ * pushDir;
          }

          // Impact physics & damage
          const impactSpeed = Math.abs(this.speed);
          if (impactSpeed > 10) {
            this.audio.playCrashExplosion(false);
            this.particles.emitSparks(this.position, 12);
            const damage = (impactSpeed / this.maxForwardSpeed) * (25 / this.ramPower);
            this.health -= damage;
            if (this.health <= 0) {
              this.health = 0;
              this.isAlive = false;
              this.particles.emitWaterSplash(this.position);
              this.audio.playCrashExplosion(true);
            }
          }

          this.speed = -this.speed * 0.35; // Rebound bounce
          break;
        }
      }
    }
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount / this.ramPower);
    this.particles.emitSparks(this.position, 12);
    this.audio.playCrashExplosion(false);
    if (this.health <= 0) {
      this.isAlive = false;
      this.audio.playCrashExplosion(true);
    }
  }
}

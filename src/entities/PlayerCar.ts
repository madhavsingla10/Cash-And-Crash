import * as THREE from 'three';
import { CarBuilder, CarMeshes } from './CarBuilder';
import { InputManager } from '../engine/InputManager';
import { AudioSystem } from '../engine/AudioSystem';
import { ParticleManager } from '../effects/ParticleManager';
import { CityData } from '../world/CityBuilder';

export class PlayerCar {
  public meshes: CarMeshes;
  public position: THREE.Vector3 = new THREE.Vector3(32, 0.4, 32);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public heading: number = 0; // Rotation around Y in radians
  public speed: number = 0; // Forward speed (units / sec)
  public verticalSpeed: number = 0;
  public isGrounded: boolean = true;

  // Car Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public boost: number = 100;
  public maxBoost: number = 100;
  public isBoosting: boolean = false;
  public isDrifting: boolean = false;
  public isAlive: boolean = true;
  public fellInWater: boolean = false;

  // Driving parameters
  private maxForwardSpeed: number = 38; // ~85 MPH
  private maxBoostSpeed: number = 54; // ~120 MPH
  private maxReverseSpeed: number = -16;
  private acceleration: number = 24;
  private brakeDeceleration: number = 32;
  private naturalFriction: number = 10;
  private steerRate: number = 2.4;
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

    this.meshes = CarBuilder.createPlayerCar();
    this.scene.add(this.meshes.root);
    this.reset();
  }

  public reset(spawnPos: THREE.Vector3 = new THREE.Vector3(32, 0.4, 32)) {
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.heading = 0;
    this.speed = 0;
    this.verticalSpeed = 0;
    this.isGrounded = true;
    this.health = 100;
    this.boost = 100;
    this.isAlive = true;
    this.fellInWater = false;
    this.rollAngle = 0;
    this.pitchAngle = 0;

    this.meshes.root.position.copy(this.position);
    this.meshes.root.rotation.set(0, 0, 0);
  }

  public update(dt: number) {
    if (!this.isAlive) return;

    // Handle Boost
    this.isBoosting = this.input.state.boost && this.boost > 0 && this.speed > 5;
    if (this.isBoosting) {
      this.boost = Math.max(0, this.boost - 35 * dt);
      this.audio.playNitroBoost();
    } else {
      this.boost = Math.min(this.maxBoost, this.boost + 12 * dt);
    }

    // Handle Drift
    this.isDrifting = this.input.state.drift && Math.abs(this.speed) > 10;
    if (this.isDrifting) {
      this.audio.playTireScreech();
      // Emit tire smoke & skid marks
      const leftWheelPos = this.position.clone().add(new THREE.Vector3(-0.9, 0, 1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading));
      const rightWheelPos = this.position.clone().add(new THREE.Vector3(0.9, 0, 1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading));
      this.particles.emitTireSmoke(leftWheelPos, 1);
      this.particles.emitTireSmoke(rightWheelPos, 1);
      this.particles.addSkidMark(leftWheelPos, this.heading);
      this.particles.addSkidMark(rightWheelPos, this.heading);
    }

    // Steering
    let steerInput = 0;
    if (this.input.state.left) steerInput += 1;
    if (this.input.state.right) steerInput -= 1;

    const currentSteerRate = this.isDrifting ? this.steerRate * 1.5 : this.steerRate;
    const steerFactor = (this.speed >= 0 ? 1 : -1) * (Math.min(1, Math.abs(this.speed) / 10));
    this.heading += steerInput * currentSteerRate * steerFactor * dt;

    // Acceleration & Braking
    const topForward = this.isBoosting ? this.maxBoostSpeed : this.maxForwardSpeed;
    const currentAccel = this.isBoosting ? this.acceleration * 1.8 : this.acceleration;

    if (this.input.state.forward) {
      if (this.speed < 0) {
        this.speed += this.brakeDeceleration * dt;
      } else {
        this.speed = Math.min(topForward, this.speed + currentAccel * dt);
      }
    } else if (this.input.state.backward) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.brakeDeceleration * dt);
      } else {
        this.speed = Math.max(this.maxReverseSpeed, this.speed - this.acceleration * 0.7 * dt);
      }
    } else {
      // Coasting Friction
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.naturalFriction * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.naturalFriction * dt);
      }
    }

    // Sound engine pitch
    const speedRatio = Math.abs(this.speed) / this.maxForwardSpeed;
    this.audio.updateEnginePitch(speedRatio, this.isBoosting);

    // Calculate motion vector with lateral drift slippage
    const forwardVector = new THREE.Vector3(
      -Math.sin(this.heading),
      0,
      -Math.cos(this.heading)
    );

    const targetVelocity = forwardVector.clone().multiplyScalar(this.speed);
    const slipRate = this.isDrifting ? 4.5 : 12;
    this.velocity.lerp(targetVelocity, slipRate * dt);

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Check Ramp launches & smooth climbing
    this.checkRamps();

    // Check Ground Height (supports ground and container rooftops)
    const groundY = this.getGroundHeight();

    if (this.position.y > groundY + 0.25 && this.isGrounded) {
      this.isGrounded = false;
    }

    // Gravity & Air physics
    if (!this.isGrounded) {
      this.verticalSpeed -= 32 * dt; // Snappy realistic gravity
      this.position.y += this.verticalSpeed * dt;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
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

    // Visual Mesh updates (Suspension tilt and Wheel rotation)
    const targetRoll = -steerInput * (Math.abs(this.speed) / this.maxForwardSpeed) * 0.18;
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, 10 * dt);

    const targetPitch = (this.input.state.forward ? -0.06 : (this.input.state.backward ? 0.08 : 0));
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, 8 * dt);

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

  private checkRamps() {
    for (let ramp of this.cityData.ramps) {
      const halfW = ramp.width / 2;
      const halfL = ramp.length / 2;
      const rx = this.position.x - ramp.position.x;
      const rz = this.position.z - ramp.position.z;

      if (Math.abs(rx) <= halfW + 0.8 && Math.abs(rz) <= halfL + 0.8) {
        // Ramp incline fraction
        const t = THREE.MathUtils.clamp((rz + halfL) / ramp.length, 0, 1);
        const rampSurfaceY = 0.4 + t * ramp.height;

        if (this.position.y <= rampSurfaceY + 0.8 && this.position.y >= rampSurfaceY - 1.5) {
          if (this.speed > 22 && t > 0.85 && this.isGrounded) {
            // High-speed air launch!
            this.isGrounded = false;
            this.verticalSpeed = (this.speed / this.maxForwardSpeed) * 14 + 6;
            this.audio.playAlertSound();
          } else {
            // Smooth climbing up the wooden stage ramp onto containers
            this.position.y = Math.max(this.position.y, rampSurfaceY);
            this.verticalSpeed = 0;
            this.isGrounded = true;
          }
        }
      }
    }
  }

  private checkBuildingCollisions() {
    const playerRadius = 1.6;
    for (let col of this.cityData.colliders) {
      if (col.type !== 'building' || this.position.y >= col.height + 0.2) continue;

      const b = col.box;
      const clampedX = Math.max(b.min.x, Math.min(this.position.x, b.max.x));
      const clampedZ = Math.max(b.min.z, Math.min(this.position.z, b.max.z));

      const dx = this.position.x - clampedX;
      const dz = this.position.z - clampedZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < playerRadius * playerRadius) {
        let nx = 0;
        let nz = 0;

        if (distSq < 0.0001) {
          // Deep inside: find closest exit edge
          const dMinX = Math.abs(this.position.x - b.min.x);
          const dMaxX = Math.abs(this.position.x - b.max.x);
          const dMinZ = Math.abs(this.position.z - b.min.z);
          const dMaxZ = Math.abs(this.position.z - b.max.z);
          const minD = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);

          if (minD === dMinX) { nx = -1; this.position.x = b.min.x - playerRadius - 0.05; }
          else if (minD === dMaxX) { nx = 1; this.position.x = b.max.x + playerRadius + 0.05; }
          else if (minD === dMinZ) { nz = -1; this.position.z = b.min.z - playerRadius - 0.05; }
          else { nz = 1; this.position.z = b.max.z + playerRadius + 0.05; }
        } else {
          // Intersecting boundary
          const dist = Math.sqrt(distSq);
          nx = dx / dist;
          nz = dz / dist;
          const penetration = playerRadius - dist;
          this.position.x += nx * penetration;
          this.position.z += nz * penetration;
        }

        // Remove velocity directed into the building wall for smooth sliding
        const dot = this.velocity.x * nx + this.velocity.z * nz;
        if (dot < 0) {
          this.velocity.x -= dot * nx;
          this.velocity.z -= dot * nz;
        }

        // Damage only on severe high-speed crash
        const hitSpeed = Math.abs(this.speed);
        if (hitSpeed > 20) {
          const damage = Math.round((hitSpeed / this.maxForwardSpeed) * 16);
          this.takeDamage(damage);
          this.particles.emitSparks(this.position, 10);
          this.audio.playCrashExplosion(false);
          this.speed *= 0.5;
        }
      }
    }
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0 && this.isAlive) {
      this.isAlive = false;
      this.particles.createExplosion(this.position, true);
      this.audio.playCrashExplosion(true);
    }
  }

  public repairAndBoost(healthAdd: number = 20, boostAdd: number = 50) {
    this.health = Math.min(this.maxHealth, this.health + healthAdd);
    this.boost = Math.min(this.maxBoost, this.boost + boostAdd);
  }
}

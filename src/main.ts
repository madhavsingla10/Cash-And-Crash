import * as THREE from 'three';
import { AudioSystem } from './engine/AudioSystem';
import { InputManager } from './engine/InputManager';
import { ParticleManager } from './effects/ParticleManager';
import { CityBuilder, CityData } from './world/CityBuilder';
import { PlayerCar } from './entities/PlayerCar';
import { PoliceSquad } from './entities/PoliceSquad';
import { MoneyBagsManager } from './entities/MoneyBags';
import { WaypointArrow } from './entities/WaypointArrow';
import { VEHICLE_CATALOG, getVehicleById } from './entities/VehicleCatalog';

enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
  VICTORY
}

class Game {
  private state: GameState = GameState.MENU;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock: THREE.Clock = new THREE.Clock();

  // Subsystems
  private audio!: AudioSystem;
  private input!: InputManager;
  private particles!: ParticleManager;
  private cityData!: CityData;
  private player!: PlayerCar;
  private police!: PoliceSquad;
  private money!: MoneyBagsManager;
  private arrow!: WaypointArrow;

  // Score & Gameplay
  private score: number = 0;
  private comboMultiplier: number = 1.0;
  private comboResetTimer: number = 0;
  private cameraShake: number = 0;

  // UI Elements
  private moneyValEl = document.getElementById('money-val')!;
  private bagsCountEl = document.getElementById('bags-count')!;
  private scoreValEl = document.getElementById('score-val')!;
  private comboTagEl = document.getElementById('combo-tag')!;
  private healthFillEl = document.getElementById('health-fill')!;
  private healthPctEl = document.getElementById('health-pct')!;
  private carNameHudEl = document.getElementById('car-name-hud')!;
  private boostFillEl = document.getElementById('boost-fill')!;
  private boostPctEl = document.getElementById('boost-pct')!;
  private speedNumEl = document.getElementById('speed-num')!;
  private gpsBadgeEl = document.getElementById('gps-badge')!;
  private takedownFeedEl = document.getElementById('takedown-feed')!;
  private damageFlashEl = document.getElementById('damage-flash')!;

  private startModal = document.getElementById('start-modal')!;
  private gameOverModal = document.getElementById('gameover-modal')!;
  private victoryModal = document.getElementById('victory-modal')!;
  private gameOverReason = document.getElementById('gameover-reason')!;

  private minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
  private minimapCtx = this.minimapCanvas.getContext('2d')!;

  constructor() {
    this.initThree();
    this.initGameSystems();
    this.setupUIEvents();
    this.animate();
  }

  private initThree() {
    const container = document.getElementById('canvas-container')!;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e3a5f);
    this.scene.fog = new THREE.Fog(0x1e3a5f, 220, 800);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 1000);
    this.camera.position.set(0, 8, 14);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Bright, vibrant atmospheric lighting
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x334155, 1.4);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    dirLight.position.set(120, 180, 90);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 550;
    const d = 260;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.9);
    fillLight.position.set(-120, 80, -90);
    this.scene.add(fillLight);

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  private initGameSystems() {
    this.audio = new AudioSystem();
    this.input = new InputManager();
    this.particles = new ParticleManager(this.scene);
    this.cityData = CityBuilder.buildCity(this.scene);

    this.player = new PlayerCar(this.scene, this.input, this.audio, this.particles, this.cityData);

    this.police = new PoliceSquad(
      this.scene,
      this.player,
      this.particles,
      this.audio,
      this.cityData,
      (takedownTitle, bonus) => this.handleTakedown(takedownTitle, bonus),
      (_damage) => this.handlePlayerHit()
    );

    this.money = new MoneyBagsManager(
      this.scene,
      this.player,
      this.audio,
      this.particles,
      (count, cash) => this.handleMoneyCollect(count, cash)
    );

    this.arrow = new WaypointArrow(this.scene);
  }

  private setupUIEvents() {
    // 1. Garage Car Selection Cards
    const cards = document.querySelectorAll('.car-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const carId = card.getAttribute('data-car');
        if (!carId) return;

        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const info = this.player.setVehicle(carId);
        this.updateGarageSpecDetail(info.id);
        this.updateHUD();
      });
    });

    // 2. In-Game Quick Car Switch Button ('C' Key or Button Click)
    const switchBtn = document.getElementById('btn-quick-switch');
    switchBtn?.addEventListener('click', () => {
      this.switchNextVehicle();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyC') {
        this.switchNextVehicle();
      }
    });

    // 3. Start Game Button
    document.getElementById('start-btn')?.addEventListener('click', () => {
      this.audio.init();
      this.startModal.classList.add('hidden');
      this.startGame();
    });

    // 4. Restart Buttons
    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.startGame();
    });
    document.getElementById('vic-restart-btn')?.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.startGame();
    });

    // 5. Audio Toggle & Master Volume Slider
    const audioBtn = document.getElementById('audio-toggle');
    const volumeSlider = document.getElementById('audio-volume') as HTMLInputElement | null;

    audioBtn?.addEventListener('click', () => {
      this.audio.init();
      const isMuted = this.audio.toggleMute();
      audioBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    volumeSlider?.addEventListener('input', () => {
      this.audio.init();
      const val = parseFloat(volumeSlider.value) / 100;
      this.audio.setVolume(val);
      if (audioBtn) {
        audioBtn.textContent = val === 0 || this.audio.getIsMuted() ? '🔇' : '🔊';
      }
    });
  }

  private switchNextVehicle() {
    const v = this.player.cycleNextVehicle();
    this.showTakedownPopup(`${v.icon} ACTIVATED: ${v.name.toUpperCase()}`, 0);

    // Sync selected card in start modal
    const cards = document.querySelectorAll('.car-card');
    cards.forEach(c => {
      if (c.getAttribute('data-car') === v.id) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });
    this.updateGarageSpecDetail(v.id);
    this.updateHUD();
  }

  private updateGarageSpecDetail(carId: string) {
    const v = getVehicleById(carId);
    const speedEl = document.getElementById('spec-speed');
    const armorEl = document.getElementById('spec-armor');
    const accelEl = document.getElementById('spec-accel');
    const ramEl = document.getElementById('spec-ram');

    if (speedEl) speedEl.textContent = `${v.stats.topSpeedMph} MPH`;
    if (armorEl) armorEl.textContent = `${v.stats.armorHp} HP`;
    if (accelEl) accelEl.textContent = v.stats.acceleration >= 30 ? 'Extreme' : (v.stats.acceleration >= 25 ? 'High' : 'Moderate');
    if (ramEl) ramEl.textContent = v.stats.ramPower >= 2.0 ? 'Juggernaut' : (v.stats.ramPower >= 1.2 ? 'Heavy' : 'Normal');
  }

  private startGame() {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.comboMultiplier = 1.0;
    this.comboResetTimer = 0;
    this.cameraShake = 0;

    this.player.reset(new THREE.Vector3(50, 0.4, 50));
    this.police.reset();
    this.particles.clearAll();
    this.money.setupPickups(this.cityData.moneyLocations);

    this.updateHUD();
  }

  private handlePlayerHit() {
    this.cameraShake = 0.85;
    this.damageFlashEl.style.opacity = '0.7';
    setTimeout(() => {
      this.damageFlashEl.style.opacity = '0';
    }, 140);
  }

  private handleMoneyCollect(count: number, totalCash: number) {
    this.score += Math.round(1000 * this.comboMultiplier);
    this.comboMultiplier = Math.min(4.0, this.comboMultiplier + 0.25);
    this.comboResetTimer = 6.0;

    let newWanted = 1;
    if (count >= 10) newWanted = 5;
    else if (count >= 7) newWanted = 4;
    else if (count >= 4) newWanted = 3;
    else if (count >= 2) newWanted = 2;

    this.police.setWantedLevel(newWanted);

    if (count >= 10 && !this.money.isExtractionReady) {
      this.money.activateExtractionBeacon(this.cityData.extractionPoint);
      this.showTakedownPopup('🚁 EXTRACTION HELIPAD OPEN AT GRAND BOULEVARD!', 2500);
    }

    this.updateHUD();
  }

  private handleTakedown(title: string, bonus: number) {
    const totalBonus = Math.round(bonus * this.comboMultiplier);
    this.score += totalBonus;
    this.comboMultiplier = Math.min(5.0, this.comboMultiplier + 0.5);
    this.comboResetTimer = 5.0;

    this.cameraShake = 0.5;
    this.showTakedownPopup(`${title} +$${totalBonus}`, totalBonus);
    this.updateHUD();
  }

  private showTakedownPopup(text: string, _bonus: number) {
    const el = document.createElement('div');
    el.className = 'takedown-notification';
    el.textContent = text;
    this.takedownFeedEl.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(50px)';
      el.style.transition = 'all 0.35s ease';
      setTimeout(() => el.remove(), 350);
    }, 2200);
  }

  private updateHUD() {
    this.moneyValEl.textContent = `$${this.money.totalCash.toLocaleString()}`;
    this.bagsCountEl.textContent = `BAGS: ${this.money.collectedCount} / ${this.money.totalBagsTarget}`;
    this.scoreValEl.textContent = this.score.toLocaleString();
    this.comboTagEl.textContent = `${this.comboMultiplier.toFixed(1)}x MULTIPLIER`;

    // Vehicle Badge
    if (this.carNameHudEl) {
      this.carNameHudEl.textContent = this.player.currentVehicleInfo.name.toUpperCase();
      this.carNameHudEl.style.color = this.player.currentVehicleInfo.colorHex;
    }

    // Health
    const hpPct = Math.max(0, Math.round((this.player.health / this.player.maxHealth) * 100));
    this.healthPctEl.textContent = `${hpPct}%`;
    this.healthFillEl.style.width = `${hpPct}%`;

    // Boost
    const boost = Math.max(0, Math.round(this.player.boost));
    this.boostPctEl.textContent = `${boost}%`;
    this.boostFillEl.style.width = `${boost}%`;

    // Speed (MPH)
    const mph = Math.round(Math.abs(this.player.speed) * 2.23);
    this.speedNumEl.textContent = `${mph}`;

    // GPS Waypoint Badge
    const targetInfo = this.money.getNearestTarget(this.player.position, this.cityData.extractionPoint);
    if (targetInfo) {
      this.gpsBadgeEl.style.display = 'block';
      if (targetInfo.isExtraction) {
        this.gpsBadgeEl.textContent = `🚁 EXTRACTION: ${targetInfo.distance}m`;
        this.gpsBadgeEl.style.color = '#00ffee';
      } else {
        this.gpsBadgeEl.textContent = `📍 ACTIVE LOOT: ${targetInfo.distance}m`;
        this.gpsBadgeEl.style.color = '#00ffaa';
      }
    } else {
      this.gpsBadgeEl.style.display = 'none';
    }

    // Wanted Stars
    for (let s = 1; s <= 5; s++) {
      const starEl = document.getElementById(`star-${s}`);
      if (starEl) {
        if (s <= this.police.wantedLevel) {
          starEl.classList.add('active');
        } else {
          starEl.classList.remove('active');
        }
      }
    }
  }

  private renderMinimap() {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.18;

    ctx.clearRect(0, 0, w, h);

    // Dark Radar Background
    ctx.fillStyle = 'rgba(10, 15, 29, 0.95)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.player.heading);

    const mapSpan = 660 * scale;
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-this.player.position.x * scale - mapSpan / 2, -this.player.position.z * scale - mapSpan / 2, mapSpan, mapSpan);

    // Render Central Park Green Zone on Minimap (84x84m)
    ctx.fillStyle = 'rgba(45, 106, 79, 0.45)';
    ctx.fillRect(-this.player.position.x * scale - (84 * scale) / 2, -this.player.position.z * scale - (84 * scale) / 2, 84 * scale, 84 * scale);

    // Render ONLY the 1 Active Money Bag
    if (this.money.activeBagPosition) {
      const relX = (this.money.activeBagPosition.x - this.player.position.x) * scale;
      const relZ = (this.money.activeBagPosition.z - this.player.position.z) * scale;
      if (Math.hypot(relX, relZ) < cx - 4) {
        ctx.fillStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(relX, relZ, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Render Extraction Point
    if (this.money.isExtractionReady) {
      const relX = (this.cityData.extractionPoint.x - this.player.position.x) * scale;
      const relZ = (this.cityData.extractionPoint.z - this.player.position.z) * scale;
      ctx.strokeStyle = '#00ffee';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(relX, relZ, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render Police Units
    ctx.fillStyle = '#ff2255';
    for (let cop of this.police.units) {
      if (!cop.isAlive) continue;
      const relX = (cop.position.x - this.player.position.x) * scale;
      const relZ = (cop.position.z - this.player.position.z) * scale;
      if (Math.hypot(relX, relZ) < cx - 4) {
        ctx.beginPath();
        ctx.arc(relX, relZ, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Player icon in Center (Arrow facing up)
    ctx.fillStyle = this.player.currentVehicleInfo.colorHex || '#00ffaa';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx - 4, cy + 5);
    ctx.closePath();
    ctx.fill();
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const dt = Math.min(0.1, this.clock.getDelta());

    if (this.state === GameState.PLAYING) {
      // 1. Update Player
      this.player.update(dt);

      // Check Game Over (Busted)
      if (!this.player.isAlive) {
        this.state = GameState.GAME_OVER;
        this.gameOverReason.textContent = this.player.fellInWater
          ? 'Your vehicle plunged off the island cliffs into deep ocean water!'
          : 'Your car was completely wrecked by the relentless police pursuit!';
        document.getElementById('end-cash')!.textContent = `$${this.money.totalCash.toLocaleString()}`;
        document.getElementById('end-wrecks')!.textContent = `${this.police.copsWrecked}`;
        document.getElementById('end-score')!.textContent = `${this.score.toLocaleString()}`;
        this.gameOverModal.classList.remove('hidden');
      }

      // Check Extraction Victory
      if (this.money.isExtractionReady) {
        const distToExtract = this.player.position.distanceTo(this.cityData.extractionPoint);
        if (distToExtract < 10) {
          this.state = GameState.VICTORY;
          this.score += 50000;
          document.getElementById('vic-cash')!.textContent = `$${this.money.totalCash.toLocaleString()}`;
          document.getElementById('vic-wrecks')!.textContent = `${this.police.copsWrecked}`;
          document.getElementById('vic-score')!.textContent = `${this.score.toLocaleString()}`;
          this.victoryModal.classList.remove('hidden');
        }
      }

      // 2. Update Subsystems
      this.police.update(dt);
      this.money.update(dt);
      this.particles.update(dt);

      // 3. Update Waypoint Arrow
      const targetPos = this.money.isExtractionReady
        ? this.cityData.extractionPoint
        : this.money.activeBagPosition;
      this.arrow.update(this.player.position, targetPos, this.money.isExtractionReady, dt);

      // 4. Update Multiplier Decay
      if (this.comboResetTimer > 0) {
        this.comboResetTimer -= dt;
        if (this.comboResetTimer <= 0) {
          this.comboMultiplier = 1.0;
        }
      }

      // 5. Update HUD & Minimap
      this.updateHUD();
      this.renderMinimap();

      // 6. Camera Follow
      this.updateCamera(dt);
    } else {
      // Menu / GameOver idle rotation
      const time = this.clock.getElapsedTime() * 0.2;
      this.camera.position.x = Math.sin(time) * 45;
      this.camera.position.z = Math.cos(time) * 45;
      this.camera.position.y = 22;
      this.camera.lookAt(0, 4, 0);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(dt: number) {
    const behindDist = 9.5;
    const height = 4.5;

    const carHeading = this.player.heading;
    const targetCamPos = this.player.position.clone().add(
      new THREE.Vector3(
        Math.sin(carHeading) * behindDist,
        height,
        Math.cos(carHeading) * behindDist
      )
    );

    // Camera Shake on collisions
    if (this.cameraShake > 0) {
      targetCamPos.x += (Math.random() - 0.5) * this.cameraShake * 1.5;
      targetCamPos.y += (Math.random() - 0.5) * this.cameraShake * 1.5;
      targetCamPos.z += (Math.random() - 0.5) * this.cameraShake * 1.5;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
    }

    this.camera.position.lerp(targetCamPos, 8 * dt);

    const lookTarget = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    this.camera.lookAt(lookTarget);
  }
}

// Start Game Instance
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

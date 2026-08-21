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

    // Scene (Deep black studio background in menu, switches to bright vibrant sky in game)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06060a);
    this.scene.fog = new THREE.Fog(0x06060a, 12, 38);

    // Camera (Stable, locked perspective)
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 1000);
    this.camera.position.set(0, 8, 14);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Atmospheric lighting
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
    this.cityData.root.visible = true;

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
    this.arrow.root.visible = false;
    this.createShowcaseStudio();

    // Hide city during welcome menu
    this.cityData.root.visible = false;
  }

  private showcasePlatform!: THREE.Group;

  private createShowcaseStudio() {
    this.showcasePlatform = new THREE.Group();

    // 1. Dark Studio Ground Plane (from showcase.html)
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.8, metalness: 0.2 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.showcasePlatform.add(ground);

    // 2. Grid Helper (from showcase.html)
    const gridHelper = new THREE.GridHelper(20, 20, 0x222233, 0x111122);
    gridHelper.position.y = 0;
    this.showcasePlatform.add(gridHelper);

    // 3. Studio Ambient & Directional Lights (from showcase.html)
    const ambientLight = new THREE.AmbientLight(0x404060, 2.0);
    this.showcasePlatform.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.showcasePlatform.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8888ff, 0.8);
    rimLight.position.set(-3, 3, -3);
    this.showcasePlatform.add(rimLight);

    this.scene.add(this.showcasePlatform);
  }

  private setupUIEvents() {
    // 1. Garage Car Selection Buttons (.car-nav-btn)
    const carBtns = document.querySelectorAll('.car-nav-btn');
    carBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const carId = btn.getAttribute('data-car');
        if (!carId) return;

        carBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

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
      if (e.code === 'Enter' && !this.startModal.classList.contains('hidden')) {
        this.audio.init();
        this.startModal.classList.add('hidden');
        this.startGame();
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

    // Initialize specs with starting vehicle
    this.updateGarageSpecDetail('cyber_stinger');
  }

  private switchNextVehicle() {
    const v = this.player.cycleNextVehicle();
    this.showTakedownPopup(`${v.icon} ACTIVATED: ${v.name.toUpperCase()}`, 0);

    // Sync active button in welcome screen
    const carBtns = document.querySelectorAll('.car-nav-btn');
    carBtns.forEach(b => {
      if (b.getAttribute('data-car') === v.id) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    this.updateGarageSpecDetail(v.id);
    this.updateHUD();
  }

  private updateGarageSpecDetail(carId: string) {
    const v = getVehicleById(carId);

    const nameEl = document.getElementById('demo-car-name');
    const taglineEl = document.getElementById('demo-car-tagline');
    if (nameEl) {
      nameEl.textContent = v.name.toUpperCase();
      nameEl.style.color = v.colorHex;
      nameEl.style.textShadow = `0 0 15px ${v.colorHex}`;
    }
    if (taglineEl) {
      taglineEl.textContent = v.tagline.toUpperCase();
    }

    const speedValEl = document.getElementById('spec-speed-val');
    const armorValEl = document.getElementById('spec-armor-val');
    const accelValEl = document.getElementById('spec-accel-val');
    const ramValEl = document.getElementById('spec-ram-val');

    const speedBar = document.getElementById('meter-speed-bar');
    const armorBar = document.getElementById('meter-armor-bar');
    const accelBar = document.getElementById('meter-accel-bar');
    const ramBar = document.getElementById('meter-ram-bar');

    if (speedValEl) speedValEl.textContent = `${v.stats.topSpeedMph} MPH / ${Math.round(v.stats.topSpeedMph * 3.3)} KPH`;
    if (armorValEl) armorValEl.textContent = `${v.stats.armorHp} HP`;
    if (accelValEl) accelValEl.textContent = `${(100 / v.stats.acceleration).toFixed(1)}s (${v.stats.acceleration >= 30 ? 'EXTREME' : 'HIGH'})`;
    if (ramValEl) ramValEl.textContent = `${v.stats.ramPower.toFixed(1)}x (${v.stats.ramPower >= 2.0 ? 'JUGGERNAUT' : (v.stats.ramPower >= 1.2 ? 'HEAVY' : 'NORMAL')})`;

    if (speedBar) speedBar.style.width = `${Math.min(100, (v.stats.topSpeedMph / 115) * 100)}%`;
    if (armorBar) armorBar.style.width = `${Math.min(100, (v.stats.armorHp / 260) * 100)}%`;
    if (accelBar) accelBar.style.width = `${Math.min(100, (v.stats.acceleration / 35) * 100)}%`;
    if (ramBar) ramBar.style.width = `${Math.min(100, (v.stats.ramPower / 2.6) * 100)}%`;

    // Dynamic Module Chips
    const modulesContainer = document.getElementById('modules-chips');
    if (modulesContainer && v.modules) {
      modulesContainer.innerHTML = '';
      v.modules.forEach(mod => {
        const chip = document.createElement('div');
        chip.className = 'module-chip clip-edges';
        chip.innerHTML = `<span class="material-symbols-outlined chip-icon">bolt</span>${mod}`;
        modulesContainer.appendChild(chip);
      });
    }
  }

  private startGame() {
    this.state = GameState.PLAYING;
    this.showcasePlatform.visible = false;
    this.cityData.root.visible = true;
    document.getElementById('hud')?.classList.remove('hidden');
    this.scene.background = new THREE.Color(0x1e3a5f);
    this.scene.fog = new THREE.Fog(0x1e3a5f, 220, 800);
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
      // Menu / Showcase perspective from showcase.html
      this.cityData.root.visible = false;
      this.showcasePlatform.visible = true;
      this.arrow.root.visible = false;
      this.player.meshes.root.position.set(0, 0, 0);
      this.player.meshes.root.rotation.y += dt * 0.45;
      this.camera.position.set(4.2, 2.3, 5.6);
      this.camera.lookAt(0, 0.75, 0);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(dt: number) {
    const behindDist = 9.5;
    const height = 4.2;

    const carHeading = this.player.heading;
    const targetCamPos = this.player.position.clone().add(
      new THREE.Vector3(
        Math.sin(carHeading) * behindDist,
        height,
        Math.cos(carHeading) * behindDist
      )
    );

    this.camera.position.lerp(targetCamPos, Math.min(1.0, 12 * dt));

    const lookTarget = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    this.camera.lookAt(lookTarget);
  }
}

// Start Game Instance
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

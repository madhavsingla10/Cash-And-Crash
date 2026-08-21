// Procedural Web Audio API Sound Synthesizer
// Clean, warm, high-fidelity acoustic design engineered to avoid ear fatigue and harshness.

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;

  // Master bus & Limiter
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;

  // Engine sound generator
  private engineSubOsc: OscillatorNode | null = null;
  private engineToneOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Nitro whoosh sound generator (continuous)
  private nitroNoise: AudioBufferSourceNode | null = null;
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private isNitroActive: boolean = false;

  // Tire skid sound generator (continuous)
  private tireNoise: AudioBufferSourceNode | null = null;
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private isTireSkidding: boolean = false;
  private lastTireTriggerTime: number = 0;

  // Police siren generator (soft ambient wail)
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenFilter: BiquadFilterNode | null = null;
  private isSirenPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output pipeline: masterGain -> compressor (limiter) -> lowpass filter -> destination
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // Acoustic safety lowpass filter to remove sharp treble edges (>7500Hz)
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(7500, this.ctx.currentTime);
      this.masterFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.masterGain.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterFilter);
      this.masterFilter.connect(this.ctx.destination);

      this.setupEngineSound();
      this.setupNitroSound();
      this.setupTireSound();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // ==================== ENGINE SOUND ====================
  // Soft, warm multi-cylinder engine rumble (Warm Triangle + Sub Bass filtered)
  private setupEngineSound() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Sub-bass rumble (35Hz-80Hz)
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(36, now);

      // 2. Harmonic mid-body (warm triangle/square blend)
      this.engineToneOsc = this.ctx.createOscillator();
      this.engineToneOsc.type = 'sawtooth';
      this.engineToneOsc.frequency.setValueAtTime(72, now);

      // Warm low-pass filter to strip out raw buzz and keep deep throatiness
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(180, now);
      this.engineFilter.Q.setValueAtTime(1.5, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.09, now);

      this.engineSubOsc.connect(this.engineFilter);
      this.engineToneOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineSubOsc.start();
      this.engineToneOsc.start();
    } catch (e) {
      console.warn('Engine sound init error', e);
    }
  }

  public updateEnginePitch(speedRatio: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineSubOsc || !this.engineToneOsc || !this.engineFilter || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(1.2, speedRatio));

    // Warm frequency range (38Hz idle -> 95Hz top speed, boosting to 115Hz)
    const baseSub = 36;
    const maxSub = isBoosting ? 110 : 92;
    const subFreq = baseSub + clamped * (maxSub - baseSub);

    this.engineSubOsc.frequency.setTargetAtTime(subFreq, now, 0.08);
    this.engineToneOsc.frequency.setTargetAtTime(subFreq * 2.0, now, 0.08);

    // Dynamic filter opens slightly with speed for natural acoustic acceleration
    const filterFreq = 160 + clamped * 220 + (isBoosting ? 80 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

    // Subtle gain scaling so it stays gentle at high speed
    const targetGain = 0.07 + clamped * 0.04;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  // ==================== CONTINUOUS NITRO BOOST ====================
  private setupNitroSound() {
    if (!this.ctx || !this.masterGain) return;
    try {
      // Create seamless looping pink-weighted noise buffer
      const bufferLength = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.15;
      }

      this.nitroNoise = this.ctx.createBufferSource();
      this.nitroNoise.buffer = buffer;
      this.nitroNoise.loop = true;

      this.nitroFilter = this.ctx.createBiquadFilter();
      this.nitroFilter.type = 'bandpass';
      this.nitroFilter.frequency.setValueAtTime(480, this.ctx.currentTime);
      this.nitroFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.nitroNoise.connect(this.nitroFilter);
      this.nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.masterGain);
      this.nitroNoise.start();
    } catch (e) {
      console.warn('Nitro sound setup error', e);
    }
  }

  public setNitro(active: boolean) {
    if (!this.ctx || !this.nitroGain || !this.nitroFilter) return;
    if (this.isNitroActive === active) return;
    this.isNitroActive = active;

    const now = this.ctx.currentTime;
    if (active) {
      this.nitroGain.gain.setTargetAtTime(0.08, now, 0.1);
      this.nitroFilter.frequency.setTargetAtTime(750, now, 0.2);
    } else {
      this.nitroGain.gain.setTargetAtTime(0, now, 0.15);
      this.nitroFilter.frequency.setTargetAtTime(450, now, 0.2);
    }
  }

  public playNitroBoost() {
    // Backwards compatibility trigger: activate for short period
    this.setNitro(true);
  }

  // ==================== TIRE SKID & DRIFT SOUND ====================
  private setupTireSound() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferLength = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }

      this.tireNoise = this.ctx.createBufferSource();
      this.tireNoise.buffer = buffer;
      this.tireNoise.loop = true;

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      // Low, warm friction bandpass (900Hz) instead of harsh 1800Hz screech
      this.tireFilter.frequency.setValueAtTime(950, this.ctx.currentTime);
      this.tireFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      this.tireGain = this.ctx.createGain();
      this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.tireNoise.connect(this.tireFilter);
      this.tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.masterGain);
      this.tireNoise.start();
    } catch (e) {
      console.warn('Tire sound setup error', e);
    }
  }

  public setTireSkid(isSkidding: boolean, intensity: number = 1.0) {
    if (!this.ctx || !this.tireGain || !this.tireFilter) return;
    this.isTireSkidding = isSkidding;
    const now = this.ctx.currentTime;
    if (isSkidding) {
      const targetGain = Math.min(0.045, 0.02 + intensity * 0.025);
      this.tireGain.gain.setTargetAtTime(targetGain, now, 0.08);
      this.tireFilter.frequency.setTargetAtTime(900 + intensity * 250, now, 0.08);
    } else {
      this.tireGain.gain.setTargetAtTime(0, now, 0.1);
    }
  }

  public playTireScreech() {
    const now = performance.now();
    if (now - this.lastTireTriggerTime > 150) {
      this.lastTireTriggerTime = now;
      this.setTireSkid(true, 0.8);
      setTimeout(() => {
        if (!this.isTireSkidding) {
          this.setTireSkid(false);
        }
      }, 180);
    }
  }

  // ==================== POLICE SIREN ====================
  // Authentic, energetic police pursuit siren (Dual-Oscillator wail with punchy presence)
  public startSiren() {
    if (!this.ctx || !this.masterGain || this.isSirenPlaying) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Primary siren tone (Sine wave at 620Hz base)
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sine';
      this.sirenOsc.frequency.setValueAtTime(620, now);

      // 2. Energetic LFO wail modulation (1.45 Hz sweep, ±170Hz range: 450Hz - 790Hz)
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfo.frequency.setValueAtTime(1.45, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(170, now);

      this.sirenLfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc.frequency);

      // 3. Acoustic bandpass filter to give siren authentic projection & bite without harshness
      this.sirenFilter = this.ctx.createBiquadFilter();
      this.sirenFilter.type = 'lowpass';
      this.sirenFilter.frequency.setValueAtTime(1350, now);
      this.sirenFilter.Q.setValueAtTime(1.2, now);

      this.sirenGain = this.ctx.createGain();
      // Powered up volume (0.068) with smooth onset
      this.sirenGain.gain.setValueAtTime(0.001, now);
      this.sirenGain.gain.exponentialRampToValueAtTime(0.068, now + 0.25);

      this.sirenOsc.connect(this.sirenFilter);
      this.sirenFilter.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);

      this.sirenLfo.start();
      this.sirenOsc.start();
      this.isSirenPlaying = true;
    } catch (e) {
      console.warn('Siren init error', e);
    }
  }

  public stopSiren() {
    if (!this.isSirenPlaying || !this.sirenGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.sirenGain.gain.setTargetAtTime(0.0001, now, 0.15);
      setTimeout(() => {
        try {
          this.sirenOsc?.stop();
          this.sirenLfo?.stop();
          this.sirenOsc?.disconnect();
          this.sirenLfo?.disconnect();
        } catch (_) {}
        this.isSirenPlaying = false;
      }, 200);
    } catch (e) {
      console.warn(e);
      this.isSirenPlaying = false;
    }
  }

  // ==================== CASH PICKUP ====================
  // Soothing, pleasing 3-tone crystal bell chime (C6 - E6 - G6)
  public playCashPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [1046.5, 1318.5, 1567.98]; // C6, E6, G6

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        const startTime = now + idx * 0.05;
        const duration = 0.28;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.065, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // ==================== CRASH EXPLOSION ====================
  // Punchy, low-end satisfying bass thump with softened mid crunch (non-fatiguing)
  public playCrashExplosion(isMajor: boolean = false) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = isMajor ? 0.45 : 0.25;

      // 1. Sub Bass Thump (Sine pitch drop: 85Hz -> 25Hz)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(isMajor ? 75 : 95, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + duration);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(isMajor ? 0.22 : 0.12, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + duration);

      // 2. Soft impact noise body (muffled low-pass filter)
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(isMajor ? 350 : 500, now);
      lowpass.frequency.exponentialRampToValueAtTime(60, now + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isMajor ? 0.16 : 0.09, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
    } catch (e) {
      console.warn(e);
    }
  }

  // ==================== GUNSHOT ====================
  // Soft, muffled tactical pop (distant, non-harsh)
  public playGunshot() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.09;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
    } catch (e) {
      console.warn(e);
    }
  }

  // ==================== UI / OBJECTIVE ALERT ====================
  // Gentle two-tone chime (soft sine 440 -> 660)
  public playAlertSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn(e);
    }
  }
}

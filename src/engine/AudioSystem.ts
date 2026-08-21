// Procedural Web Audio API Sound Synthesizer
// Generates engine revs, tire screeches, police sirens, crash explosions, gunfire, cash pickups

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private isSirenPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupEngineSound();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.engineGain) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
    }
    if (this.ctx && this.sirenGain) {
      this.sirenGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  private setupEngineSound() {
    if (!this.ctx) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low idle rumble

      // Lowpass filter to muffle raw sawtooth into throaty engine rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    } catch (e) {
      console.warn('Engine sound init error', e);
    }
  }

  public updateEnginePitch(speedRatio: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc || this.isMuted) return;
    const baseFreq = 50;
    const maxFreq = isBoosting ? 260 : 180;
    const targetFreq = baseFreq + speedRatio * (maxFreq - baseFreq);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
  }

  public startSiren() {
    if (!this.ctx || this.isSirenPlaying) return;
    try {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sine';
      this.sirenOsc.frequency.setValueAtTime(750, this.ctx.currentTime);

      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfo.frequency.setValueAtTime(1.8, this.ctx.currentTime); // 1.8 Hz wail

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(250, this.ctx.currentTime); // Freq sweep range

      this.sirenLfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc.frequency);

      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      this.sirenLfo.start();
      this.sirenOsc.start();
      this.isSirenPlaying = true;
    } catch (e) {
      console.warn('Siren init error', e);
    }
  }

  public stopSiren() {
    if (!this.isSirenPlaying) return;
    try {
      this.sirenOsc?.stop();
      this.sirenLfo?.stop();
      this.sirenOsc?.disconnect();
      this.sirenLfo?.disconnect();
      this.isSirenPlaying = false;
    } catch (e) {
      console.warn(e);
    }
  }

  public playTireScreech() {
    if (!this.ctx || this.isMuted) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(6, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {
      console.warn(e);
    }
  }

  public playCashPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Joyful two-tone coin arpeggio
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  public playCrashExplosion(isMajor: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      const duration = isMajor ? 0.8 : 0.4;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(isMajor ? 400 : 800, this.ctx.currentTime);
      lowpass.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isMajor ? 0.45 : 0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      // Add sub-bass thump
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(isMajor ? 90 : 130, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(isMajor ? 0.5 : 0.3, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + duration);

      noise.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {
      console.warn(e);
    }
  }

  public playGunshot() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.12;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {
      console.warn(e);
    }
  }

  public playNitroBoost() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.3);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  public playAlertSound() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }
}

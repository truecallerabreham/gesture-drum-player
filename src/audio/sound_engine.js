import { DrumSynth } from './drum_synth.js';

/**
 * Authentic rhythmic patterns for viral Brazilian songs
 */
export const BRAZILIAN_SONG_PATTERNS = {
  magalenha: {
    title: 'Magalenha',
    artist: 'Sérgio Mendes & Carlinhos Brown',
    bpm: 116,
    steps: [
      { inst: 'surdo', note: 392.00, vel: 1.15, label: 'Ê MAGALENHA! (Surdo Boom 🥁)' },
      { inst: 'repique', note: 466.16, vel: 0.85, label: 'MA-GA- (Repique Tap ⚡)' },
      { inst: 'repique', note: 523.25, vel: 0.95, label: '-LE-NHA (Repique Snap ⚡)' },
      { inst: 'surdo', note: 466.16, vel: 0.9, label: 'VEM! (Surdo Answer 🥁)' },
      { inst: 'tamborim', note: 392.00, vel: 0.9, label: 'DANÇAR (Tamborim Whip 🪘)' },
      { inst: 'caixa', note: 349.23, vel: 0.8, label: 'VEM (Caixa Buzz 🥁)' },
      { inst: 'repique', note: 392.00, vel: 1.05, label: 'REQUEBRAR (Repique Crack ⚡)' },
      { inst: 'surdo', note: 587.33, vel: 0.95, label: 'BATUCADA! (Surdo Boom 🥁)' },
      { inst: 'agogo', note: 523.25, vel: 0.85, label: 'AGOGÔ BELLS (High Bell 🔔)' },
      { inst: 'repique', note: 466.16, vel: 0.8, label: 'REPIQUE ROLL (Fast Roll ⚡)' },
      { inst: 'repique', note: 523.25, vel: 0.95, label: 'CARNIVAL SNAP (Roll Snap ⚡)' },
      { inst: 'surdo', note: 392.00, vel: 1.05, label: 'Ê VEM! (Surdo Heavy Boom 🥁)' },
      { inst: 'tamborim', note: 466.16, vel: 0.9, label: 'SAMBA WHIP (Turnaround 🪘)' },
      { inst: 'caixa', note: 349.23, vel: 0.85, label: 'CAIXA SIZZLE (Carnival Roll 🥁)' },
      { inst: 'agogo', note: 392.00, vel: 0.9, label: 'CHIME (Double Bell 🔔)' },
      { inst: 'surdo', note: 784.00, vel: 1.2, label: 'MAGALENHA FINALE! (Full Batucada ✨)' }
    ]
  },
  funk: {
    title: 'Baile Funk (Tamborzão)',
    artist: 'Viral TikTok Brazilian Beat',
    bpm: 130,
    steps: [
      { inst: 'tamborzao', note: 110.0, vel: 1.2, label: 'TAMBORZÃO (Sub Kick 💥)' },
      { inst: 'bailesnare', note: 110.0, vel: 0.75, label: 'BAILE (Syncopated Tap ⚡)' },
      { inst: 'bailesnare', note: 146.83, vel: 0.95, label: 'BAILE (Rim Crack ⚡)' },
      { inst: 'tamborzao', note: 110.0, vel: 1.05, label: 'TAMBORZÃO (Bounce 💥)' },
      { inst: 'bailesnare', note: 130.81, vel: 0.85, label: 'BAILE (Snap ⚡)' },
      { inst: 'tamborzao', note: 110.0, vel: 0.95, label: 'TAMBORZÃO (Sub Drop 💥)' },
      { inst: 'bailesnare', note: 164.81, vel: 1.1, label: 'BAILE (Heavy Crack ⚡)' },
      { inst: 'bailesnare', note: 146.83, vel: 0.9, label: 'BAILE (Fill Crack ⚡)' }
    ]
  }
};

/**
 * SoundEngine - Master Web Audio controller, Brazilian percussion router,
 * and interactive Song Beat Step Sequencer.
 */
export class SoundEngine {
  constructor(options = {}) {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;

    // Supported kits: 'magalenha' (default), 'funk', 'acoustic', '808'
    this.currentKit = options.defaultKit || 'magalenha';
    this.availableKits = ['magalenha', 'funk', 'acoustic', '808'];

    // Song Beat Mode (steps through the viral song's beat with each hit)
    this.songBeatMode = options.songBeatMode !== undefined ? options.songBeatMode : true;
    this.songBeatStep = 0;

    // Loop backing track state
    this.isLoopPlaying = false;
    this.loopTimerId = null;

    this.isInitialized = false;
    this.onPlayCallbacks = [];
    this.onStepCallbacks = [];

    // Auto-unlock audio on any user interaction
    this.initAutoUnlock();
  }

  /**
   * Automatically unlocks AudioContext on the very first user interaction anywhere on page
   */
  initAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlockHandler = async () => {
      try {
        await this.init();
        if (this.ctx && this.ctx.state === 'running') {
          window.removeEventListener('pointerdown', unlockHandler);
          window.removeEventListener('keydown', unlockHandler);
          window.removeEventListener('touchstart', unlockHandler);
        }
      } catch (e) {}
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  /**
   * Initializes AudioContext and master dynamics processing
   */
  async init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser.');
    }

    this.ctx = new AudioContextClass();

    // Master Dynamics Compressor prevents distortion during loud multi-pad hits
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isInitialized = true;
  }

  /**
   * Explicitly tests and unlocks audio output with a pleasant confirmation chime
   */
  async testSound() {
    await this.init();
    if (this.ctx && this.compressor) {
      DrumSynth.playAudioChime(this.ctx, this.compressor);
      return true;
    }
    return false;
  }

  /**
   * Switches active sound kit ('magalenha', 'funk', 'acoustic', '808')
   */
  setKit(kitName) {
    if (this.availableKits.includes(kitName)) {
      this.currentKit = kitName;
      this.songBeatStep = 0;
    }
  }

  /**
   * Cycles to the next available sound kit
   */
  toggleKit() {
    const idx = this.availableKits.indexOf(this.currentKit);
    const nextIdx = (idx + 1) % this.availableKits.length;
    this.currentKit = this.availableKits[nextIdx];
    this.songBeatStep = 0;
    return this.currentKit;
  }

  /**
   * Toggles Song Beat Step Mode on or off
   */
  toggleSongBeatMode() {
    this.songBeatMode = !this.songBeatMode;
    this.songBeatStep = 0;
    return this.songBeatMode;
  }

  /**
   * Advance one step in the active song beat sequence, layering percussive hit + viral melody note
   */
  advanceSongBeat(velocity = 1.0) {
    const patternObj = BRAZILIAN_SONG_PATTERNS[this.currentKit] || BRAZILIAN_SONG_PATTERNS.magalenha;
    const steps = patternObj.steps;
    const step = steps[this.songBeatStep % steps.length];
    const currentStepIndex = this.songBeatStep % steps.length;

    this.songBeatStep++;

    const dynamicVel = Math.min(1.0, velocity * (step.vel || 1.0));
    
    // 1. Play the authentic percussive instrument
    this.playDirect(step.inst, dynamicVel);

    // 2. Layer the iconic viral melodic hook (brass for Magalenha, phonk bass for Baile Funk)
    if (this.ctx && this.compressor && step.note) {
      const now = this.ctx.currentTime;
      if (this.currentKit === 'magalenha') {
        DrumSynth.playMagalenhaHorn(this.ctx, this.compressor, step.note, now, dynamicVel * 0.9);
      } else if (this.currentKit === 'funk') {
        DrumSynth.playFunkBassRiff(this.ctx, this.compressor, step.note, now, dynamicVel * 0.9);
      }
    }

    // Dispatch step callback for HUD visualization
    const stepInfo = {
      song: patternObj.title,
      artist: patternObj.artist,
      stepIndex: currentStepIndex + 1,
      totalSteps: steps.length,
      instrument: step.inst,
      label: step.label,
      note: step.note || null,
      velocity: dynamicVel
    };

    this.onStepCallbacks.forEach(cb => cb(stepInfo));
    return stepInfo;
  }

  /**
   * Direct instrument synthesizer router
   */
  playDirect(instrument, velocity = 1.0) {
    const v = Math.max(0.1, Math.min(1.0, velocity));

    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.init();
      } catch (e) {}
    }

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const dest = this.compressor;

      switch (instrument.toLowerCase()) {
        // Brazilian Batucada Instruments
        case 'surdo':
          DrumSynth.playSurdo(this.ctx, dest, now, v, 55);
          break;
        case 'repique':
        case 'repinique':
          DrumSynth.playRepique(this.ctx, dest, now, v);
          break;
        case 'tamborim':
          DrumSynth.playTamborim(this.ctx, dest, now, v);
          break;
        case 'agogo':
        case 'bell':
          DrumSynth.playAgogo(this.ctx, dest, false, now, v);
          break;
        case 'caixa':
          DrumSynth.playCaixa(this.ctx, dest, now, v);
          break;

        // Brazilian Baile Funk Instruments
        case 'tamborzao':
        case 'funkkick':
          DrumSynth.playTamborzaoKick(this.ctx, dest, now, v);
          break;
        case 'bailesnare':
        case 'baileclap':
          DrumSynth.playBaileSnare(this.ctx, dest, now, v);
          break;

        // Standard / Acoustic / 808
        case 'kick':
        case 'bass':
          if (this.currentKit === 'magalenha') DrumSynth.playSurdo(this.ctx, dest, now, v, 50);
          else if (this.currentKit === 'funk') DrumSynth.playTamborzaoKick(this.ctx, dest, now, v);
          else if (this.currentKit === '808') DrumSynth.play808Kick(this.ctx, dest, now, v);
          else DrumSynth.playAcousticKick(this.ctx, dest, now, v);
          break;

        case 'snare':
          if (this.currentKit === 'magalenha') DrumSynth.playSurdo(this.ctx, dest, now, v, 58);
          else if (this.currentKit === 'funk') DrumSynth.playTamborzaoKick(this.ctx, dest, now, v);
          else if (this.currentKit === '808') DrumSynth.play808Snare(this.ctx, dest, now, v);
          else DrumSynth.playAcousticSnare(this.ctx, dest, now, v);
          break;

        case 'rim':
        case 'rimshot':
          if (this.currentKit === 'magalenha') DrumSynth.playRepique(this.ctx, dest, now, v);
          else if (this.currentKit === 'funk') DrumSynth.playBaileSnare(this.ctx, dest, now, v);
          else if (this.currentKit === '808') DrumSynth.play808Rimshot(this.ctx, dest, now, v);
          else DrumSynth.playAcousticRimshot(this.ctx, dest, now, v);
          break;

        case 'hihat':
        case 'hat':
          if (this.currentKit === 'magalenha') DrumSynth.playTamborim(this.ctx, dest, now, v);
          else if (this.currentKit === '808') DrumSynth.play808HiHat(this.ctx, dest, now, v, false);
          else DrumSynth.playAcousticHiHat(this.ctx, dest, now, v, false);
          break;

        case 'crash':
          if (this.currentKit === 'magalenha') DrumSynth.playAgogo(this.ctx, dest, true, now, v);
          else if (this.currentKit === '808') DrumSynth.play808Crash(this.ctx, dest, now, v);
          else DrumSynth.playAcousticCrash(this.ctx, dest, now, v);
          break;

        default:
          DrumSynth.playSurdo(this.ctx, dest, now, v, 55);
          break;
      }
    }

    this.onPlayCallbacks.forEach(cb => cb(instrument, v, this.currentKit));
  }

  /**
   * Main play trigger. If Song Beat Mode is active for Brazilian kits,
   * advances the viral song's beat pattern. Otherwise triggers zone directly.
   */
  play(instrument, velocity = 1.0) {
    if (this.songBeatMode && (this.currentKit === 'magalenha' || this.currentKit === 'funk')) {
      return this.advanceSongBeat(velocity);
    }
    return this.playDirect(instrument, velocity);
  }

  /**
   * Toggles an automatic backing beat loop so users can jam along in real-time
   */
  toggleSongLoop() {
    if (this.isLoopPlaying) {
      clearInterval(this.loopTimerId);
      this.loopTimerId = null;
      this.isLoopPlaying = false;
      return false;
    }

    const patternObj = BRAZILIAN_SONG_PATTERNS[this.currentKit] || BRAZILIAN_SONG_PATTERNS.magalenha;
    const bpm = patternObj.bpm || 116;
    // 16th note interval in ms: (60 / bpm / 4) * 1000
    const stepIntervalMs = (60 / bpm / 4) * 1000;

    this.isLoopPlaying = true;
    let loopStep = 0;

    this.loopTimerId = setInterval(() => {
      if (!this.isLoopPlaying) return;
      const steps = patternObj.steps;
      const step = steps[loopStep % steps.length];
      loopStep++;
      this.playDirect(step.inst, step.vel * 0.85);
    }, stepIntervalMs);

    return true;
  }

  onPlay(callback) {
    this.onPlayCallbacks.push(callback);
  }

  onStep(callback) {
    this.onStepCallbacks.push(callback);
  }
}


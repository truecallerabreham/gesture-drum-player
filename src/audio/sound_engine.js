import { DrumSynth } from './drum_synth.js';

/**
 * SoundEngine - Master Web Audio controller and polyphonic voice router.
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.currentKit = 'acoustic'; // 'acoustic' or '808'
    this.isInitialized = false;
    this.onPlayCallbacks = [];
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
   * Switches active sound kit ('acoustic' or '808')
   */
  setKit(kitName) {
    if (kitName === 'acoustic' || kitName === '808') {
      this.currentKit = kitName;
    }
  }

  toggleKit() {
    this.currentKit = this.currentKit === 'acoustic' ? '808' : 'acoustic';
    return this.currentKit;
  }

  /**
   * Plays a drum instrument by name with velocity dynamics
   * @param {string} instrument - 'snare', 'kick', 'hihat', 'crash', 'tom1', 'tom2'
   * @param {number} velocity - Hit force from 0.1 to 1.0
   */
  play(instrument, velocity = 1.0) {
    const v = Math.max(0.1, Math.min(1.0, velocity));

    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.init();
        }
      } catch (e) {}
    }

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const dest = this.compressor;
      const is808 = this.currentKit === '808';

    switch (instrument.toLowerCase()) {
      case 'kick':
      case 'bass':
        if (is808) DrumSynth.play808Kick(this.ctx, dest, now, v);
        else DrumSynth.playAcousticKick(this.ctx, dest, now, v);
        break;

      case 'snare':
        if (is808) DrumSynth.play808Snare(this.ctx, dest, now, v);
        else DrumSynth.playAcousticSnare(this.ctx, dest, now, v);
        break;

      case 'hihat':
      case 'hi-hat':
      case 'hat':
        if (is808) DrumSynth.play808HiHat(this.ctx, dest, now, v, false);
        else DrumSynth.playAcousticHiHat(this.ctx, dest, now, v, false);
        break;

      case 'openhat':
        if (is808) DrumSynth.play808HiHat(this.ctx, dest, now, v, true);
        else DrumSynth.playAcousticHiHat(this.ctx, dest, now, v, true);
        break;

      case 'tom1':
      case 'hightom':
        if (is808) DrumSynth.play808Tom(this.ctx, dest, 180, now, v);
        else DrumSynth.playAcousticTom(this.ctx, dest, 160, now, v);
        break;

      case 'tom2':
      case 'floortom':
      case 'lowtom':
        if (is808) DrumSynth.play808Tom(this.ctx, dest, 100, now, v);
        else DrumSynth.playAcousticTom(this.ctx, dest, 95, now, v);
        break;

      case 'crash':
      case 'cymbal':
        if (is808) DrumSynth.play808Crash(this.ctx, dest, now, v);
        else DrumSynth.playAcousticCrash(this.ctx, dest, now, v);
        break;

      default:
        console.warn(`[SoundEngine] Unknown instrument: ${instrument}`);
        return;
      }
    }

    // Notify listeners (for visual hit effects, HUD feedback)
    this.onPlayCallbacks.forEach(cb => cb(instrument, v, this.currentKit));
  }

  onPlay(callback) {
    this.onPlayCallbacks.push(callback);
  }
}

/**
 * Procedural Drum Synthesizers for Acoustic and Electronic 808 Kits.
 * Uses pure Web Audio API nodes with zero external asset dependencies.
 */

export class DrumSynth {
  /**
   * Helper to create a one-shot white noise audio buffer
   */
  static getNoiseBuffer(ctx, duration = 1.0) {
    if (!ctx._cachedNoiseBuffer) {
      const bufferSize = ctx.sampleRate * 2.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      ctx._cachedNoiseBuffer = buffer;
    }
    return ctx._cachedNoiseBuffer;
  }

  // =========================================================================
  // ACOUSTIC ROCK DRUMS
  // =========================================================================

  static playAcousticKick(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pitch envelope: fast punch drop from 160Hz to 45Hz
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    // Amplitude envelope
    const peakGain = 1.2 * velocity;
    gain.gain.setValueAtTime(peakGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    // Transient click for beater impact
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(300, t);
    clickGain.gain.setValueAtTime(0.8 * velocity, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);
    clickOsc.start(t);
    clickOsc.stop(t + 0.03);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  static playAcousticSnare(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;

    // 1. Tonal drum body (two oscillators for realistic head vibration)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.06);

    oscGain.gain.setValueAtTime(0.7 * velocity, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.18);

    // 2. Snare rattle wire noise
    const noise = ctx.createBufferSource();
    noise.buffer = DrumSynth.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0 * velocity, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    noise.start(t);
    noise.stop(t + 0.25);
  }

  static playAcousticRimshot(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;

    // 1. Sharp high-energy crack (fast pitch envelope from 520Hz down to 220Hz)
    const crackOsc = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crackOsc.type = 'triangle';
    crackOsc.frequency.setValueAtTime(520, t);
    crackOsc.frequency.exponentialRampToValueAtTime(220, t + 0.035);

    crackGain.gain.setValueAtTime(1.1 * velocity, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    crackOsc.connect(crackGain);
    crackGain.connect(dest);
    crackOsc.start(t);
    crackOsc.stop(t + 0.1);

    // 2. High metallic rim resonance (dual overtone pings)
    [1280, 2540].forEach((freq, idx) => {
      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(freq, t);

      const amp = (idx === 0 ? 0.65 : 0.35) * velocity;
      pingGain.gain.setValueAtTime(amp, t);
      pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      ping.connect(pingGain);
      pingGain.connect(dest);
      ping.start(t);
      ping.stop(t + 0.13);
    });

    // 3. Crisp transient noise burst
    const noise = ctx.createBufferSource();
    noise.buffer = DrumSynth.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.3 * velocity, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    noise.start(t);
    noise.stop(t + 0.08);
  }

  static playAcousticHiHat(ctx, dest, time = 0, velocity = 1.0, open = false) {
    const t = time || ctx.currentTime;
    const duration = open ? 0.45 : 0.06;

    // Metallic inharmonic frequencies
    const fundamental = 42;
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(9500, t);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(7000, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    ratios.forEach(ratio => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(fundamental * ratio, t);
      osc.connect(bandpass);
      osc.start(t);
      osc.stop(t + duration);
    });

    // White noise texture
    const noise = ctx.createBufferSource();
    noise.buffer = DrumSynth.getNoiseBuffer(ctx);
    noise.connect(bandpass);
    noise.start(t);
    noise.stop(t + duration);

    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(dest);
  }

  static playAcousticTom(ctx, dest, pitch = 130, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.08);

    gain.gain.setValueAtTime(1.1 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.46);
  }

  static playAcousticCrash(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;
    const duration = 1.6;

    const noise = ctx.createBufferSource();
    noise.buffer = DrumSynth.getNoiseBuffer(ctx);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(6500, t);
    bandpass.Q.setValueAtTime(1.8, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.1 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + duration);
  }

  // =========================================================================
  // ELECTRONIC 808 DRUMS
  // =========================================================================

  static play808Kick(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Classic 808 boom: long 0.7s sub-bass decay
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.09);

    gain.gain.setValueAtTime(1.4 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.76);
  }

  static play808Snare(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;

    // Body tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.04);
    oscGain.gain.setValueAtTime(0.8 * velocity, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.13);

    // 808 Snappy Clap noise
    const noise = ctx.createBufferSource();
    noise.buffer = DrumSynth.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.setValueAtTime(1.2, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.2 * velocity, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    noise.start(t);
    noise.stop(t + 0.29);
  }

  static play808Rimshot(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;

    // Classic 808 rimshot: dual tuned oscillators with fast, crisp decay
    [480, 1680].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const amp = (idx === 0 ? 1.0 : 0.6) * velocity;
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.07);
    });

    // 808 snappy click
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(950, t);
    clickGain.gain.setValueAtTime(0.9 * velocity, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    click.connect(clickGain);
    clickGain.connect(dest);
    click.start(t);
    click.stop(t + 0.03);
  }

  static play808HiHat(ctx, dest, time = 0, velocity = 1.0, open = false) {
    const t = time || ctx.currentTime;
    const duration = open ? 0.35 : 0.04;

    const noise = ctx.createBufferSource();
    noise.buffer = DrumSynth.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + duration);
  }

  static play808Tom(ctx, dest, pitch = 150, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.05);

    gain.gain.setValueAtTime(1.0 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  static play808Crash(ctx, dest, time = 0, velocity = 1.0) {
    const t = time || ctx.currentTime;
    const duration = 1.2;

    const noise = ctx.createBufferSource();
    noise.buffer = DrumSynth.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5000, t);
    filter.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + duration);
  }
}

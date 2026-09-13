import { SoundEngine, BRAZILIAN_SONG_PATTERNS } from '../src/audio/sound_engine.js';

export function runAudioTests(runner) {
  runner.suite('SoundEngine Audio Graph & Routing', () => {
    runner.test('SoundEngine defaults to Magalenha kit and cycles through all kits', (assert) => {
      const engine = new SoundEngine();
      assert.equal(engine.currentKit, 'magalenha', 'Default kit is Magalenha (Brazilian Batucada)');

      let toggled = engine.toggleKit();
      assert.equal(toggled, 'funk', 'Toggled to Baile Funk kit');

      toggled = engine.toggleKit();
      assert.equal(toggled, 'acoustic', 'Toggled to acoustic kit');

      toggled = engine.toggleKit();
      assert.equal(toggled, '808', 'Toggled to 808 kit');

      toggled = engine.toggleKit();
      assert.equal(toggled, 'magalenha', 'Toggled back to magalenha kit');
    });

    runner.test('SoundEngine dispatches onPlay callbacks with instrument and velocity', (assert) => {
      const engine = new SoundEngine({ songBeatMode: false });
      let captured = null;

      engine.onPlay((inst, vel, kit) => {
        captured = { inst, vel, kit };
      });

      engine.playDirect('surdo', 0.85);

      assert.isNotNull(captured, 'onPlay callback was invoked');
      assert.equal(captured.inst, 'surdo', 'Instrument name matches');
      assert.equal(captured.vel, 0.85, 'Velocity matches');
      assert.equal(captured.kit, 'magalenha', 'Kit matches');
    });

    runner.test('SoundEngine clamps out-of-bounds velocities', (assert) => {
      const engine = new SoundEngine({ songBeatMode: false });
      let capturedVel = null;

      engine.onPlay((inst, vel) => {
        capturedVel = vel;
      });

      engine.playDirect('surdo', 2.5);
      assert.equal(capturedVel, 1.0, 'High velocity clamped to 1.0');

      engine.playDirect('surdo', -0.5);
      assert.equal(capturedVel, 0.1, 'Negative velocity clamped to minimum 0.1');
    });

    runner.test('SoundEngine routes Brazilian percussion correctly in Free Play mode', (assert) => {
      const engine = new SoundEngine({ songBeatMode: false });
      let lastHit = null;

      engine.onPlay((inst, vel, kit) => {
        lastHit = { inst, vel, kit };
      });

      // In Magalenha kit, center sweetspot triggers Surdo and rim triggers Repique
      engine.playDirect('rim', 0.95);
      assert.isNotNull(lastHit, 'Rim played');
      assert.equal(lastHit.inst, 'rim', 'Instrument is rim');
      assert.equal(lastHit.kit, 'magalenha', 'Kit is magalenha');

      engine.setKit('funk');
      engine.playDirect('rimshot', 0.8);
      assert.equal(lastHit.inst, 'rimshot', 'Instrument is rimshot');
      assert.equal(lastHit.kit, 'funk', 'Kit is funk');
    });

    runner.test('Song Beat Mode advances step-by-step through Magalenha beat on each hit', (assert) => {
      const engine = new SoundEngine({ defaultKit: 'magalenha', songBeatMode: true });
      const magalenhaSteps = BRAZILIAN_SONG_PATTERNS.magalenha.steps;

      // Hit 1: Should trigger step 1 (Surdo downbeat boom)
      const step1 = engine.play('snare', 1.0);
      assert.isNotNull(step1, 'Step 1 returned');
      assert.equal(step1.song, 'Magalenha', 'Song title is Magalenha');
      assert.equal(step1.stepIndex, 1, 'First hit triggers step 1');
      assert.equal(step1.instrument, magalenhaSteps[0].inst, 'Instrument is Surdo');

      // Hit 2: Should advance to step 2 (Repique stick tap)
      const step2 = engine.play('snare', 0.9);
      assert.equal(step2.stepIndex, 2, 'Second hit triggers step 2');
      assert.equal(step2.instrument, magalenhaSteps[1].inst, 'Instrument is Repique');

      // Hit 3: Step 3 (Repique rim snap)
      const step3 = engine.play('rim', 0.8);
      assert.equal(step3.stepIndex, 3, 'Third hit triggers step 3');
      assert.equal(step3.instrument, magalenhaSteps[2].inst, 'Instrument is Repique');

      // Hit 4: Step 4 (Surdo answering boom)
      const step4 = engine.play('snare', 1.0);
      assert.equal(step4.stepIndex, 4, 'Fourth hit triggers step 4');
      assert.equal(step4.instrument, magalenhaSteps[3].inst, 'Instrument is Surdo');
    });

    runner.test('Backing loop toggles on and off cleanly', (assert) => {
      const engine = new SoundEngine();
      assert.equal(engine.isLoopPlaying, false, 'Loop initially off');

      const started = engine.toggleSongLoop();
      assert.equal(started, true, 'Loop started');
      assert.equal(engine.isLoopPlaying, true, 'Loop state is playing');

      const stopped = engine.toggleSongLoop();
      assert.equal(stopped, false, 'Loop stopped');
      assert.equal(engine.isLoopPlaying, false, 'Loop state is stopped');
    });
  });
}


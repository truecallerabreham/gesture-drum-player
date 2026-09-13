import { SoundEngine } from '../src/audio/sound_engine.js';

export function runAudioTests(runner) {
  runner.suite('SoundEngine Audio Graph & Routing', () => {
    runner.test('SoundEngine toggles between acoustic and 808 kits', (assert) => {
      const engine = new SoundEngine();
      assert.equal(engine.currentKit, 'acoustic', 'Default kit is acoustic');

      const toggled = engine.toggleKit();
      assert.equal(toggled, '808', 'Toggled to 808 kit');
      assert.equal(engine.currentKit, '808', 'Current kit is 808');

      engine.toggleKit();
      assert.equal(engine.currentKit, 'acoustic', 'Toggled back to acoustic');
    });

    runner.test('SoundEngine dispatches onPlay callbacks with instrument and velocity', (assert) => {
      const engine = new SoundEngine();
      let captured = null;

      engine.onPlay((inst, vel, kit) => {
        captured = { inst, vel, kit };
      });

      engine.play('snare', 0.85);

      assert.isNotNull(captured, 'onPlay callback was invoked');
      assert.equal(captured.inst, 'snare', 'Instrument name matches');
      assert.equal(captured.vel, 0.85, 'Velocity matches');
      assert.equal(captured.kit, 'acoustic', 'Kit matches');
    });

    runner.test('SoundEngine clamps out-of-bounds velocities', (assert) => {
      const engine = new SoundEngine();
      let capturedVel = null;

      engine.onPlay((inst, vel) => {
        capturedVel = vel;
      });

      engine.play('kick', 2.5);
      assert.equal(capturedVel, 1.0, 'High velocity clamped to 1.0');

      engine.play('kick', -0.5);
      assert.equal(capturedVel, 0.1, 'Negative velocity clamped to minimum 0.1');
    });
  });
}

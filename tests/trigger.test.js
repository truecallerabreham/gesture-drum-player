import { MathUtils } from '../src/gesture/math_utils.js';
import { DrumTrigger } from '../src/gesture/drum_trigger.js';

export function runTriggerTests(runner) {
  runner.suite('MathUtils & Physics Calculations', () => {
    runner.test('distance3D computes correct Euclidean distance', (assert) => {
      const p1 = { x: 0, y: 0, z: 0 };
      const p2 = { x: 3, y: 4, z: 0 };
      assert.equal(MathUtils.distance3D(p1, p2), 5, '3-4-5 triangle distance matches');
    });

    runner.test('pointInCylinder detects points inside boundary', (assert) => {
      const center = { x: 0, y: 0, z: 0 };
      const radius = 1.0;
      const height = 0.5;

      const insidePoint = { x: 0.2, y: 0.1, z: 0.2 };
      assert.isTrue(MathUtils.pointInCylinder(insidePoint, center, radius, height), 'Point inside cylinder');

      const outsideHorizontal = { x: 1.5, y: 0.1, z: 0 };
      assert.isFalse(MathUtils.pointInCylinder(outsideHorizontal, center, radius, height), 'Point outside horizontal radius');

      const outsideVertical = { x: 0, y: 0.8, z: 0 };
      assert.isFalse(MathUtils.pointInCylinder(outsideVertical, center, radius, height), 'Point outside vertical height');
    });

    runner.test('calculateVelocity computes downward speed correctly', (assert) => {
      const p1 = { x: 0, y: 0, z: 0 };
      const p2 = { x: 0, y: 0.2, z: 0 }; // moved down 0.2 in 0.05s
      const vel = MathUtils.calculateVelocity(p2, p1, 0.05);

      assert.equal(vel.vy, 4.0, 'Vertical velocity correctly derived as 4.0 units/sec');
    });

    runner.test('mapRange scales and clamps velocity', (assert) => {
      const scaled = MathUtils.mapRange(3.0, 1.0, 5.0, 0.4, 1.0, true);
      assert.equal(scaled, 0.7, '3.0 maps to 0.7 in range [0.4, 1.0]');

      const clampedHigh = MathUtils.mapRange(10.0, 1.0, 5.0, 0.4, 1.0, true);
      assert.equal(clampedHigh, 1.0, 'High values clamp to 1.0');
    });
  });

  runner.suite('DrumTrigger Strike Engine', () => {
    runner.test('Downward strike inside cylinder triggers hit', (assert) => {
      let triggered = null;
      const trigger = new DrumTrigger({
        drums: {
          snare: {
            center: { x: -1.2, y: 0, z: -2.5 },
            radius: 0.8,
            height: 0.5
          }
        },
        onHit: (drum, vel, source) => {
          triggered = { drum, vel, source };
        }
      });

      const mockHands = {
        right: {
          velocity: { vy: 0.5 } // downward velocity in screen space
        }
      };

      const mockAvatarHands = {
        getTipPosition: (side) => {
          if (side === 'right') return { x: -1.2, y: 0.05, z: -2.5 }; // inside snare cylinder
          return null;
        }
      };

      trigger.checkStrikes(mockHands, mockAvatarHands);
      assert.isNotNull(triggered, 'Drum strike was triggered');
      assert.equal(triggered.drum, 'snare', 'Triggered drum is snare');
    });

    runner.test('Horizontal movement without downward velocity does NOT trigger hit', (assert) => {
      let hitCount = 0;
      const trigger = new DrumTrigger({
        drums: {
          snare: {
            center: { x: -1.2, y: 0, z: -2.5 },
            radius: 0.8,
            height: 0.5
          }
        },
        onHit: () => { hitCount++; }
      });

      const mockHands = {
        right: {
          velocity: { vy: -0.2 } // moving upward or zero downward velocity
        }
      };

      const mockAvatarHands = {
        getTipPosition: () => ({ x: -1.2, y: 0.05, z: -2.5 })
      };

      trigger.checkStrikes(mockHands, mockAvatarHands);
      assert.equal(hitCount, 0, 'No hit triggered without downward velocity');
    });
  });
}

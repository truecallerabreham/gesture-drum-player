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
    });

    runner.test('rayDistanceToPoint computes perpendicular distance to target', (assert) => {
      const origin = { x: 0, y: 0, z: 0 };
      const dir = { x: 0, y: 0, z: -1 }; // forward along -Z
      const point = { x: 0.5, y: 0, z: -3 }; // 0.5 units to the right
      const dist = MathUtils.rayDistanceToPoint(origin, dir, point);
      assert.equal(Math.round(dist * 10) / 10, 0.5, 'Perpendicular distance is 0.5');
    });

    runner.test('rayIntersectsDisc detects intersection on drumhead disc', (assert) => {
      const origin = { x: 0, y: 1, z: 0 };
      const dir = { x: 0, y: -1, z: 0 }; // straight down
      const discCenter = { x: 0, y: 0, z: 0 };
      const discRadius = 0.8;

      const hit = MathUtils.rayIntersectsDisc(origin, dir, discCenter, discRadius, { x: 0, y: 1, z: 0 });
      assert.isNotNull(hit, 'Ray hit disc');
      assert.equal(hit.distance, 1.0, 'Hit distance is 1.0');
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

    runner.test('Aim-and-strike triggers hit on targeted drum when wrist snaps downward', (assert) => {
      let struck = null;
      const trigger = new DrumTrigger({
        drums: {
          crash: { center: { x: 1.7, y: 0.5, z: -2.2 }, radius: 0.8, height: 0.6 }
        },
        onHit: (drum, vel, source) => {
          struck = { drum, vel, source };
        }
      });

      const mockHands = {
        right: { velocity: { vy: 0.6, vz: 0 } }
      };

      const mockAvatarHands = {
        getTipPosition: () => ({ x: 0, y: 0, z: -1.9 }) // pen held at distance
      };

      const targetedDrums = { right: 'crash' }; // aiming at crash

      trigger.checkStrikes(mockHands, mockAvatarHands, targetedDrums);
      assert.isNotNull(struck, 'Aim-and-strike fired');
      assert.equal(struck.drum, 'crash', 'Struck drum is targeted crash cymbal');
      assert.equal(struck.source, 'right-pen', 'Source was right pen aim');
    });

    runner.test('triggerHit dispatches keyboard strikes for full kit', (assert) => {
      const hits = [];
      const trigger = new DrumTrigger({
        onHit: (drum, vel, source) => {
          hits.push({ drum, vel, source });
        }
      });

      trigger.triggerHit('snare', 1.0, 'keyboard');
      trigger.triggerHit('hihat', 1.0, 'keyboard');
      trigger.triggerHit('kick', 1.0, 'keyboard');

      assert.equal(hits.length, 3, 'Dispatched 3 hits');
      assert.equal(hits[0].drum, 'snare', 'First hit was snare');
      assert.equal(hits[1].drum, 'hihat', 'Second hit was hihat');
      assert.equal(hits[2].drum, 'kick', 'Third hit was kick');
    });
  });
}

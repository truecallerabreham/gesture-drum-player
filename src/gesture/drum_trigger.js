import { MathUtils } from './math_utils.js';

/**
 * DrumTrigger - Gesture collision and velocity strike detector.
 */
export class DrumTrigger {
  constructor(options = {}) {
    this.drums = options.drums || {};
    this.onHitCallback = options.onHit || null;

    // Responsive thresholds for bare hand movements
    this.minDownwardVelocity = 0.22; // sensitive downward movement threshold
    this.minGestureSpeed = 0.35;    // sensitive overall gesture speed
    this.refractoryPeriod = 42;     // ms cooldown per hand to allow rapid drumming/rolls

    // State per hand for independent two-handed playing
    this.handStates = {
      left: { lastHitTime: -10000, prevVy: 0, wasInside: false },
      right: { lastHitTime: -10000, prevVy: 0, wasInside: false }
    };

    // State per drum pad for test backward compatibility
    this.padStates = {};

    // Bind keyboard kick
    this.bindKeyboard();
  }

  setDrums(drums) {
    this.drums = drums;
  }

  bindKeyboard() {
    const keyMap = {
      'Digit1': 'snare',
      'KeyS': 'snare',
      'Digit2': 'rim',
      'KeyR': 'rim',
      'Space': 'kick',
      'KeyB': 'kick',
      'Digit3': 'kick',
      'KeyH': 'rim',
      'KeyT': 'snare',
      'KeyF': 'snare',
      'KeyC': 'rim'
    };

    window.addEventListener('keydown', (e) => {
      if (keyMap[e.code] && !e.repeat) {
        if (e.code === 'Space') {
          e.preventDefault();
        }
        this.triggerHit(keyMap[e.code], 1.0, 'keyboard');
      }
    });
  }

  /**
   * Checks for drum strikes based on bare hand positions and velocities
   * @param {Object} detectedHands - { left, right }
   * @param {AvatarHands} avatarHands - Avatar hands instance with 3D tip positions
   * @param {Object} targetedDrums - { left: drumName, right: drumName }
   */
  checkStrikes(detectedHands, avatarHands, targetedDrums = {}) {
    const now = performance.now();

    ['left', 'right'].forEach(side => {
      const hand = detectedHands[side];
      if (!hand) return;

      const tipPos = avatarHands && typeof avatarHands.getTipPosition === 'function'
        ? avatarHands.getTipPosition(side)
        : (hand.position || null);

      if (!this.handStates[side]) {
        this.handStates[side] = { lastHitTime: -10000, prevVy: 0, wasInside: false };
      }
      const handState = this.handStates[side];

      // Hand velocity components (screen coordinates: positive vy = downward motion)
      const vy = hand.velocity ? hand.velocity.vy : 0;
      const vz = hand.velocity ? hand.velocity.vz : 0;
      const vx = hand.velocity ? hand.velocity.vx : 0;
      const speed = hand.velocity && hand.velocity.speed !== undefined
        ? hand.velocity.speed
        : Math.sqrt(vx * vx + vy * vy + vz * vz);

      // 1. Every-Movement Detection Criteria:
      // a) Direct downward stroke
      const isDownwardStroke = vy > this.minDownwardVelocity;
      // b) Rebound/deceleration at bottom of stroke (drum hit inflection)
      const isInflectionRebound = handState.prevVy > 0.20 && vy < (handState.prevVy - 0.12);
      // c) Fast forward plunge or wrist snap
      const isPlungeSnap = vz < -0.25 || speed > this.minGestureSpeed;

      const isMotionStrike = isDownwardStroke || isInflectionRebound || isPlungeSnap;
      const cooldownOk = (now - handState.lastHitTime) > this.refractoryPeriod;

      // Check targeting or position over the drum
      const targetedDrum = targetedDrums ? targetedDrums[side] : null;

      if (isMotionStrike && cooldownOk) {
        // Resolve target zone:
        let strikeDrum = targetedDrum;
        if (!strikeDrum && this.drums.snare && this.drums.snare.center && tipPos) {
          const distToCenter = MathUtils.distance3D(tipPos, this.drums.snare.center);
          strikeDrum = distToCenter < 0.60 ? 'snare' : 'rim';
        } else if (!strikeDrum) {
          strikeDrum = 'snare';
        }

        const strokeIntensity = Math.max(vy * 1.5, -vz * 1.2, speed);
        const hitVelocity = MathUtils.mapRange(strokeIntensity, this.minDownwardVelocity, 3.5, 0.35, 1.0, true);

        handState.lastHitTime = now;
        handState.prevVy = vy;

        this.triggerHit(strikeDrum, hitVelocity, side, tipPos);
        return;
      }

      handState.prevVy = vy;

      // 2. Proximity cylinder fallback for legacy tests
      for (const [drumName, drum] of Object.entries(this.drums)) {
        if (!drum || !drum.center || !tipPos) continue;

        if (!this.padStates[drumName]) {
          this.padStates[drumName] = {
            lastHitTime: -10000,
            wasInside: { left: false, right: false }
          };
        }
        const state = this.padStates[drumName];

        const isInside = MathUtils.pointInCylinder(
          tipPos,
          drum.center,
          drum.radius,
          drum.height
        );

        const padCooldownOk = (now - state.lastHitTime) > this.refractoryPeriod;
        const wasInside = state.wasInside[side];

        if (isInside && !wasInside && vy > this.minDownwardVelocity && padCooldownOk) {
          const hitVelocity = MathUtils.mapRange(vy, this.minDownwardVelocity, 3.5, 0.4, 1.0, true);
          state.lastHitTime = now;
          const mappedName = drumName === 'kickpad' ? 'kick' : drumName;
          this.triggerHit(mappedName, hitVelocity, side, tipPos);
        }

        state.wasInside[side] = isInside;
      }
    });
  }

  triggerHit(drumName, velocity = 1.0, source = 'gesture', position = null) {
    if (this.onHitCallback) {
      this.onHitCallback(drumName, velocity, source, position);
    }
  }

  onHit(callback) {
    this.onHitCallback = callback;
  }
}

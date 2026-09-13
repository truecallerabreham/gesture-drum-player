import { MathUtils } from './math_utils.js';

/**
 * DrumTrigger - Gesture collision and velocity strike detector.
 */
export class DrumTrigger {
  constructor(options = {}) {
    this.drums = options.drums || {};
    this.onHitCallback = options.onHit || null;

    // Thresholds
    this.minDownwardVelocity = 1.0; // units/sec downward
    this.refractoryPeriod = 85; // ms cooldown per drum pad

    // State per drum: { lastHitTime: 0, wasInside: { left: false, right: false } }
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
      'Digit2': 'hihat',
      'KeyH': 'hihat',
      'Digit3': 'tom1',
      'KeyT': 'tom1',
      'Digit4': 'tom2',
      'KeyF': 'tom2',
      'Digit5': 'crash',
      'KeyC': 'crash',
      'Space': 'kick',
      'KeyB': 'kick'
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
   * Checks for drum strikes based on current pen tip positions, aim targets, and velocities
   * @param {Object} detectedHands - { left, right }
   * @param {AvatarHands} avatarHands - Avatar drumsticks instance with 3D tip positions
   * @param {Object} targetedDrums - { left: drumName, right: drumName }
   */
  checkStrikes(detectedHands, avatarHands, targetedDrums = {}) {
    const now = performance.now();

    ['left', 'right'].forEach(side => {
      const hand = detectedHands[side];
      if (!hand || !avatarHands) return;

      const tipPos = avatarHands.getTipPosition(side);
      if (!tipPos) return;

      // In screen coordinates, y increases downward, so downward movement has positive vy
      const vy = hand.velocity ? hand.velocity.vy * 4.0 : 0;
      const vz = hand.velocity ? hand.velocity.vz * 4.0 : 0;
      const isDownwardStroke = vy > this.minDownwardVelocity;
      const isForwardPlunge = vz < -this.minDownwardVelocity * 0.75;
      const isStrikeGesture = isDownwardStroke || isForwardPlunge;

      // 1. AIM-AND-STRIKE: If the pen laser ray is aiming at a drum
      const targetedDrum = targetedDrums ? targetedDrums[side] : null;
      if (targetedDrum && isStrikeGesture) {
        if (!this.padStates[targetedDrum]) {
          this.padStates[targetedDrum] = { lastHitTime: -10000, wasInside: { left: false, right: false } };
        }
        const state = this.padStates[targetedDrum];
        const cooldownOk = (now - state.lastHitTime) > this.refractoryPeriod;

        if (cooldownOk) {
          const strokeSpeed = Math.max(vy, -vz);
          const hitVelocity = MathUtils.mapRange(strokeSpeed, this.minDownwardVelocity, 5.0, 0.45, 1.0, true);
          state.lastHitTime = now;
          this.triggerHit(targetedDrum, hitVelocity, `${side}-pen`, tipPos);
          return;
        }
      }

      // 2. PROXIMITY CYLINDER FALLBACK: When physically tapping inside drum volume
      for (const [drumName, drum] of Object.entries(this.drums)) {
        if (!drum || !drum.center) continue;

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

        const cooldownOk = (now - state.lastHitTime) > this.refractoryPeriod;
        const wasInside = state.wasInside[side];

        if (isInside && !wasInside && isDownwardStroke && cooldownOk) {
          const hitVelocity = MathUtils.mapRange(vy, this.minDownwardVelocity, 5.0, 0.4, 1.0, true);
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

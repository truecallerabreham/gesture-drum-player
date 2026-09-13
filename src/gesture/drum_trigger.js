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
   * Checks for drum strikes based on current avatar stick tip positions and velocities
   * @param {Object} detectedHands - { left, right }
   * @param {AvatarHands} avatarHands - Avatar drumsticks instance with 3D tip positions
   */
  checkStrikes(detectedHands, avatarHands) {
    const now = performance.now();

    ['left', 'right'].forEach(side => {
      const hand = detectedHands[side];
      if (!hand || !avatarHands) return;

      const tipPos = avatarHands.getTipPosition(side);
      if (!tipPos) return;

      // In screen coordinates, y increases downward, so downward movement has positive vy
      const vy = hand.velocity ? hand.velocity.vy * 4.0 : 0; // scaled downward velocity

      for (const [drumName, drum] of Object.entries(this.drums)) {
        if (!drum || !drum.center) continue;

        if (!this.padStates[drumName]) {
          this.padStates[drumName] = {
            lastHitTime: -10000,
            wasInside: { left: false, right: false }
          };
        }
        const state = this.padStates[drumName];

        // 1. Check if tip is inside the drum pad's 3D cylinder
        const isInside = MathUtils.pointInCylinder(
          tipPos,
          drum.center,
          drum.radius,
          drum.height
        );

        // 2. Cooldown check
        const cooldownOk = (now - state.lastHitTime) > this.refractoryPeriod;

        // 3. Strike detection: Entering cylinder with downward velocity
        const wasInside = state.wasInside[side];
        const isDownwardStroke = vy > this.minDownwardVelocity;

        if (isInside && !wasInside && isDownwardStroke && cooldownOk) {
          // Normalize velocity to 0.3 - 1.0 range
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

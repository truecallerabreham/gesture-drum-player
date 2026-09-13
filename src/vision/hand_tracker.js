import { MathUtils } from '../gesture/math_utils.js';

/**
 * HandTracker - Integrates MediaPipe Hands computer vision tracking.
 */
export class HandTracker {
  constructor(options = {}) {
    this.videoElement = options.videoElement || null;
    this.onResultsCallback = options.onResults || null;
    this.onStatusChange = options.onStatusChange || null;
    this.hands = null;
    this.camera = null;
    this.isTracking = false;

    // Smoothed hands state
    this.smoothedHands = {
      left: null,
      right: null
    };

    // Tracking history for velocity calculation
    this.previousHands = {
      left: null,
      right: null,
      timestamp: 0
    };
  }

  /**
   * Initializes the MediaPipe Hands model using CDN WASM files
   */
  async init() {
    if (typeof window.Hands === 'undefined') {
      throw new Error('MediaPipe Hands library is not loaded. Ensure script is included in HTML.');
    }

    this.hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0, // Lite model for rock-solid 60+ FPS without frame drops
      minDetectionConfidence: 0.3, // Lower threshold prevents losing hands during fast motion blur
      minTrackingConfidence: 0.3
    });

    this.hands.onResults((results) => this.handleResults(results));

    try {
      if (typeof this.hands.initialize === 'function') {
        await this.hands.initialize();
      }
    } catch (initErr) {
      console.warn('[HandTracker] Hands.initialize warning:', initErr);
    }
  }

  /**
   * Starts processing video frames through MediaPipe
   */
  async start(videoElement) {
    if (videoElement) {
      this.videoElement = videoElement;
    }
    if (!this.videoElement) {
      throw new Error('No video element provided for HandTracker.');
    }

    if (!this.hands) {
      await this.init();
    }

    this.isTracking = true;
    this.lastSeen = { left: 0, right: 0 };
    this.lastVelocities = {
      left: { vx: 0, vy: 0, vz: 0, speed: 0 },
      right: { vx: 0, vy: 0, vz: 0, speed: 0 }
    };

    // Use non-blocking, re-entrancy safe frame pump
    let isProcessing = false;

    const onFrame = async () => {
      if (!this.isTracking) return;

      if (this.videoElement && this.videoElement.readyState >= 2 && !isProcessing) {
        isProcessing = true;
        try {
          await this.hands.send({ image: this.videoElement });
        } catch (e) {
          console.warn('[HandTracker] Frame send warning:', e);
        } finally {
          isProcessing = false;
        }
      }

      if (this.isTracking && this.videoElement) {
        if ('requestVideoFrameCallback' in this.videoElement) {
          this.videoElement.requestVideoFrameCallback(onFrame);
        } else {
          requestAnimationFrame(onFrame);
        }
      }
    };

    if ('requestVideoFrameCallback' in this.videoElement) {
      this.videoElement.requestVideoFrameCallback(onFrame);
    } else {
      requestAnimationFrame(onFrame);
    }
  }

  /**
   * Processes results from MediaPipe Hands
   */
  handleResults(results) {
    const now = performance.now();
    const dt = this.previousHands.timestamp > 0 ? Math.min(0.05, (now - this.previousHands.timestamp) / 1000) : 0.016;

    const detectedHands = {
      left: null,
      right: null,
      count: 0
    };

    const seenSides = { left: false, right: false };

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const rawLandmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label.toLowerCase(); // 'left' or 'right'
        
        // When mirrored, camera 'left' appears on the user's right side
        const side = handedness === 'left' ? 'right' : 'left';
        seenSides[side] = true;

        // Mirror all 21 landmarks along X axis so 3D hand tracks accurately
        const mirroredLandmarks = rawLandmarks.map(pt => ({
          x: 1.0 - pt.x,
          y: pt.y,
          z: pt.z || 0
        }));

        const wrist = mirroredLandmarks[0];
        const indexMcp = mirroredLandmarks[5];
        const pinkyMcp = mirroredLandmarks[17];
        const indexTip = mirroredLandmarks[8];
        const middleTip = mirroredLandmarks[12];

        // 1. Stable Palm Center (centroid of wrist and outer knuckles)
        const palmCenter = {
          x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
          y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
          z: (wrist.z + indexMcp.z + pinkyMcp.z) / 3
        };

        // 2. Hand Strike Center: combines palm mass and finger reach
        const strikePointRaw = {
          x: palmCenter.x * 0.5 + (indexTip.x + middleTip.x) * 0.25,
          y: palmCenter.y * 0.5 + (indexTip.y + middleTip.y) * 0.25,
          z: palmCenter.z * 0.5 + (indexTip.z + middleTip.z) * 0.25
        };

        // Smooth position for jitter-free tracking
        const prevSmoothed = this.smoothedHands[side];
        const smoothed = MathUtils.smoothPoint(strikePointRaw, prevSmoothed, 0.72);
        this.smoothedHands[side] = smoothed;

        // Calculate velocity (y increases downward in screen space: positive vy = downward motion)
        const prevPoint = this.previousHands[side] ? this.previousHands[side].position : null;
        const velocity = MathUtils.calculateVelocity(smoothed, prevPoint, dt);

        this.lastSeen[side] = now;
        this.lastVelocities[side] = velocity;

        detectedHands[side] = {
          side,
          position: smoothed,
          palmCenter,
          wrist,
          velocity,
          landmarks: mirroredLandmarks,
          confidence: results.multiHandedness[i].score,
          isExtrapolated: false
        };
        detectedHands.count++;
      }
    }

    // Dead-reckoning grace period (120ms): prevent tracking dropouts during rapid motion blur
    ['left', 'right'].forEach(side => {
      if (!seenSides[side] && (now - this.lastSeen[side]) < 120 && this.smoothedHands[side]) {
        const prevPos = this.smoothedHands[side];
        const lastV = this.lastVelocities[side] || { vx: 0, vy: 0, vz: 0, speed: 0 };
        const extrapolated = {
          x: Math.max(0, Math.min(1, prevPos.x + lastV.vx * 0.2 * dt)),
          y: Math.max(0, Math.min(1, prevPos.y + lastV.vy * 0.2 * dt)),
          z: (prevPos.z || 0) + (lastV.vz || 0) * 0.2 * dt
        };
        this.smoothedHands[side] = extrapolated;

        detectedHands[side] = {
          side,
          position: extrapolated,
          palmCenter: extrapolated,
          wrist: extrapolated,
          velocity: lastV,
          landmarks: this.previousHands[side] ? this.previousHands[side].landmarks : null,
          confidence: 0.4,
          isExtrapolated: true
        };
        detectedHands.count++;
      }
    });

    // Update tracking history
    this.previousHands = {
      left: detectedHands.left ? { position: detectedHands.left.position, landmarks: detectedHands.left.landmarks, wrist: detectedHands.left.wrist } : null,
      right: detectedHands.right ? { position: detectedHands.right.position, landmarks: detectedHands.right.landmarks, wrist: detectedHands.right.wrist } : null,
      timestamp: now
    };

    if (this.onStatusChange) {
      this.onStatusChange({
        isTracking: detectedHands.count > 0,
        handCount: detectedHands.count,
        leftActive: !!detectedHands.left,
        rightActive: !!detectedHands.right
      });
    }

    if (this.onResultsCallback) {
      this.onResultsCallback(detectedHands);
    }
  }

  stop() {
    this.isTracking = false;
    if (this.camera && typeof this.camera.stop === 'function') {
      this.camera.stop();
    }
  }
}

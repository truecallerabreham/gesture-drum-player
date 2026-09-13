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
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
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

    // Use non-blocking, re-entrancy safe frame pump
    // This avoids camera hardware collisions caused by window.Camera
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
    const dt = this.previousHands.timestamp > 0 ? (now - this.previousHands.timestamp) / 1000 : 0.016;

    const detectedHands = {
      left: null,
      right: null,
      count: 0
    };

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label.toLowerCase(); // 'left' or 'right'
        
        // MediaPipe reports from perspective of camera:
        // When mirrored, camera 'left' appears on the user's right side, so we flip or preserve based on mirror intent:
        const side = handedness === 'left' ? 'right' : 'left';

        // Extract key strike points: Index fingertip (8), Middle fingertip (12), Wrist (0)
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const wrist = landmarks[0];

        // Mirror X coordinate so moving physical hand right moves on-screen right
        const rawPoint = {
          x: (1.0 - indexTip.x),
          y: indexTip.y,
          z: indexTip.z || 0
        };

        const rawWrist = {
          x: (1.0 - wrist.x),
          y: wrist.y,
          z: wrist.z || 0
        };

        // Smooth point
        const prevSmoothed = this.smoothedHands[side];
        const smoothed = MathUtils.smoothPoint(rawPoint, prevSmoothed, 0.75);
        this.smoothedHands[side] = smoothed;

        // Calculate velocity (y is down in screen coordinates: 0 is top, 1 is bottom)
        // A downward strike produces positive dy in screen space (y increases downward)
        const prevPoint = this.previousHands[side] ? this.previousHands[side].position : null;
        const velocity = MathUtils.calculateVelocity(smoothed, prevPoint, dt);

        detectedHands[side] = {
          side,
          position: smoothed,
          wrist: rawWrist,
          velocity,
          landmarks,
          confidence: results.multiHandedness[i].score
        };
        detectedHands.count++;
      }
    }

    // Update tracking history
    this.previousHands = {
      left: detectedHands.left ? { position: detectedHands.left.position } : null,
      right: detectedHands.right ? { position: detectedHands.right.position } : null,
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

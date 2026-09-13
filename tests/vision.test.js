import { NativeCVTracker } from '../src/vision/native_cv_tracker.js';

export function runVisionTests(runner) {
  runner.suite('NativeCVTracker Computer Vision Engine (From Scratch)', () => {
    runner.test('NativeCVTracker initializes with default parameters', (assert) => {
      const tracker = new NativeCVTracker({ width: 160, height: 120 });
      assert.equal(tracker.width, 160, 'Processing width is 160');
      assert.equal(tracker.height, 120, 'Processing height is 120');
      assert.isNotNull(tracker.history.left, 'Left hand history initialized');
      assert.isNotNull(tracker.history.right, 'Right hand history initialized');
    });

    runner.test('NativeCVTracker.isSkinTone accurately detects skin chroma', (assert) => {
      // Natural skin tones across light, medium, and dark spectra
      assert.isTrue(NativeCVTracker.isSkinTone(210, 160, 130), 'Light-medium skin tone detected');
      assert.isTrue(NativeCVTracker.isSkinTone(160, 110, 80), 'Olive/tan skin tone detected');
      assert.isTrue(NativeCVTracker.isSkinTone(95, 60, 40), 'Deep/dark skin tone detected');

      // Non-skin colors (background, walls, monitors)
      assert.isFalse(NativeCVTracker.isSkinTone(0, 0, 255), 'Pure blue is not skin');
      assert.isFalse(NativeCVTracker.isSkinTone(50, 220, 50), 'Green foliage is not skin');
      assert.isFalse(NativeCVTracker.isSkinTone(255, 255, 255), 'Pure white is not skin');
      assert.isFalse(NativeCVTracker.isSkinTone(10, 10, 10), 'Pure black is not skin');
    });

    runner.test('NativeCVTracker generates 21 synthetic landmarks matching hand anatomy', (assert) => {
      const tracker = new NativeCVTracker();
      const landmarks = tracker.generateSyntheticLandmarks(0.35, 0.50, 0.58, 'left');

      assert.equal(landmarks.length, 21, 'Generates full 21 hand landmarks');
      assert.isNotNull(landmarks[0], 'Wrist landmark exists at index 0');
      assert.isNotNull(landmarks[8], 'Index fingertip exists at index 8');
      assert.isNotNull(landmarks[12], 'Middle fingertip exists at index 12');
      assert.isTrue(landmarks[0].y < landmarks[12].y, 'Fingertips are lower/further than wrist in screen space');
    });

    runner.test('NativeCVTracker computes downward velocity and strike metrics', (assert) => {
      const tracker = new NativeCVTracker();

      // Simulate initial position
      tracker.updateHandState('left', 0.30, 0.40, 0.42, 0.016, 100);

      // Simulate rapid downward strike: y increases from 0.40 to 0.55
      const strikeHand = tracker.updateHandState('left', 0.30, 0.55, 0.60, 0.033, 133);

      assert.isNotNull(strikeHand, 'Hand state returned');
      assert.equal(strikeHand.side, 'left', 'Side is left');
      assert.isTrue(strikeHand.velocity.vy > 0.5, 'Downward velocity is strongly positive during downstroke');
      assert.isTrue(strikeHand.velocity.speed > 0.5, 'Speed is elevated');
      assert.isTrue(strikeHand.confidence >= 0.9, 'Confidence is high');
    });

    runner.test('NativeCVTracker.isSkinYCbCr validates chrominance formula directly', (assert) => {
      // YCbCr testing across human diversity
      assert.isTrue(NativeCVTracker.isSkinYCbCr(210, 160, 130), 'Light-medium tone valid');
      assert.isTrue(NativeCVTracker.isSkinYCbCr(180, 130, 95), 'Warm tan tone valid');
      assert.isTrue(NativeCVTracker.isSkinYCbCr(110, 75, 55), 'Deep melanin-rich tone valid');

      // Rejections
      assert.isFalse(NativeCVTracker.isSkinYCbCr(0, 200, 255), 'Cyan sky/light rejected');
      assert.isFalse(NativeCVTracker.isSkinYCbCr(128, 128, 128), 'Neutral gray background rejected');
    });

    runner.test('NativeCVTracker maintains hand tracking persistence during mid-air stillness', (assert) => {
      const tracker = new NativeCVTracker();

      // Initialize hand at t = 100
      tracker.updateHandState('right', 0.65, 0.45, 0.48, [0.55, 0.35, 0.75, 0.58], 0.016, 100);

      // Hand stops moving at t = 200 (100ms pause)
      const pausedHand = tracker.decayHandState('right', 0.016, 200);
      assert.isNotNull(pausedHand, 'Hand state persists during 100ms stationary pause');
      assert.equal(pausedHand.side, 'right', 'Right hand is retained');
      assert.equal(pausedHand.confidence, 0.6, 'Confidence reflects stationary state');

      // Beyond 400ms dropout timeout (e.g. t = 600)
      const droppedHand = tracker.decayHandState('right', 0.016, 600);
      assert.isNull(droppedHand, 'Hand state cleanly deactivates after 400ms absence');
    });

    runner.test('NativeCVTracker extracts 3D orientation, openness, and depth coordinates', (assert) => {
      const tracker = new NativeCVTracker();

      // Simulate a hand with tilted wrist roll and wide open fingers
      const hand = tracker.updateHandState('left', 0.35, 0.45, 0.48, [0.25, 0.35, 0.45, 0.55], 0.016, 100, {
        roll: 0.38,
        openness: 1.45,
        handScale: 1.6
      });

      assert.isNotNull(hand, 'Hand state created');
      assert.isNotNull(hand.rotation, 'Rotation object exists');
      assert.isTrue(hand.rotation.roll > 0.15, 'Wrist roll angle is captured');
      assert.isTrue(hand.openness > 1.2, 'Hand openness indicates splayed fingers');
      assert.isTrue(hand.position.z > 0.1, 'Depth Z reflects forward distance from camera');
      assert.equal(hand.landmarks.length, 21, 'Generates full 21-joint skeleton');

      // Test synthetic landmarks rotate with roll and spread with openness
      const rolledLandmarks = tracker.generateSyntheticLandmarks(0.5, 0.5, 0.55, 'left', 0.5, 1.5);
      const neutralLandmarks = tracker.generateSyntheticLandmarks(0.5, 0.5, 0.55, 'left', 0, 1.0);

      assert.equal(rolledLandmarks.length, 21, '21 landmarks in rolled hand');
      // Due to roll tilt, x-coordinates of fingertips differ from neutral
      assert.isTrue(rolledLandmarks[12].x !== neutralLandmarks[12].x, 'Middle fingertip X rotated by roll angle');
    });
  });
}

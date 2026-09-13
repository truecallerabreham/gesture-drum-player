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
  });
}

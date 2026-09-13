import { CameraManager } from './vision/camera.js';
import { HandTracker } from './vision/hand_tracker.js';
import { SoundEngine } from './audio/sound_engine.js';
import { DrumScene } from './scene/drum_scene.js';
import { DrumTrigger } from './gesture/drum_trigger.js';
import { HUDController } from './ui/hud.js';

/**
 * AeroDrum 3D - Main Application Bootstrap
 */
class AeroDrumApp {
  constructor() {
    this.cameraManager = new CameraManager('webcam-video');
    this.soundEngine = new SoundEngine();
    this.drumScene = null;
    this.handTracker = null;
    this.drumTrigger = null;
    this.hud = null;

    this.latestHands = { left: null, right: null, count: 0 };
    this.lastTime = performance.now();
    this.isRunning = false;
  }

  async init() {
    console.log('[AeroDrumApp] Initializing 3D Stage & Audio Engine...');

    const canvas = document.getElementById('three-canvas');
    this.drumScene = new DrumScene(canvas, window.THREE, {
      onPointerHit: (drumName, velocity, source) => {
        this.handleDrumHit(drumName, velocity, source);
      },
      onTargetChange: (targetDrum) => {
        if (this.hud) {
          this.hud.updateTargetDisplay(targetDrum);
        }
      }
    });

    this.hud = new HUDController({
      soundEngine: this.soundEngine,
      onStart: () => this.startApp()
    });

    // When background loop triggers a step, also trigger 3D light pulse
    this.soundEngine.onStep((stepInfo) => {
      if (this.drumScene && this.soundEngine.isLoopPlaying) {
        const zone = stepInfo.instrument === 'surdo' || stepInfo.instrument === 'tamborzao' ? 'snare' : 'rim';
        this.drumScene.onHit(zone, stepInfo.velocity * 0.75, null, 'loop');
      }
    });

    this.drumTrigger = new DrumTrigger({
      drums: this.drumScene.drumKit.drums,
      onHit: (drumName, velocity, source, position) => {
        this.handleDrumHit(drumName, velocity, source, position);
      }
    });

    this.handTracker = new HandTracker({
      onResults: (detectedHands) => {
        this.latestHands = detectedHands;
      },
      onStatusChange: (status) => {
        if (this.hud) {
          this.hud.updateTrackingStatus(status);
        }
      }
    });

    const debugCanvas = document.getElementById('cv-debug-canvas');
    if (debugCanvas && this.handTracker) {
      this.handTracker.setDebugCanvas(debugCanvas);
    }

    // Start 60fps render loop
    this.animate();
  }

  async startApp() {
    console.log('[AeroDrumApp] Starting Audio Context...');
    try {
      await this.soundEngine.init();
      // Play pleasant confirmation chime so user immediately hears audio is working
      await this.soundEngine.testSound();
    } catch (audioErr) {
      console.warn('[AeroDrumApp] AudioContext init warning:', audioErr);
    }

    // Set running immediately so keyboard & 3D mouse click interactions work instantly
    this.isRunning = true;

    try {
      console.log('[AeroDrumApp] Initializing Webcam & Native Computer Vision Engine...');
      const videoElement = await this.cameraManager.start();
      await this.handTracker.start(videoElement);
      console.log('[AeroDrumApp] Air-drumming system is active and tracking hands!');
    } catch (err) {
      console.warn('[AeroDrumApp] Camera gesture tracking notice:', err);
      if (this.hud && this.hud.statusText) {
        this.hud.statusText.textContent = 'Camera disabled — Play with Mouse Clicks or Keys 1-5 & Space';
      }
    }
  }

  handleDrumHit(drumName, velocity = 1.0, source = 'gesture', position = null) {
    // 1. Play low-latency synthesized drum audio (returns stepInfo in Song Beat Mode)
    const stepInfo = this.soundEngine.play(drumName, velocity);

    // 2. Trigger 3D drumhead recoil, shockwave ripple, neon particles & hand pulse
    this.drumScene.onHit(drumName, velocity, position, source);

    // 3. Highlight HUD legend & live strike feedback badge with viral song info
    this.hud.flashDrumFeedback(drumName, velocity, stepInfo);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // 1. Render 3D scene & update effects (computes target ray intersections)
    if (this.drumScene) {
      this.drumScene.update(this.latestHands, dt);
    }

    // 2. Check gesture strikes with pen aiming target support
    if (this.isRunning && this.drumTrigger && this.drumScene && this.drumScene.avatarHands) {
      const targetedDrums = this.drumScene.getTargetedDrums ? this.drumScene.getTargetedDrums() : {};
      this.drumTrigger.checkStrikes(this.latestHands, this.drumScene.avatarHands, targetedDrums);
    }
  }
}

// Bootstrap once DOM and CDN scripts are loaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new AeroDrumApp();
  app.init().catch(err => console.error('App init failed:', err));
});

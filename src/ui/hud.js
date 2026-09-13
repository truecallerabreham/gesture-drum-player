/**
 * HUD Controller - Manages status badges, kit switcher UI, legend feedback, and calibration.
 */

export class HUDController {
  constructor(options = {}) {
    this.soundEngine = options.soundEngine;
    this.onStartClick = options.onStart || null;

    // DOM Elements
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');
    this.kitToggleBtn = document.getElementById('btn-kit-toggle');
    this.kitLabel = document.getElementById('kit-name-label');
    this.calibrationBanner = document.getElementById('calibration-banner');
    this.startOverlay = document.getElementById('start-overlay');
    this.btnStart = document.getElementById('btn-start');
    this.btnToggleCam = document.getElementById('btn-toggle-cam');
    this.cameraPreview = document.getElementById('camera-preview-container');
    this.aimTargetPill = document.getElementById('aim-target-pill');
    this.aimTargetText = document.getElementById('aim-target-text');

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnStart) {
      this.btnStart.addEventListener('click', () => {
        if (this.startOverlay) {
          this.startOverlay.classList.add('hidden');
        }
        if (this.onStartClick) {
          this.onStartClick();
        }
      });
    }

    if (this.kitToggleBtn && this.soundEngine) {
      this.kitToggleBtn.addEventListener('click', () => {
        const newKit = this.soundEngine.toggleKit();
        this.updateKitDisplay(newKit);
      });
    }

    if (this.btnToggleCam && this.cameraPreview) {
      this.btnToggleCam.addEventListener('click', () => {
        this.cameraPreview.classList.toggle('visible');
      });
    }
  }

  updateKitDisplay(kitName) {
    if (this.kitLabel) {
      this.kitLabel.textContent = kitName === '808' ? 'Electronic 808' : 'Acoustic Rock';
    }
  }

  /**
   * Updates tracking status badge and calibration banner
   */
  updateTrackingStatus(status) {
    if (!this.statusDot || !this.statusText) return;

    if (!status.isTracking || status.handCount === 0) {
      this.statusDot.className = 'status-dot';
      this.statusText.textContent = 'Position hands in front of camera';
      if (this.calibrationBanner) {
        this.calibrationBanner.classList.remove('hidden');
      }
    } else {
      this.statusDot.className = 'status-dot ready tracking';
      const plural = status.handCount > 1 ? 'Both Hands' : '1 Hand';
      this.statusText.textContent = `Tracking Active (${plural})`;
      if (this.calibrationBanner) {
        this.calibrationBanner.classList.add('hidden');
      }
    }
  }

  /**
   * Updates live targeted drum label
   */
  updateTargetDisplay(targetDrum) {
    if (!this.aimTargetText) return;
    if (!targetDrum) {
      this.aimTargetText.textContent = 'Aim: Point at drum';
      if (this.aimTargetPill) this.aimTargetPill.classList.remove('active-target');
      return;
    }

    const labels = {
      snare: 'Snare',
      hihat: 'Hi-Hat',
      tom1: 'High Tom',
      tom2: 'Floor Tom',
      crash: 'Crash',
      kick: 'Kick'
    };

    const name = labels[targetDrum] || targetDrum.toUpperCase();
    this.aimTargetText.textContent = `🎯 Aiming: ${name}`;
    if (this.aimTargetPill) this.aimTargetPill.classList.add('active-target');
  }

  /**
   * Highlights drum legend item upon strike
   */
  flashDrumFeedback(drumName) {
    const el = document.getElementById(`legend-${drumName}`);
    if (el) {
      el.classList.add('active-hit');
      setTimeout(() => el.classList.remove('active-hit'), 150);
    }
  }
}

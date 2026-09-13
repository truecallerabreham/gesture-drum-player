/**
 * HUD Controller - Manages status badges, Brazilian kit switcher UI,
 * Song Beat Mode step sequencer indicators, and live strike feedback.
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
    this.beatModeBtn = document.getElementById('btn-beat-mode');
    this.beatModeLabel = document.getElementById('beat-mode-label');
    this.loopToggleBtn = document.getElementById('btn-loop-toggle');
    this.calibrationBanner = document.getElementById('calibration-banner');
    this.startOverlay = document.getElementById('start-overlay');
    this.btnStart = document.getElementById('btn-start');
    this.btnToggleCam = document.getElementById('btn-toggle-cam');
    this.cameraPreview = document.getElementById('camera-preview-container');
    this.aimTargetPill = document.getElementById('aim-target-pill');
    this.aimTargetText = document.getElementById('aim-target-text');
    this.btnTestSound = document.getElementById('btn-test-sound');

    this.bindEvents();
    if (this.soundEngine) {
      this.updateKitDisplay(this.soundEngine.currentKit);
    }
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

    if (this.btnTestSound && this.soundEngine) {
      this.btnTestSound.addEventListener('click', async () => {
        await this.soundEngine.testSound();
        this.flashCustomBadge('🔊 AUDIO ACTIVE & UNLOCKED! ✨', 'badge-snare');
      });
    }

    if (this.kitToggleBtn && this.soundEngine) {
      this.kitToggleBtn.addEventListener('click', () => {
        const newKit = this.soundEngine.toggleKit();
        this.updateKitDisplay(newKit);
      });
    }

    if (this.beatModeBtn && this.soundEngine) {
      this.beatModeBtn.addEventListener('click', () => {
        const isSongBeat = this.soundEngine.toggleSongBeatMode();
        this.updateBeatModeDisplay(isSongBeat);
      });
    }

    if (this.loopToggleBtn && this.soundEngine) {
      this.loopToggleBtn.addEventListener('click', () => {
        const isLooping = this.soundEngine.toggleSongLoop();
        this.updateLoopDisplay(isLooping);
      });
    }

    if (this.btnToggleCam && this.cameraPreview) {
      this.btnToggleCam.classList.add('active-mode');
      this.btnToggleCam.addEventListener('click', () => {
        const isHidden = this.cameraPreview.classList.toggle('hidden-preview');
        if (!isHidden) {
          this.btnToggleCam.classList.add('active-mode');
        } else {
          this.btnToggleCam.classList.remove('active-mode');
        }
      });
    }

    // Keyboard shortcuts: M for Beat Mode, L for Loop, K for Kit
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'KeyM' && this.soundEngine) {
        const isSongBeat = this.soundEngine.toggleSongBeatMode();
        this.updateBeatModeDisplay(isSongBeat);
      } else if (e.code === 'KeyL' && this.soundEngine) {
        const isLooping = this.soundEngine.toggleSongLoop();
        this.updateLoopDisplay(isLooping);
      } else if (e.code === 'KeyK' && this.soundEngine) {
        const newKit = this.soundEngine.toggleKit();
        this.updateKitDisplay(newKit);
      }
    });
  }

  updateKitDisplay(kitName) {
    if (this.kitLabel) {
      const labels = {
        magalenha: '🇧🇷 Magalenha (Batucada)',
        funk: '🇧🇷 Baile Funk (Tamborzão)',
        acoustic: '🥁 Acoustic Rock',
        808: '⚡ Electronic 808'
      };
      this.kitLabel.textContent = labels[kitName] || kitName.toUpperCase();
    }

    // Update legend descriptions
    const snareDesc = document.getElementById('legend-snare-text');
    const rimDesc = document.getElementById('legend-rim-text');
    const kickDesc = document.getElementById('legend-kick-text');

    if (kitName === 'magalenha') {
      if (snareDesc) snareDesc.textContent = '🎯 Center Sweetspot (Surdo Boom)';
      if (rimDesc) rimDesc.textContent = '⚡ Chrome Rim (Repique Crack)';
      if (kickDesc) kickDesc.textContent = '🦶 Surdo Sub Bass';
    } else if (kitName === 'funk') {
      if (snareDesc) snareDesc.textContent = '🎯 Center Sweetspot (Tamborzão Sub)';
      if (rimDesc) rimDesc.textContent = '⚡ Chrome Rim (Baile Snare Crack)';
      if (kickDesc) kickDesc.textContent = '🦶 Tamborzão Kick';
    } else {
      if (snareDesc) snareDesc.textContent = '🎯 Center Sweetspot (Snare)';
      if (rimDesc) rimDesc.textContent = '⚡ Chrome Rimshot';
      if (kickDesc) kickDesc.textContent = '🦶 Kick Bass';
    }
  }

  updateBeatModeDisplay(isSongBeat) {
    if (this.beatModeLabel) {
      this.beatModeLabel.textContent = isSongBeat ? '🎵 Song Beat: ON' : '🥁 Free Play';
    }
    if (this.beatModeBtn) {
      this.beatModeBtn.classList.toggle('active-mode', isSongBeat);
    }
  }

  updateLoopDisplay(isLooping) {
    if (this.loopToggleBtn) {
      this.loopToggleBtn.textContent = isLooping ? '⏹️ Stop Loop' : '▶️ Backing Loop';
      this.loopToggleBtn.classList.toggle('loop-active', isLooping);
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
      this.statusText.textContent = `Native CV Active (${plural})`;
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
      this.aimTargetText.textContent = 'Hands: Over 3D Drum';
      if (this.aimTargetPill) this.aimTargetPill.classList.remove('active-target');
      return;
    }

    const kit = this.soundEngine ? this.soundEngine.currentKit : 'magalenha';
    let centerLabel = '🎯 Center Sweetspot (Surdo)';
    let rimLabel = '⚡ Chrome Rimshot (Repique)';

    if (kit === 'funk') {
      centerLabel = '🎯 Center Sweetspot (Tamborzão)';
      rimLabel = '⚡ Chrome Rim (Baile Snare)';
    } else if (kit === 'acoustic' || kit === '808') {
      centerLabel = '🎯 Center Sweetspot (Snare)';
      rimLabel = '⚡ Chrome Rimshot';
    }

    const labels = {
      snare: centerLabel,
      rim: rimLabel,
      kick: '🦶 Kick Bass'
    };

    const name = labels[targetDrum] || targetDrum.toUpperCase();
    this.aimTargetText.textContent = `${name}`;
    if (this.aimTargetPill) this.aimTargetPill.classList.add('active-target');
  }

  /**
   * Highlights drum legend item and live feedback badge upon strike
   */
  flashDrumFeedback(drumName, velocity = 1.0, stepInfo = null) {
    const el = document.getElementById(`legend-${drumName}`);
    if (el) {
      el.classList.add('active-hit');
      setTimeout(() => el.classList.remove('active-hit'), 180);
    }

    const strikeBadge = document.getElementById('live-strike-badge');
    if (!strikeBadge) return;

    if (stepInfo) {
      // Song Beat Mode: show step and viral song note
      strikeBadge.textContent = `🇧🇷 ${stepInfo.song.toUpperCase()} [${stepInfo.label}] (${stepInfo.stepIndex}/${stepInfo.totalSteps})`;
      const isSurdo = stepInfo.instrument === 'surdo' || stepInfo.instrument === 'tamborzao';
      strikeBadge.className = `live-strike-badge ${isSurdo ? 'badge-snare' : 'badge-rim'} active`;
    } else {
      // Free play mode
      const kit = this.soundEngine ? this.soundEngine.currentKit : 'magalenha';
      const isRim = drumName === 'rim';
      const isKick = drumName === 'kick';

      let label = '🎯 SWEETSPOT HIT!';
      if (kit === 'magalenha') {
        label = isRim ? '⚡ REPIQUE CRACK!' : (isKick ? '🦶 SURDO SUB!' : '🎯 SURDO BOOM!');
      } else if (kit === 'funk') {
        label = isRim ? '⚡ BAILE CRACK!' : (isKick ? '🦶 TAMBORZÃO!' : '🎯 TAMBORZÃO BOOM!');
      } else {
        label = isRim ? '⚡ RIMSHOT!' : (isKick ? '🦶 KICK BASS!' : '🎯 SWEETSPOT HIT!');
      }

      const colorClass = isRim ? 'badge-rim' : (isKick ? 'badge-kick' : 'badge-snare');
      strikeBadge.textContent = label;
      strikeBadge.className = `live-strike-badge ${colorClass} active`;
    }

    clearTimeout(this._strikeTimeout);
    this._strikeTimeout = setTimeout(() => {
      strikeBadge.classList.remove('active');
    }, 280);
  }

  /**
   * Displays a custom confirmation banner on screen
   */
  flashCustomBadge(text, colorClass = 'badge-snare') {
    const strikeBadge = document.getElementById('live-strike-badge');
    if (!strikeBadge) return;

    strikeBadge.textContent = text;
    strikeBadge.className = `live-strike-badge ${colorClass} active`;

    clearTimeout(this._strikeTimeout);
    this._strikeTimeout = setTimeout(() => {
      strikeBadge.classList.remove('active');
    }, 600);
  }
}



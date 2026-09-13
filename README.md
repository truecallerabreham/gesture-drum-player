# 🥁 AeroDrum 3D — Webcam Gesture-Controlled 3D Drum Player

> Play an authentic, responsive 3D drum kit in mid-air using your bare hands and your webcam. Zero installation, zero audio lag, and pure musical immersion.

[![GitHub Pages Deployment](https://img.shields.io/badge/Deploy-GitHub%20Pages-00f0ff?style=for-the-badge&logo=github)](https://truecallerabreham.github.io/gesture-drum-player/)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/AI%20Vision-MediaPipe%20Hands-00ff88?style=for-the-badge)](https://developers.google.com/mediapipe)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-ff0077?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## ✨ Features

- **🖐️ Real-Time 3D Air-Drumming:** Uses MediaPipe Hands running locally in WebAssembly to track 21 landmarks per hand at up to 60 FPS.
- **🥁 Full 5-Piece 3D Drum Kit:** Modeled with realistic proportions, metallic chrome lugs and stands, reflective brass cymbals, and textured drumheads (Snare, Hi-Hat, Crash, High Tom, Floor Tom, and Kick).
- **💥 High-Impact Reactive Visuals:** Dynamic stage spotlights flare and neon particle sparks explode from the strike point on each hit, accompanied by physical drumhead recoil and cymbal wobble animations.
- **🪄 Glowing 3D Avatar Drumsticks:** Virtual drumsticks mirror your physical hands in real time, with glowing cyan (left) and magenta (right) tips that track your wrist flicks and strikes.
- **⚡ Zero-Lag Web Audio Sound Engine:** Sub-50ms latency using pure Web Audio API synthesis and polyphonic voice routing.
- **🔄 Multi-Kit Sound Switcher:** Instant toggle between authentic **Acoustic Rock** drums and punchy **Electronic 808 / Beatmaker** sounds.
- **🦶 Dual Kick Triggering:** Fire the bass drum naturally by striking the low center virtual holographic pad with either hand, OR by tapping the keyboard **Spacebar** (with your foot or hand).
- **🔒 100% Client-Side & Private:** All computer vision processing happens strictly inside your local browser. No camera video is ever stored or transmitted.

---

## 🎮 How to Play

1. **Launch the Web App:** Open `index.html` in any modern desktop or laptop browser (Chrome, Edge, Firefox, Safari).
2. **Click "Let's Jam 🚀":** Allows browser audio to initialize and prompts for webcam access.
3. **Allow Webcam:** Give browser camera permission.
4. **Raise Hands:** Hold your hands up in front of your chest with palms facing toward the camera. Your glowing virtual drumsticks will lock onto your hands.
5. **Air Drum!** Snap your hand downward naturally into any drum pad or cymbal. Faster downward velocity hits with more volume!
6. **Bass Drum:** Press the **Spacebar** key or hit the center glowing pad for deep bass kicks.

---

## 🎹 Drum Kit Map

| Drum Piece | Visual Location | Acoustic Sound | Electronic 808 Sound |
| :--- | :--- | :--- | :--- |
| **Snare Drum** | Center-Left | Crispy rock snare with wire rattle | 808 Snappy Clap / Snare |
| **Hi-Hat** | Far-Left | Metallic inharmonic closed hat | Tight 808 synthetic hat |
| **High Tom** | Upper Center-Left | Tuned resonant 160Hz tom | Pitch-dropping 808 synth tom |
| **Floor Tom** | Center-Right | Deep booming 95Hz tom | Low electronic sub tom |
| **Crash Cymbal** | Upper-Right | Shimmering brass explosion with decay | 808 Bright crash splash |
| **Kick Drum** | Center Floor / Spacebar | Deep punchy acoustic thud (45Hz) | Booming sub-bass 808 boom |

---

## 🏗️ Project Architecture

```text
gesture-drum-player/
├── index.html                   # HTML entry point, stage viewport, HUD overlay
├── css/
│   └── style.css                # Fullscreen stage styling, neon HUD & responsive layout
├── src/
│   ├── main.js                  # Master application orchestrator and 60 FPS animation loop
│   ├── vision/
│   │   ├── camera.js            # Webcam stream acquisition, lifecycle & error handling
│   │   └── hand_tracker.js      # MediaPipe Hands integration & coordinate normalization
│   ├── gesture/
│   │   ├── drum_trigger.js      # 3D zone collision & downward velocity strike detector
│   │   └── math_utils.js        # Velocity derivation, Euclidean distances & EMA smoothing
│   ├── audio/
│   │   ├── sound_engine.js      # Web Audio API audio graph & polyphonic voice routing
│   │   └── drum_synth.js        # Procedural physical synthesizers for Acoustic & 808 drums
│   ├── scene/
│   │   ├── drum_scene.js        # Three.js scene, camera, stage lights & render manager
│   │   ├── drum_models.js       # 5-piece 3D drum kit geometry & recoil animations
│   │   ├── avatar_hands.js      # 3D glowing drumsticks tracking hand landmarks
│   │   └── particles.js         # Neon impact spark burst system & stage lighting flares
│   └── ui/
│       └── hud.js               # Tracking readiness badge, kit switcher, strike feedback
├── tests/
│   ├── run_tests.js             # Automated Node.js test runner (headless execution)
│   ├── test_runner.html         # In-browser visual test runner
│   ├── trigger.test.js          # Unit tests for velocity detection & collision math
│   └── audio.test.js            # Unit tests for Web Audio voice synthesis & routing
├── docs/
│   └── plans/                   # Implementation plan & architecture documentation
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages automated deployment workflow
└── README.md                    # Project documentation
```

---

## 🧪 Testing

The codebase includes automated unit tests covering 3D spatial collision, velocity derivations, debouncing hysteresis, and Web Audio routing.

### Run Automated Tests (CLI):
```bash
node tests/run_tests.js
```

### Run Tests in Browser:
Open `tests/test_runner.html` in your browser to view the interactive test suite.

---

## 🚀 Pushing to Your GitHub Repository

To push this project to your GitHub account (`https://github.com/truecallerabreham`):

1. **Create a new repository** on GitHub named `gesture-drum-player`:
   - Go to [https://github.com/new](https://github.com/new)
   - Repository name: `gesture-drum-player`
   - Set to **Public**
   - Click **Create repository**

2. **Connect remote and push:**
   ```bash
   git remote add origin https://github.com/truecallerabreham/gesture-drum-player.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - In your repo settings on GitHub, go to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions** (or Deploy from a branch: `main` / `root`).
   - Your live air-drumming app will be live at:
     `https://truecallerabreham.github.io/gesture-drum-player/`

---

## 📜 License

MIT License © 2026 Abreham. Built with passion for music, 3D graphics, and computer vision.

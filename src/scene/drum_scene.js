import { DrumKitModels } from './drum_models.js';
import { AvatarHands } from './avatar_hands.js';
import { ParticleEffects } from './particles.js';
import { MathUtils } from '../gesture/math_utils.js';

/**
 * DrumScene - Main Three.js visual concert stage manager.
 */
export class DrumScene {
  constructor(canvasElement, THREE, options = {}) {
    this.canvas = canvasElement;
    this.THREE = THREE || window.THREE;
    if (!this.THREE) {
      throw new Error('Three.js is not loaded.');
    }

    this.onPointerHit = options.onPointerHit || null;
    this.onTargetChange = options.onTargetChange || null;
    this.targetedDrums = { left: null, right: null };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.spotlights = [];
    this.drumKit = null;
    this.avatarHands = null;
    this.particles = null;
    this.targetReticles = null;

    this.initScene();
    this.initLights();
    this.initStage();
    this.initComponents();
    this.initTargetReticles();
    this.initPointerEvents();
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());
  }

  initScene() {
    const THREE = this.THREE;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070812);
    this.scene.fog = new THREE.FogExp2(0x070812, 0.08);

    const aspect = window.innerWidth / window.innerHeight;
    // Perspective camera positioned from drummer's first-person eye level looking at kit
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 100);
    this.camera.position.set(0, 0.4, 0.5);
    this.camera.lookAt(0, -0.1, -2.8);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  initLights() {
    const THREE = this.THREE;

    // Atmospheric ambient light
    const ambient = new THREE.AmbientLight(0x20243e, 0.8);
    this.scene.add(ambient);

    // Main Overhead Drum Stage Spotlight (Cyan/Cool White)
    const mainSpot = new THREE.SpotLight(0xaad8ff, 3.5);
    mainSpot.position.set(0, 4.5, -1.5);
    mainSpot.target.position.set(0, -0.2, -2.8);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.5;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    this.scene.add(mainSpot);
    this.scene.add(mainSpot.target);
    this.spotlights.push(mainSpot);

    // Left Accent Stage Light (Neon Cyan)
    const leftSpot = new THREE.SpotLight(0x00f0ff, 2.0);
    leftSpot.position.set(-4, 3.5, -1);
    leftSpot.target.position.set(-1.2, -0.2, -2.6);
    leftSpot.angle = Math.PI / 5;
    leftSpot.penumbra = 0.7;
    this.scene.add(leftSpot);
    this.scene.add(leftSpot.target);
    this.spotlights.push(leftSpot);

    // Right Accent Stage Light (Neon Magenta)
    const rightSpot = new THREE.SpotLight(0xff0077, 2.0);
    rightSpot.position.set(4, 3.5, -1);
    rightSpot.target.position.set(1.3, -0.25, -2.6);
    rightSpot.angle = Math.PI / 5;
    rightSpot.penumbra = 0.7;
    this.scene.add(rightSpot);
    this.scene.add(rightSpot.target);
    this.spotlights.push(rightSpot);

    // Dynamic Flash Light (flares on heavy hits)
    this.flashLight = new THREE.PointLight(0xffffff, 0, 8);
    this.flashLight.position.set(0, 1.5, -2.5);
    this.scene.add(this.flashLight);
  }

  initStage() {
    const THREE = this.THREE;

    // Reflective Stage Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c16,
      roughness: 0.25,
      metalness: 0.85
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.8;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Stage Back Wall Trusses (Subtle geometric background)
    const trussGeo = new THREE.TorusGeometry(8, 0.08, 8, 48);
    const trussMat = new THREE.MeshBasicMaterial({ color: 0x141a32 });
    const truss = new THREE.Mesh(trussGeo, trussMat);
    truss.position.set(0, 2, -7);
    this.scene.add(truss);
  }

  initComponents() {
    this.drumKit = new DrumKitModels(this.THREE, this.scene);
    this.avatarHands = new AvatarHands(this.THREE, this.scene);
    this.particles = new ParticleEffects(this.THREE, this.scene);
  }

  /**
   * Initializes 3D mouse and touch raycaster interaction on drumhead meshes
   */
  initPointerEvents() {
    if (!this.canvas) return;
    const THREE = this.THREE;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
      const clientY = event.clientY !== undefined ? event.clientY : (event.touches && event.touches[0] ? event.touches[0].clientY : 0);

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, this.camera);

      if (this.drumKit && this.drumKit.drums) {
        for (const [drumName, drum] of Object.entries(this.drumKit.drums)) {
          if (!drum || !drum.group) continue;
          const intersects = raycaster.intersectObjects(drum.group.children, true);
          if (intersects.length > 0) {
            const mappedName = drumName === 'kickpad' ? 'kick' : drumName;
            if (this.onPointerHit) {
              this.onPointerHit(mappedName, 0.95, 'pointer');
            }
            break;
          }
        }
      }
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
  }

  initTargetReticles() {
    this.targetReticles = {
      left: this.createReticleMesh(0x00f0ff),
      right: this.createReticleMesh(0xff0077)
    };
  }

  createReticleMesh(color) {
    const THREE = this.THREE;
    const group = new THREE.Group();

    // Outer aiming ring
    const ringGeo = new THREE.TorusGeometry(0.34, 0.018, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.88
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Crosshair ticks
    const tickGeo = new THREE.PlaneGeometry(0.12, 0.016);
    const tTop = new THREE.Mesh(tickGeo, ringMat);
    tTop.position.y = 0.34;
    group.add(tTop);

    const tBottom = new THREE.Mesh(tickGeo, ringMat);
    tBottom.position.y = -0.34;
    group.add(tBottom);

    const tLeft = new THREE.Mesh(tickGeo, ringMat);
    tLeft.position.x = -0.34;
    tLeft.rotation.z = Math.PI / 2;
    group.add(tLeft);

    const tRight = new THREE.Mesh(tickGeo, ringMat);
    tRight.position.x = 0.34;
    tRight.rotation.z = Math.PI / 2;
    group.add(tRight);

    // Center targeting pip
    const pipGeo = new THREE.CircleGeometry(0.04, 16);
    const pip = new THREE.Mesh(pipGeo, ringMat);
    group.add(pip);

    group.rotation.x = -Math.PI / 2;
    group.visible = false;
    this.scene.add(group);

    return { group, ringMat, baseColor: color };
  }

  getTargetedDrums() {
    return this.targetedDrums;
  }

  handleResize() {
    if (!this.camera || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Triggers visual strike feedback (recoil + sparks + light flare)
   */
  onHit(drumName, velocity = 1.0) {
    const drum = this.drumKit.drums[drumName] || (drumName === 'kick' ? this.drumKit.drums.kickpad : null);
    if (!drum) return;

    // 1. Recoil physical animation
    this.drumKit.triggerRecoil(drumName, velocity);

    // 2. Neon particle burst
    this.particles.emitBurst(drum.center, drum.color, 35, velocity);

    // 3. Dynamic stage light pulse
    this.flashLight.color.setHex(drum.color);
    this.flashLight.intensity = 2.5 * velocity;
  }

  /**
   * Main render update loop
   */
  update(detectedHands, dt) {
    const now = performance.now();
    const THREE = this.THREE;

    // 1. Update 3D avatar hands tracking and raycasting
    if (this.avatarHands && detectedHands) {
      this.avatarHands.update(detectedHands, this.camera);

      ['left', 'right'].forEach(side => {
        const aimRay = this.avatarHands.getAimRay(side);
        const reticle = this.targetReticles ? this.targetReticles[side] : null;

        if (!aimRay || !reticle || !detectedHands[side]) {
          if (reticle) reticle.group.visible = false;
          this.avatarHands.setLaserTarget(side, null);
          this.targetedDrums[side] = null;
          return;
        }

        let bestHit = null;
        let bestDrumName = null;
        let bestDist = Infinity;

        if (this.drumKit && this.drumKit.drums) {
          for (const [drumName, drum] of Object.entries(this.drumKit.drums)) {
            if (!drum || !drum.center) continue;

            // Disc surface intersection
            const discHit = MathUtils.rayIntersectsDisc(
              aimRay.origin,
              aimRay.direction,
              drum.center,
              drum.radius * 1.35,
              { x: 0, y: 1, z: 0 }
            );

            if (discHit && discHit.distance < bestDist) {
              bestDist = discHit.distance;
              bestHit = discHit.hitPoint;
              bestDrumName = drumName === 'kickpad' ? 'kick' : drumName;
            } else if (!bestHit) {
              // Proximity angle fallback
              const rayDist = MathUtils.rayDistanceToPoint(aimRay.origin, aimRay.direction, drum.center);
              if (rayDist < drum.radius * 1.25) {
                bestHit = drum.center;
                bestDrumName = drumName === 'kickpad' ? 'kick' : drumName;
              }
            }
          }
        }

        if (bestHit && bestDrumName) {
          reticle.group.position.set(bestHit.x, bestHit.y + 0.02, bestHit.z);
          reticle.group.visible = true;

          // Pulse animation
          const pulse = 1.0 + 0.08 * Math.sin(now * 0.01);
          reticle.group.scale.set(pulse, pulse, pulse);

          const drum = this.drumKit.drums[bestDrumName] || this.drumKit.drums.kickpad;
          if (drum && drum.color) {
            reticle.ringMat.color.setHex(drum.color);
          }

          this.avatarHands.setLaserTarget(side, new THREE.Vector3(bestHit.x, bestHit.y, bestHit.z));
          this.targetedDrums[side] = bestDrumName;
        } else {
          reticle.group.visible = false;
          this.avatarHands.setLaserTarget(side, null);
          this.targetedDrums[side] = null;
        }
      });

      if (this.onTargetChange) {
        const activeTarget = this.targetedDrums.right || this.targetedDrums.left || null;
        this.onTargetChange(activeTarget);
      }
    }

    // 2. Update drum kit recoil animations
    if (this.drumKit) {
      this.drumKit.update(now);
    }

    // 3. Update particle sparks
    if (this.particles) {
      this.particles.update(dt);
    }

    // 4. Decay flash light
    if (this.flashLight && this.flashLight.intensity > 0.01) {
      this.flashLight.intensity *= 0.85;
    }

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  }
}

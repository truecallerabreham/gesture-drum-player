/**
 * 3D Avatar Cybernetic Hands - Renders responsive glowing bare hands tracking MediaPipe hand landmarks.
 * Built with Three.js.
 */

export class AvatarHands {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;

    this.hands = {
      left: this.createCyberHand(0x00f0ff, 'left'),   // Neon Cyan
      right: this.createCyberHand(0xff0077, 'right')  // Neon Magenta
    };

    // Backward compatibility alias
    this.sticks = this.hands;

    this.visible = {
      left: false,
      right: false
    };
  }

  createCyberHand(neonColor, side) {
    const THREE = this.THREE;
    const group = new THREE.Group();

    // Dark sleek cybernetic material
    const matArmor = new THREE.MeshStandardMaterial({
      color: 0x141826,
      metalness: 0.85,
      roughness: 0.25
    });

    const matGlow = new THREE.MeshBasicMaterial({
      color: neonColor,
      transparent: true,
      opacity: 0.95
    });

    const matJoint = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      metalness: 0.9,
      roughness: 0.15
    });

    // 1. Palm Center Disc
    const palmGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.035, 18);
    const palmMesh = new THREE.Mesh(palmGeo, matArmor);
    palmMesh.castShadow = true;
    group.add(palmMesh);

    // Glowing Neon Palm Rim Ring
    const rimGeo = new THREE.TorusGeometry(0.15, 0.014, 8, 24);
    const rimMesh = new THREE.Mesh(rimGeo, matGlow);
    rimMesh.rotation.x = Math.PI / 2;
    group.add(rimMesh);

    // Center Core Power Pip
    const pipGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const pipMesh = new THREE.Mesh(pipGeo, matGlow);
    pipMesh.position.y = 0.02;
    group.add(pipMesh);

    // Dynamic Downward Neon Hand Light (casts neon glow directly onto drumhead)
    const handLight = new THREE.PointLight(neonColor, 2.5, 3.0);
    handLight.position.y = -0.05;
    group.add(handLight);

    // 2. Wrist Anchor Mount
    const wristGeo = new THREE.BoxGeometry(0.18, 0.04, 0.12);
    const wristMesh = new THREE.Mesh(wristGeo, matArmor);
    wristMesh.position.z = 0.16;
    group.add(wristMesh);

    const wristRingGeo = new THREE.TorusGeometry(0.09, 0.012, 8, 24);
    const wristRing = new THREE.Mesh(wristRingGeo, matGlow);
    wristRing.rotation.x = Math.PI / 2;
    wristRing.position.z = 0.20;
    group.add(wristRing);

    // 3. Five Articulated Cyber Fingers
    const fingerDefs = [
      { name: 'thumb',  x: side === 'left' ? 0.14 : -0.14, z: 0.04,  rotY: side === 'left' ? 0.7 : -0.7, len: 0.12 },
      { name: 'index',  x: side === 'left' ? 0.09 : -0.09, z: -0.15, rotY: side === 'left' ? 0.15 : -0.15, len: 0.18 },
      { name: 'middle', x: 0.0,                           z: -0.17, rotY: 0.0, len: 0.20 },
      { name: 'ring',   x: side === 'left' ? -0.08 : 0.08, z: -0.15, rotY: side === 'left' ? -0.15 : 0.15, len: 0.17 },
      { name: 'pinky',  x: side === 'left' ? -0.14 : 0.14, z: -0.12, rotY: side === 'left' ? -0.35 : 0.35, len: 0.14 }
    ];

    const fingerNodes = {};

    fingerDefs.forEach(def => {
      const fGroup = new THREE.Group();
      fGroup.position.set(def.x, 0, def.z);
      fGroup.rotation.y = def.rotY;

      // Base knuckle joint
      const baseJointGeo = new THREE.SphereGeometry(0.022, 10, 10);
      const baseJoint = new THREE.Mesh(baseJointGeo, matJoint);
      fGroup.add(baseJoint);

      // Phalanx bone segment
      const boneGeo = new THREE.CylinderGeometry(0.011, 0.013, def.len, 8);
      const boneMesh = new THREE.Mesh(boneGeo, matArmor);
      boneMesh.rotation.x = -Math.PI / 2;
      boneMesh.position.z = -def.len * 0.5;
      fGroup.add(boneMesh);

      // Glowing Fingertip sensor node
      const tipGeo = new THREE.SphereGeometry(0.025, 12, 12);
      const tipMesh = new THREE.Mesh(tipGeo, matGlow);
      tipMesh.position.z = -def.len;
      fGroup.add(tipMesh);

      group.add(fGroup);
      fingerNodes[def.name] = { fGroup, tipMesh, len: def.len };
    });

    group.visible = false;
    this.scene.add(group);

    return {
      group,
      palmMesh,
      pipMesh,
      handLight,
      fingerNodes,
      color: neonColor,
      side,
      handWorldPos: new THREE.Vector3(),
      tipWorldPos: new THREE.Vector3(),
      downwardVel: 0
    };
  }

  /**
   * Updates virtual hand positions and finger orientations from tracking data
   * @param {Object} detectedHands - { left, right }
   * @param {THREE.Camera} camera
   */
  update(detectedHands, camera) {
    const THREE = this.THREE;

    ['left', 'right'].forEach(side => {
      const handModel = this.hands[side];
      const hand = detectedHands[side];

      if (hand && hand.position) {
        handModel.group.visible = true;

        // Map normalized coordinates (x: 0..1, y: 0..1) to 3D world space directly above the tilted drum
        const normX = (hand.position.x - 0.5) * 2; // -1 to 1
        const normY = -(hand.position.y - 0.5) * 2; // 1 to -1

        // Aligned perfectly above the large 3D concert drum
        const targetX = normX * 2.1;
        const targetY = normY * 1.1 - 0.15;
        const targetZ = -1.65 + (hand.position.z || 0) * 0.9;

        // Smooth position interpolation
        handModel.group.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.55);

        // Derive natural hand pitch to match the tilted drumhead (0.42 rad) + downward stroke flick
        const vy = hand.velocity ? hand.velocity.vy : 0;
        handModel.downwardVel = vy;
        const strokeTilt = Math.max(-0.3, Math.min(0.6, vy * 0.08));

        // Base angle matches the 24-degree tilted drumhead directly underneath
        const basePitch = 0.45 + strokeTilt;
        const baseYaw = side === 'left' ? 0.22 : -0.22;
        const baseRoll = side === 'left' ? 0.18 : -0.18;

        handModel.group.rotation.x = basePitch;
        handModel.group.rotation.y = baseYaw;
        handModel.group.rotation.z = baseRoll;

        // Animate finger curl on downstroke
        const curlAmount = Math.max(0, Math.min(0.5, vy * 0.06));
        if (handModel.fingerNodes) {
          Object.values(handModel.fingerNodes).forEach(f => {
            f.fGroup.rotation.x = curlAmount;
          });
        }

        // Pulse light based on motion
        const speed = hand.velocity ? (hand.velocity.speed || 0) : 0;
        handModel.handLight.intensity = 2.2 + Math.min(3.0, speed * 0.4);

        // Extract hand and tip world positions
        handModel.group.getWorldPosition(handModel.handWorldPos);

        // Strike position: slightly forward from palm center
        const forwardOffset = new THREE.Vector3(0, 0, -0.16).applyEuler(handModel.group.rotation);
        handModel.tipWorldPos.copy(handModel.handWorldPos).add(forwardOffset);

        this.visible[side] = true;
      } else {
        handModel.group.visible = false;
        this.visible[side] = false;
      }
    });
  }

  /**
   * Pulses hand glow and light intensity upon striking
   */
  pulse(side, intensity = 1.0) {
    const hand = this.hands[side];
    if (!hand || !this.visible[side]) return;

    hand.handLight.intensity = 5.0 * intensity;
    hand.group.scale.set(1.15, 1.15, 1.15);

    setTimeout(() => {
      if (hand.group) hand.group.scale.set(1.0, 1.0, 1.0);
    }, 120);
  }

  /**
   * Returns current 3D strike position for a given hand side
   */
  getTipPosition(side) {
    if (!this.visible[side]) return null;
    return this.hands[side].tipWorldPos;
  }

  /**
   * Returns current 3D palm center position for a given hand side
   */
  getPalmPosition(side) {
    if (!this.visible[side]) return null;
    return this.hands[side].handWorldPos;
  }

  /**
   * Backward-compatible aiming ray pointing downward onto drumhead
   */
  getAimRay(side) {
    if (!this.visible[side]) return null;
    const hand = this.hands[side];
    const dir = new this.THREE.Vector3(0, -0.7, -0.7).normalize();
    return {
      origin: hand.tipWorldPos,
      direction: dir,
      color: hand.color
    };
  }

  /**
   * Backward compatibility no-op
   */
  setLaserTarget(side, hitPoint) {
    // Laser beams removed for bare-hand drumming
  }
}

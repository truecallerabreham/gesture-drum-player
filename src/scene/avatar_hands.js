/**
 * 3D Avatar Anatomical Hands - Renders realistic 3D human hands that mirror
 * and replicate the user's real hand movements, 3D position (X, Y, Z), wrist tilt/roll,
 * and dynamic multi-joint finger articulation (open hand, closed fist, drumming strike).
 * Built with Three.js.
 */

export class AvatarHands {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;

    this.hands = {
      left: this.createRealisticHand(0x00f0ff, 'left'),   // Neon Cyan accents for Left Hand
      right: this.createRealisticHand(0xffaa00, 'right')  // Neon Gold accents for Right Hand
    };

    // Backward compatibility alias
    this.sticks = this.hands;

    this.visible = {
      left: false,
      right: false
    };
  }

  /**
   * Creates an anatomically proportioned 3D human hand model
   * with forearm cuff, sculpted palm, thenar/hypothenar muscle pads,
   * and 5 multi-jointed articulated fingers (proximal, intermediate, distal phalanges).
   */
  createRealisticHand(neonColor, side) {
    const THREE = this.THREE;
    const group = new THREE.Group();

    // Natural warm human skin material with soft specular sheen
    const matSkin = new THREE.MeshStandardMaterial({
      color: 0xd6997a,
      roughness: 0.58,
      metalness: 0.04
    });

    // Slightly lighter palm and fleshy finger pad tone
    const matPalm = new THREE.MeshStandardMaterial({
      color: 0xdfab8e,
      roughness: 0.62,
      metalness: 0.02
    });

    // Clean translucent fingernail plate material
    const matNail = new THREE.MeshStandardMaterial({
      color: 0xedd5ca,
      roughness: 0.22,
      metalness: 0.08
    });

    // Forearm drummer wrist cuff
    const matCuff = new THREE.MeshStandardMaterial({
      color: 0x141828,
      roughness: 0.35,
      metalness: 0.8
    });

    // Cyber-luminescent neon accent (provides high visibility on the dark concert stage)
    const matGlow = new THREE.MeshBasicMaterial({
      color: neonColor,
      transparent: true,
      opacity: 0.9
    });

    // 1. Forearm & Wrist Joint
    const armGroup = new THREE.Group();
    const forearmGeo = new THREE.CylinderGeometry(0.048, 0.058, 0.14, 16);
    const forearmMesh = new THREE.Mesh(forearmGeo, matSkin);
    forearmMesh.rotation.x = Math.PI / 2;
    forearmMesh.position.z = 0.16;
    armGroup.add(forearmMesh);

    // Stylish wrist band with glowing neon trim accent
    const cuffGeo = new THREE.CylinderGeometry(0.052, 0.055, 0.04, 16);
    const cuffMesh = new THREE.Mesh(cuffGeo, matCuff);
    cuffMesh.rotation.x = Math.PI / 2;
    cuffMesh.position.z = 0.13;
    armGroup.add(cuffMesh);

    const cuffRingGeo = new THREE.TorusGeometry(0.054, 0.005, 8, 24);
    const cuffRing = new THREE.Mesh(cuffRingGeo, matGlow);
    cuffRing.position.z = 0.11;
    armGroup.add(cuffRing);

    group.add(armGroup);

    // 2. Anatomical Palm (Metacarpus)
    const palmGroup = new THREE.Group();

    // Main palm body: rounded box
    const palmCoreGeo = new THREE.BoxGeometry(0.12, 0.038, 0.13);
    const palmMesh = new THREE.Mesh(palmCoreGeo, matPalm);
    palmMesh.position.set(0, 0, 0.02);
    palmMesh.castShadow = true;
    palmMesh.receiveShadow = true;
    palmGroup.add(palmMesh);

    // Back of the hand dome (dorsal contour)
    const dorsalGeo = new THREE.SphereGeometry(0.065, 16, 12);
    dorsalGeo.scale(1.0, 0.32, 1.1);
    const dorsalMesh = new THREE.Mesh(dorsalGeo, matSkin);
    dorsalMesh.position.set(0, 0.012, 0.02);
    palmGroup.add(dorsalMesh);

    // Thenar Eminence (Thumb base muscle pad - inner side)
    const thumbSideX = side === 'left' ? 0.052 : -0.052;
    const thenarGeo = new THREE.SphereGeometry(0.034, 14, 12);
    thenarGeo.scale(1.2, 0.75, 1.3);
    const thenarMesh = new THREE.Mesh(thenarGeo, matPalm);
    thenarMesh.position.set(thumbSideX, -0.010, 0.04);
    thenarMesh.rotation.y = side === 'left' ? 0.35 : -0.35;
    palmGroup.add(thenarMesh);

    // Hypothenar Eminence (Pinky outer palm pad)
    const pinkySideX = side === 'left' ? -0.046 : 0.046;
    const hypothenarGeo = new THREE.SphereGeometry(0.028, 12, 10);
    hypothenarGeo.scale(1.0, 0.7, 1.3);
    const hypothenarMesh = new THREE.Mesh(hypothenarGeo, matPalm);
    hypothenarMesh.position.set(pinkySideX, -0.010, 0.035);
    palmGroup.add(hypothenarMesh);

    // Palm core power pip / subtle cyber ring on palm underside
    const pipGeo = new THREE.CircleGeometry(0.022, 16);
    const pipMesh = new THREE.Mesh(pipGeo, matGlow);
    pipMesh.rotation.x = Math.PI / 2;
    pipMesh.position.set(0, -0.020, 0.015);
    palmGroup.add(pipMesh);

    // Dynamic hand light projecting onto the drum
    const handLight = new THREE.PointLight(neonColor, 2.2, 2.5);
    handLight.position.set(0, -0.06, -0.05);
    palmGroup.add(handLight);

    group.add(palmGroup);

    // 3. Five Multi-Jointed Articulated Fingers
    // Left hand: Thumb (+X, inner), Index (+X), Middle (center), Ring (-X), Pinky (-X, outer)
    // Right hand: Thumb (-X, inner), Index (-X), Middle (center), Ring (+X), Pinky (+X, outer)
    const isLeft = side === 'left';
    const fingerConfigs = [
      {
        name: 'thumb',
        isThumb: true,
        mcpPos: [isLeft ? 0.055 : -0.055, -0.005, 0.045],
        baseAngleY: isLeft ? 0.65 : -0.65,
        baseAngleZ: isLeft ? -0.35 : 0.35,
        spreadDir: isLeft ? 1 : -1,
        lengths: [0.036, 0.032, 0.026], // Metacarpal, Proximal, Distal
        radii: [0.015, 0.014, 0.012]
      },
      {
        name: 'index',
        isThumb: false,
        mcpPos: [isLeft ? 0.038 : -0.038, 0.003, -0.048],
        baseAngleY: isLeft ? 0.12 : -0.12,
        baseAngleZ: 0,
        spreadDir: isLeft ? 0.6 : -0.6,
        lengths: [0.042, 0.028, 0.022],
        radii: [0.013, 0.012, 0.010]
      },
      {
        name: 'middle',
        isThumb: false,
        mcpPos: [isLeft ? 0.010 : -0.010, 0.005, -0.052],
        baseAngleY: 0,
        baseAngleZ: 0,
        spreadDir: 0,
        lengths: [0.048, 0.032, 0.024],
        radii: [0.014, 0.013, 0.011]
      },
      {
        name: 'ring',
        isThumb: false,
        mcpPos: [isLeft ? -0.018 : 0.018, 0.003, -0.048],
        baseAngleY: isLeft ? -0.12 : 0.12,
        baseAngleZ: 0,
        spreadDir: isLeft ? -0.6 : 0.6,
        lengths: [0.042, 0.028, 0.022],
        radii: [0.013, 0.012, 0.010]
      },
      {
        name: 'pinky',
        isThumb: false,
        mcpPos: [isLeft ? -0.044 : 0.044, -0.002, -0.040],
        baseAngleY: isLeft ? -0.28 : 0.28,
        baseAngleZ: 0,
        spreadDir: isLeft ? -1.2 : 1.2,
        lengths: [0.032, 0.022, 0.018],
        radii: [0.011, 0.010, 0.009]
      }
    ];

    const fingers = {};

    fingerConfigs.forEach(cfg => {
      // 1. Knuckle group (MCP joint)
      const mcpGroup = new THREE.Group();
      mcpGroup.position.set(cfg.mcpPos[0], cfg.mcpPos[1], cfg.mcpPos[2]);
      mcpGroup.rotation.y = cfg.baseAngleY;
      mcpGroup.rotation.z = cfg.baseAngleZ;

      // Knuckle joint sphere
      const knuckleGeo = new THREE.SphereGeometry(cfg.radii[0] * 1.15, 12, 10);
      const knuckleMesh = new THREE.Mesh(knuckleGeo, matSkin);
      mcpGroup.add(knuckleMesh);

      // Proximal bone segment (directed along -Z)
      const pLen = cfg.lengths[0];
      const pGeo = new THREE.CylinderGeometry(cfg.radii[0] * 0.9, cfg.radii[0], pLen, 10);
      const pMesh = new THREE.Mesh(pGeo, matSkin);
      pMesh.rotation.x = -Math.PI / 2;
      pMesh.position.z = -pLen * 0.5;
      mcpGroup.add(pMesh);

      // 2. Middle joint group (PIP joint) at the end of proximal bone
      const pipGroup = new THREE.Group();
      pipGroup.position.z = -pLen;

      const pipJointGeo = new THREE.SphereGeometry(cfg.radii[1] * 1.1, 10, 10);
      const pipJointMesh = new THREE.Mesh(pipJointGeo, matSkin);
      pipGroup.add(pipJointMesh);

      // Intermediate bone segment
      const iLen = cfg.lengths[1];
      const iGeo = new THREE.CylinderGeometry(cfg.radii[1] * 0.85, cfg.radii[1], iLen, 10);
      const iMesh = new THREE.Mesh(iGeo, matSkin);
      iMesh.rotation.x = -Math.PI / 2;
      iMesh.position.z = -iLen * 0.5;
      pipGroup.add(iMesh);

      // 3. Distal joint group (DIP joint) at the end of intermediate bone
      const dipGroup = new THREE.Group();
      dipGroup.position.z = -iLen;

      const dipJointGeo = new THREE.SphereGeometry(cfg.radii[2] * 1.05, 10, 10);
      const dipJointMesh = new THREE.Mesh(dipJointGeo, matSkin);
      dipGroup.add(dipJointMesh);

      // Distal bone segment & fingertip pad
      const dLen = cfg.lengths[2];
      const dGeo = new THREE.CylinderGeometry(cfg.radii[2] * 0.75, cfg.radii[2], dLen, 10);
      const dMesh = new THREE.Mesh(dGeo, matSkin);
      dMesh.rotation.x = -Math.PI / 2;
      dMesh.position.z = -dLen * 0.5;
      dipGroup.add(dMesh);

      // Rounded fleshy fingertip pad
      const tipPadGeo = new THREE.SphereGeometry(cfg.radii[2] * 0.85, 10, 10);
      tipPadGeo.scale(1.0, 0.75, 1.2);
      const tipPadMesh = new THREE.Mesh(tipPadGeo, matPalm);
      tipPadMesh.position.z = -dLen;
      dipGroup.add(tipPadMesh);

      // Smooth fingernail plate on top of distal phalanx
      const nailGeo = new THREE.BoxGeometry(cfg.radii[2] * 1.1, 0.002, dLen * 0.5);
      const nailMesh = new THREE.Mesh(nailGeo, matNail);
      nailMesh.position.set(0, cfg.radii[2] * 0.8, -dLen * 0.65);
      dipGroup.add(nailMesh);

      // Glowing fingertip contact pip on underside (for clear strike aiming)
      const tipPipGeo = new THREE.SphereGeometry(0.007, 8, 8);
      const tipPipMesh = new THREE.Mesh(tipPipGeo, matGlow);
      tipPipMesh.position.set(0, -cfg.radii[2] * 0.65, -dLen * 0.85);
      dipGroup.add(tipPipMesh);

      pipGroup.add(dipGroup);
      mcpGroup.add(pipGroup);
      palmGroup.add(mcpGroup);

      fingers[cfg.name] = {
        name: cfg.name,
        isThumb: cfg.isThumb,
        mcpGroup,
        pipGroup,
        dipGroup,
        tipPipMesh,
        baseAngleY: cfg.baseAngleY,
        baseAngleZ: cfg.baseAngleZ,
        spreadDir: cfg.spreadDir,
        totalLength: pLen + iLen + dLen
      };
    });

    group.visible = false;
    this.scene.add(group);

    return {
      group,
      palmMesh,
      pipMesh,
      handLight,
      fingers,
      color: neonColor,
      side,
      handWorldPos: new THREE.Vector3(),
      tipWorldPos: new THREE.Vector3(),
      downwardVel: 0
    };
  }

  /**
   * Updates virtual hand positions, 3D wrist orientations, and finger articulation from tracking data
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

        // 1. 3D World Position Mapping:
        // Maps normalized camera coordinates (x: 0..1, y: 0..1) directly over the tilted drum
        const normX = (hand.position.x - 0.5) * 2; // -1 to 1
        const normY = -(hand.position.y - 0.5) * 2; // 1 to -1
        const depthOffset = (hand.position.z !== undefined) ? hand.position.z : 0;

        const targetX = normX * 2.3;
        const targetY = normY * 1.35 - 0.18;
        const targetZ = -1.65 + depthOffset * 1.2;

        // Smooth position interpolation (lerp) with high responsiveness
        handModel.group.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.65);

        // 2. 3D Rotation & Wrist Orientation Replication:
        // Extract real-time roll, pitch, and yaw
        const vy = hand.velocity ? hand.velocity.vy : 0;
        handModel.downwardVel = vy;

        // Stroke downward tilt / wrist flick
        const strokeTilt = Math.max(-0.25, Math.min(0.65, vy * 0.14));
        const basePitch = 0.42 + strokeTilt; // Drumhead is tilted 24 deg (0.42 rad)

        // Real wrist roll from CV central moments:
        const realRoll = hand.rotation ? hand.rotation.roll : 0;
        // Natural drummer yaw (hands angle inward towards center sweetspot)
        const baseYaw = side === 'left' ? 0.24 : -0.24;

        // Apply smooth orientation
        const targetRot = new THREE.Euler(
          basePitch,
          baseYaw,
          side === 'left' ? (realRoll + 0.18) : (realRoll - 0.18),
          'YXZ'
        );
        handModel.group.rotation.x += (targetRot.x - handModel.group.rotation.x) * 0.5;
        handModel.group.rotation.y += (targetRot.y - handModel.group.rotation.y) * 0.5;
        handModel.group.rotation.z += (targetRot.z - handModel.group.rotation.z) * 0.5;

        // 3. Dynamic Multi-Phalanx Finger Flexion & Articulation:
        // Real hand openness: 1.0 is neutral, >1.2 is wide open, <0.8 is curled/fist
        const openness = (hand.openness !== undefined) ? hand.openness : 1.0;

        // Downward strike triggers natural finger curl into drum stroke grip
        const strikeCurl = Math.max(0, Math.min(0.65, vy * 0.12));
        // Neutral curl based on openness: open hand spreads/straightens, closed fist curls
        const openCurl = (1.15 - openness) * 0.75;
        const targetCurl = Math.max(-0.12, Math.min(1.2, openCurl + strikeCurl));

        // Finger spread factor (splay fingers when hand is wide open)
        const spreadFactor = (openness - 1.0) * 0.22;

        // Articulate each finger through its 3 joints
        Object.values(handModel.fingers).forEach(f => {
          if (f.isThumb) {
            // Thumb curls inward and forward
            const thumbCurl = Math.max(0, targetCurl * 0.8);
            f.mcpGroup.rotation.x = thumbCurl * 0.5;
            f.mcpGroup.rotation.y = f.baseAngleY + (f.spreadDir * spreadFactor);
            f.pipGroup.rotation.x = thumbCurl * 0.4;
            f.dipGroup.rotation.x = thumbCurl * 0.3;
          } else {
            // Fingers (Index, Middle, Ring, Pinky)
            f.mcpGroup.rotation.x = targetCurl * 0.45;
            f.mcpGroup.rotation.y = f.baseAngleY + (f.spreadDir * spreadFactor);
            f.pipGroup.rotation.x = targetCurl * 0.35;
            f.dipGroup.rotation.x = targetCurl * 0.20;
          }
        });

        // 4. Dynamic Lighting & Energy Glow:
        const speed = hand.velocity ? (hand.velocity.speed || 0) : 0;
        handModel.handLight.intensity = 2.0 + Math.min(3.5, speed * 0.5);

        // 5. Update World Coordinates for Drum Collision & Sweetspot Targeting:
        handModel.group.getWorldPosition(handModel.handWorldPos);

        // Middle fingertip world position (strike contact point)
        const middleFinger = handModel.fingers.middle;
        if (middleFinger && middleFinger.tipPipMesh) {
          middleFinger.tipPipMesh.getWorldPosition(handModel.tipWorldPos);
        } else {
          const forwardOffset = new THREE.Vector3(0, 0, -0.15).applyEuler(handModel.group.rotation);
          handModel.tipWorldPos.copy(handModel.handWorldPos).add(forwardOffset);
        }

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
    hand.group.scale.set(1.12, 1.12, 1.12);

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

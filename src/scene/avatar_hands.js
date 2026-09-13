/**
 * 3D Avatar Drumsticks - Renders glowing virtual drumsticks tracking hand landmarks.
 */

export class AvatarHands {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;

    this.sticks = {
      left: this.createDrumstick(0x00f0ff, 'left'), // Neon Cyan
      right: this.createDrumstick(0xff0077, 'right') // Neon Magenta
    };

    this.visible = {
      left: false,
      right: false
    };
  }

  createDrumstick(neonColor, side) {
    const THREE = this.THREE;
    const group = new THREE.Group();

    // 1. Pen Body (Sleek Stylus / Pen Barrel)
    const barrelGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.75, 16);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e30,
      metalness: 0.85,
      roughness: 0.25
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.y = -0.38;
    group.add(barrel);

    // 2. Ergonomic Pen Grip
    const gripGeo = new THREE.CylinderGeometry(0.02, 0.021, 0.26, 16);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f1c,
      roughness: 0.7,
      metalness: 0.3
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -0.55;
    group.add(grip);

    // 3. Stylus Pen Clip
    const clipGeo = new THREE.BoxGeometry(0.006, 0.22, 0.016);
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      metalness: 0.95,
      roughness: 0.1
    });
    const clip = new THREE.Mesh(clipGeo, clipMat);
    clip.position.set(0.022, -0.62, 0);
    group.add(clip);

    // 4. Metallic Conical Tip Collar
    const collarGeo = new THREE.ConeGeometry(0.017, 0.07, 16);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.2
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = -0.01;
    group.add(collar);

    // 5. Glowing Pen Stylus Tip
    const tipGeo = new THREE.SphereGeometry(0.03, 16, 16);
    const tipMat = new THREE.MeshBasicMaterial({ color: neonColor });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 0.025;
    group.add(tip);

    // 6. Glowing Neon Point Light
    const tipLight = new THREE.PointLight(neonColor, 1.8, 2.2);
    tipLight.position.y = 0.03;
    group.add(tipLight);

    // 7. Visible 3D Laser Aiming Beam
    // Uses thin glowing cylinder projecting forward from the tip
    const laserLength = 2.5;
    const laserGeo = new THREE.CylinderGeometry(0.004, 0.004, laserLength, 8);
    const laserMat = new THREE.MeshBasicMaterial({
      color: neonColor,
      transparent: true,
      opacity: 0.75
    });
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    laserBeam.position.y = 0.025 + laserLength * 0.5;
    group.add(laserBeam);

    group.visible = false;
    this.scene.add(group);

    return {
      group,
      tip,
      tipLight,
      laserBeam,
      laserLength,
      color: neonColor,
      side,
      tipWorldPos: new THREE.Vector3(),
      aimDirection: new THREE.Vector3(0, 0, -1)
    };
  }

  /**
   * Updates virtual pen position and aiming orientation from hand tracking
   * @param {Object} detectedHands - { left, right }
   * @param {THREE.Camera} camera
   */
  update(detectedHands, camera) {
    const THREE = this.THREE;

    ['left', 'right'].forEach(side => {
      const stick = this.sticks[side];
      const hand = detectedHands[side];

      if (hand && hand.position) {
        stick.group.visible = true;

        // Map normalized coordinates (x: 0..1, y: 0..1) to 3D world coordinates in front of drums
        const normX = (hand.position.x - 0.5) * 2; // -1 to 1
        const normY = -(hand.position.y - 0.5) * 2; // 1 to -1

        const targetX = normX * 2.6;
        const targetY = normY * 1.5 + 0.05;
        const targetZ = -1.9 + (hand.position.z || 0) * 1.4;

        // Smooth position interpolation
        stick.group.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.5);

        // Derive pointing pitch and yaw from tracked hand aim vector
        const downwardVel = hand.velocity ? hand.velocity.vy : 0;
        const wristFlick = Math.min(0.5, downwardVel * 0.07);

        let pitchAngle = 0.75 + wristFlick; // base forward tilt pointing towards drums
        let yawAngle = side === 'left' ? 0.15 : -0.15;

        if (hand.aimDirection) {
          // Adjust pointing based on pen tilt
          pitchAngle += hand.aimDirection.y * 0.5;
          yawAngle += hand.aimDirection.x * 0.6;
        }

        stick.group.rotation.x = pitchAngle;
        stick.group.rotation.y = yawAngle;
        stick.group.rotation.z = side === 'left' ? 0.15 : -0.15;

        // Extract tip world position
        stick.tip.getWorldPosition(stick.tipWorldPos);

        // Compute normalized 3D forward aiming direction
        // The pen points along its local +Y axis tilted into the scene
        const localForward = new THREE.Vector3(0, 1, 0);
        localForward.applyEuler(stick.group.rotation).normalize();
        stick.aimDirection.copy(localForward);

        this.visible[side] = true;
      } else {
        stick.group.visible = false;
        this.visible[side] = false;
      }
    });
  }

  /**
   * Adjusts laser beam length when a target drum is locked
   */
  setLaserTarget(side, hitPoint) {
    const stick = this.sticks[side];
    if (!stick || !this.visible[side] || !hitPoint) {
      if (stick && stick.laserBeam) {
        stick.laserBeam.scale.set(1, 1, 1);
      }
      return;
    }
    const dist = stick.tipWorldPos.distanceTo(hitPoint);
    if (stick.laserBeam && dist > 0.1) {
      stick.laserBeam.scale.y = Math.min(2.5, dist / stick.laserLength);
    }
  }

  /**
   * Returns current tip 3D position for a given hand side
   */
  getTipPosition(side) {
    if (!this.visible[side]) return null;
    return this.sticks[side].tipWorldPos;
  }

  /**
   * Returns origin and unit direction vector of the pen aiming ray
   */
  getAimRay(side) {
    if (!this.visible[side]) return null;
    const stick = this.sticks[side];
    return {
      origin: stick.tipWorldPos,
      direction: stick.aimDirection,
      color: stick.color
    };
  }
}

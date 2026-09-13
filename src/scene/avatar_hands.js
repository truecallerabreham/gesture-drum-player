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

    // 1. Shaft (Tapered Cylinder)
    const shaftGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.9, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x222638,
      metalness: 0.8,
      roughness: 0.2
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = -0.45;
    group.add(shaft);

    // 2. Handle grip
    const gripGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.35, 16);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c16,
      roughness: 0.8
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -0.65;
    group.add(grip);

    // 3. Glowing Acorn Tip
    const tipGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const tipMat = new THREE.MeshBasicMaterial({
      color: neonColor
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 0.02;
    group.add(tip);

    // 4. Tip glow point light
    const tipLight = new THREE.PointLight(neonColor, 1.5, 1.8);
    tipLight.position.y = 0.02;
    group.add(tipLight);

    group.visible = false;
    this.scene.add(group);

    return {
      group,
      tip,
      tipLight,
      color: neonColor,
      side,
      tipWorldPos: new THREE.Vector3()
    };
  }

  /**
   * Updates virtual drumsticks position from hand tracking data
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

        // Map normalized coordinates (x: 0..1, y: 0..1) to 3D view plane in front of camera
        // In screen coordinates: (0,0) is top-left, (1,1) is bottom-right
        const normX = (hand.position.x - 0.5) * 2; // -1 to 1
        const normY = -(hand.position.y - 0.5) * 2; // 1 to -1

        // Target position in 3D world space relative to drum kit plane (z ~ -2.4 to -2.0)
        const targetX = normX * 2.8;
        const targetY = normY * 1.6 + 0.1; // adjust height offset
        const targetZ = -2.2 + (hand.position.z || 0) * 1.5;

        // Smoothly interpolate stick position
        stick.group.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.45);

        // Angle stick naturally: tilted forward with slight pitch based on velocity
        const downwardVel = hand.velocity ? hand.velocity.vy : 0;
        const pitchAngle = 0.4 + Math.min(0.6, downwardVel * 0.08); // dynamic wrist flick
        const rollAngle = side === 'left' ? 0.25 : -0.25;

        stick.group.rotation.x = pitchAngle;
        stick.group.rotation.z = rollAngle;

        // Calculate tip world position for collision testing
        stick.tip.getWorldPosition(stick.tipWorldPos);
        this.visible[side] = true;
      } else {
        // Hand out of frame
        stick.group.visible = false;
        this.visible[side] = false;
      }
    });
  }

  /**
   * Returns current tip 3D position for a given hand side
   */
  getTipPosition(side) {
    if (!this.visible[side]) return null;
    return this.sticks[side].tipWorldPos;
  }
}

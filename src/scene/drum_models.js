/**
 * 3D Drum Kit Procedural Geometry, Materials and Physical Recoil Animations.
 * Built with Three.js.
 */

export class DrumKitModels {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;
    this.drums = {};
    this.recoilStates = {};

    this.createMaterials();
    this.buildKit();
  }

  createMaterials() {
    const THREE = this.THREE;

    // Chrome hardware (lugs, rims, stands)
    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      metalness: 0.95,
      roughness: 0.15
    });

    // Dark metallic drum shells with subtle shimmer
    this.matShell = new THREE.MeshStandardMaterial({
      color: 0x181c2e,
      metalness: 0.7,
      roughness: 0.3
    });

    // White drumheads
    this.matHead = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.4,
      metalness: 0.1
    });

    // Bass front head with logo
    this.matBassHead = new THREE.MeshStandardMaterial({
      color: 0x111118,
      roughness: 0.3,
      metalness: 0.2
    });

    // Brass cymbals (Hi-Hat, Crash)
    this.matBrass = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.25
    });

    // Glowing Virtual Kick Pad (Holographic center pad)
    this.matKickPad = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00aacc,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
  }

  buildKit() {
    const THREE = this.THREE;

    // Single Prominent 3D Concert Snare Drum
    // Centered directly beneath the player's natural webcam hand space with ergonomic forward tilt
    const drumPos = new THREE.Vector3(0, -0.42, -1.70);
    const drumRot = new THREE.Euler(0.42, 0, 0); // 24-degree natural ergonomic tilt aligned with webcam hands
    const drumRadius = 1.15;
    const drumHeight = 0.55;

    this.singleDrumGroup = new THREE.Group();
    this.singleDrumGroup.position.copy(drumPos);
    this.singleDrumGroup.rotation.copy(drumRot);

    // 1. Drum Shell (Midnight lacquer with chrome banding)
    const shellGeo = new THREE.CylinderGeometry(drumRadius, drumRadius, drumHeight, 48);
    const shell = new THREE.Mesh(shellGeo, this.matShell);
    shell.castShadow = true;
    shell.receiveShadow = true;
    this.singleDrumGroup.add(shell);

    // Decorative chrome center bead
    const beadGeo = new THREE.TorusGeometry(drumRadius + 0.005, 0.015, 8, 48);
    const bead = new THREE.Mesh(beadGeo, this.matChrome);
    bead.rotation.x = Math.PI / 2;
    this.singleDrumGroup.add(bead);

    // 2. Top & Bottom Heavy-Duty Chrome Hoops
    const hoopGeo = new THREE.TorusGeometry(drumRadius + 0.015, 0.038, 12, 48);
    const topHoop = new THREE.Mesh(hoopGeo, this.matChrome);
    topHoop.rotation.x = Math.PI / 2;
    topHoop.position.y = drumHeight * 0.5;
    this.singleDrumGroup.add(topHoop);

    const bottomHoop = new THREE.Mesh(hoopGeo, this.matChrome);
    bottomHoop.rotation.x = Math.PI / 2;
    bottomHoop.position.y = -drumHeight * 0.5;
    this.singleDrumGroup.add(bottomHoop);

    // 3. Coated White Top Drumhead
    const headGeo = new THREE.CircleGeometry(drumRadius - 0.01, 48);
    const topHead = new THREE.Mesh(headGeo, this.matHead);
    topHead.rotation.x = -Math.PI / 2;
    topHead.position.y = drumHeight * 0.5 + 0.005;
    topHead.receiveShadow = true;
    this.singleDrumGroup.add(topHead);

    // Visual Sweetspot Ring (Center target graphic for drummer clarity)
    const sweetspotGeo = new THREE.RingGeometry(0.44, 0.48, 48);
    const sweetspotMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const sweetspotRing = new THREE.Mesh(sweetspotGeo, sweetspotMat);
    sweetspotRing.rotation.x = -Math.PI / 2;
    sweetspotRing.position.y = drumHeight * 0.5 + 0.008;
    this.singleDrumGroup.add(sweetspotRing);

    // Center Sweetspot Dot
    const centerDotGeo = new THREE.CircleGeometry(0.07, 24);
    const centerDot = new THREE.Mesh(centerDotGeo, sweetspotMat);
    centerDot.rotation.x = -Math.PI / 2;
    centerDot.position.y = drumHeight * 0.5 + 0.009;
    this.singleDrumGroup.add(centerDot);

    // Outer Rimshot Zone Ring
    const rimZoneGeo = new THREE.RingGeometry(0.96, 1.04, 48);
    const rimZoneMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const rimZoneRing = new THREE.Mesh(rimZoneGeo, rimZoneMat);
    rimZoneRing.rotation.x = -Math.PI / 2;
    rimZoneRing.position.y = drumHeight * 0.5 + 0.008;
    this.singleDrumGroup.add(rimZoneRing);

    // 4. 10 Chrome Tension Lugs & Tuning Rods
    const numLugs = 10;
    const lugGeo = new THREE.CylinderGeometry(0.022, 0.022, drumHeight * 0.65, 8);
    for (let i = 0; i < numLugs; i++) {
      const angle = (i / numLugs) * Math.PI * 2;
      const lugX = Math.cos(angle) * (drumRadius + 0.02);
      const lugZ = Math.sin(angle) * (drumRadius + 0.02);
      const lug = new THREE.Mesh(lugGeo, this.matChrome);
      lug.position.set(lugX, 0, lugZ);
      this.singleDrumGroup.add(lug);
    }

    // 5. Snare Throw-off Lever (Side mechanical detail)
    const strainerGeo = new THREE.BoxGeometry(0.04, 0.16, 0.06);
    const strainer = new THREE.Mesh(strainerGeo, this.matChrome);
    strainer.position.set(drumRadius + 0.04, 0, 0);
    this.singleDrumGroup.add(strainer);

    // 6. Chrome Snare Stand Basket & Legs
    const basketArmGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.55, 8);
    for (let i = 0; i < 3; i++) {
      const armAngle = (i / 3) * Math.PI * 2 + Math.PI / 6;
      const arm = new THREE.Mesh(basketArmGeo, this.matChrome);
      arm.position.set(
        Math.cos(armAngle) * (drumRadius * 0.6),
        -drumHeight * 0.5 - 0.15,
        Math.sin(armAngle) * (drumRadius * 0.6)
      );
      arm.rotation.z = Math.cos(armAngle) * 0.4;
      arm.rotation.x = Math.sin(armAngle) * 0.4;
      this.singleDrumGroup.add(arm);
    }

    // Telescopic Stand Pole
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 16);
    const pole = new THREE.Mesh(poleGeo, this.matChrome);
    pole.position.y = -drumHeight * 0.5 - 0.8;
    this.singleDrumGroup.add(pole);

    // Heavy-Duty Tripod Base Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 12);
    for (let i = 0; i < 3; i++) {
      const legAngle = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(legGeo, this.matChrome);
      leg.position.set(
        Math.cos(legAngle) * 0.45,
        -drumHeight * 0.5 - 1.25,
        Math.sin(legAngle) * 0.45
      );
      leg.rotation.z = Math.cos(legAngle) * 0.7;
      leg.rotation.x = Math.sin(legAngle) * 0.7;
      this.singleDrumGroup.add(leg);
    }

    this.scene.add(this.singleDrumGroup);

    // Center point in 3D world coordinates on the drumhead surface
    const headCenterWorld = drumPos.clone().add(
      new THREE.Vector3(0, drumHeight * 0.5, 0).applyEuler(drumRot)
    );

    // Expose Main Center Drum & Rim Zones
    this.drums.snare = {
      group: this.singleDrumGroup,
      head: topHead,
      basePos: drumPos.clone(),
      baseRot: drumRot.clone(),
      center: headCenterWorld,
      radius: drumRadius * 1.25,
      height: 0.8,
      name: 'snare',
      color: 0x00f0ff,
      isCymbal: false
    };

    this.drums.rim = {
      group: this.singleDrumGroup,
      head: topHoop,
      basePos: drumPos.clone(),
      baseRot: drumRot.clone(),
      center: headCenterWorld,
      radius: drumRadius * 1.35,
      height: 0.8,
      name: 'rim',
      color: 0xffaa00,
      isCymbal: false
    };

    // Virtual Bass kick drum representation for Spacebar
    this.drums.kick = {
      group: this.singleDrumGroup,
      center: headCenterWorld,
      name: 'kick',
      color: 0x00ff88
    };
  }

  createDrumMesh({ radius, height, pos, rot, name, color }) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    group.position.copy(pos);
    if (rot) group.rotation.copy(rot);

    // Shell
    const shellGeo = new THREE.CylinderGeometry(radius, radius, height, 32);
    const shell = new THREE.Mesh(shellGeo, this.matShell);
    shell.castShadow = true;
    group.add(shell);

    // Top Rim
    const rimGeo = new THREE.TorusGeometry(radius, 0.04, 8, 32);
    const topRim = new THREE.Mesh(rimGeo, this.matChrome);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = height * 0.5;
    group.add(topRim);

    // Top Head
    const headGeo = new THREE.CircleGeometry(radius - 0.02, 32);
    const head = new THREE.Mesh(headGeo, this.matHead);
    head.rotation.x = -Math.PI / 2;
    head.position.y = height * 0.5 + 0.01;
    head.receiveShadow = true;
    group.add(head);

    // Chrome Stand Leg
    const standGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 12);
    const stand = new THREE.Mesh(standGeo, this.matChrome);
    stand.position.y = -height * 0.5 - 0.7;
    group.add(stand);

    this.scene.add(group);

    // Track strike zone bounding cylinder (generous bounds prevent tunneling)
    return {
      group,
      head,
      basePos: pos.clone(),
      baseRot: rot ? rot.clone() : new THREE.Euler(),
      center: pos.clone().add(new THREE.Vector3(0, height * 0.5, 0)),
      radius: radius * 1.35,
      height: 0.75,
      name,
      color,
      isCymbal: false
    };
  }

  createCymbalMesh({ radius, pos, rot, name, color }) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    group.position.copy(pos);
    if (rot) group.rotation.copy(rot);

    // Cymbal body (slight cone)
    const cymbalGeo = new THREE.ConeGeometry(radius, 0.1, 32);
    const cymbal = new THREE.Mesh(cymbalGeo, this.matBrass);
    cymbal.castShadow = true;
    group.add(cymbal);

    // Center bell
    const bellGeo = new THREE.SphereGeometry(radius * 0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const bell = new THREE.Mesh(bellGeo, this.matBrass);
    bell.position.y = 0.04;
    group.add(bell);

    // Chrome Stand
    const standGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.0, 12);
    const stand = new THREE.Mesh(standGeo, this.matChrome);
    stand.position.y = -1.0;
    group.add(stand);

    this.scene.add(group);

    return {
      group,
      cymbal,
      basePos: pos.clone(),
      baseRot: rot.clone(),
      center: pos.clone(),
      radius: radius * 1.35,
      height: 0.75,
      name,
      color,
      isCymbal: true
    };
  }

  createKickDrumMesh({ radius, depth, pos, name, color }) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    group.position.copy(pos);

    // Horizontal cylinder shell
    const shellGeo = new THREE.CylinderGeometry(radius, radius, depth, 32);
    const shell = new THREE.Mesh(shellGeo, this.matShell);
    shell.rotation.x = Math.PI / 2;
    shell.castShadow = true;
    group.add(shell);

    // Front & Back Chrome Rims
    const rimGeo = new THREE.TorusGeometry(radius, 0.05, 8, 32);
    const frontRim = new THREE.Mesh(rimGeo, this.matChrome);
    frontRim.position.z = depth * 0.5;
    group.add(frontRim);

    // Front resonant head
    const headGeo = new THREE.CircleGeometry(radius - 0.03, 32);
    const frontHead = new THREE.Mesh(headGeo, this.matBassHead);
    frontHead.position.z = depth * 0.5 + 0.01;
    group.add(frontHead);

    this.scene.add(group);

    return {
      group,
      basePos: pos.clone(),
      center: pos.clone(),
      radius,
      height: radius * 1.5,
      name,
      color,
      isCymbal: false
    };
  }

  createVirtualPadMesh({ radius, pos, name, color }) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    group.position.copy(pos);

    // Circular pad
    const padGeo = new THREE.CylinderGeometry(radius, radius, 0.06, 32);
    const pad = new THREE.Mesh(padGeo, this.matKickPad);
    group.add(pad);

    // Glowing Neon Ring
    const ringGeo = new THREE.TorusGeometry(radius + 0.02, 0.03, 8, 32);
    const matRing = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring = new THREE.Mesh(ringGeo, matRing);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    this.scene.add(group);

    return {
      group,
      basePos: pos.clone(),
      center: pos.clone(),
      radius: radius * 1.35,
      height: 0.65,
      name,
      color,
      isCymbal: false
    };
  }

  /**
   * Triggers physical recoil and vibration upon strike
   */
  triggerRecoil(drumName, velocity = 1.0) {
    const drum = this.drums[drumName] || (drumName === 'kick' ? this.drums.kickpad : null);
    if (!drum) return;

    this.recoilStates[drumName] = {
      startTime: performance.now(),
      intensity: velocity,
      isCymbal: drum.isCymbal
    };
  }

  /**
   * Updates physical recoil/wobble animations in render loop
   */
  update(now) {
    for (const [name, state] of Object.entries(this.recoilStates)) {
      const drum = this.drums[name] || (name === 'kick' ? this.drums.kickpad : null);
      if (!drum) continue;

      const elapsed = (now - state.startTime) / 1000;
      if (elapsed > 0.4) {
        // Recoil finished
        drum.group.position.copy(drum.basePos);
        if (drum.baseRot) drum.group.rotation.copy(drum.baseRot);
        delete this.recoilStates[name];
        continue;
      }

      const decay = Math.exp(-elapsed * 12);
      if (drum.isCymbal) {
        // Cymbal rotational wobble
        const wobble = Math.sin(elapsed * 40) * 0.12 * state.intensity * decay;
        drum.group.rotation.x = drum.baseRot.x + wobble;
        drum.group.rotation.z = drum.baseRot.z + wobble * 0.7;
      } else {
        // Drumhead vertical bounce recoil
        const bounce = Math.sin(elapsed * 45) * 0.08 * state.intensity * decay;
        drum.group.position.y = drum.basePos.y - Math.abs(bounce);
      }
    }
  }
}

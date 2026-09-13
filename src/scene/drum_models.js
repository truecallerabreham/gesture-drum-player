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

    // 1. SNARE DRUM (Center-Left: reachable at x: -0.9, y: -0.2, z: -2.1)
    this.drums.snare = this.createDrumMesh({
      radius: 0.65,
      height: 0.4,
      pos: new THREE.Vector3(-0.9, -0.2, -2.1),
      rot: new THREE.Euler(0.1, 0.15, 0),
      name: 'snare',
      color: 0x00f0ff
    });

    // 2. HI-HAT CYMBALS (Left: reachable at x: -1.8, y: 0.25, z: -2.1)
    this.drums.hihat = this.createCymbalMesh({
      radius: 0.6,
      pos: new THREE.Vector3(-1.8, 0.25, -2.1),
      rot: new THREE.Euler(0.12, 0.2, 0),
      name: 'hihat',
      color: 0xffaa00
    });

    // 3. HIGH TOM (Center-Upper Left: reachable at x: -0.55, y: 0.35, z: -2.3)
    this.drums.tom1 = this.createDrumMesh({
      radius: 0.55,
      height: 0.45,
      pos: new THREE.Vector3(-0.55, 0.35, -2.3),
      rot: new THREE.Euler(0.3, 0.15, 0),
      name: 'tom1',
      color: 0x3388ff
    });

    // 4. FLOOR / LOW TOM (Center-Right: reachable at x: 1.0, y: -0.2, z: -2.1)
    this.drums.tom2 = this.createDrumMesh({
      radius: 0.7,
      height: 0.5,
      pos: new THREE.Vector3(1.0, -0.2, -2.1),
      rot: new THREE.Euler(0.1, -0.15, 0),
      name: 'tom2',
      color: 0xaa00ff
    });

    // 5. CRASH CYMBAL (Right: reachable at x: 1.7, y: 0.5, z: -2.2)
    this.drums.crash = this.createCymbalMesh({
      radius: 0.8,
      pos: new THREE.Vector3(1.7, 0.5, -2.2),
      rot: new THREE.Euler(0.25, -0.25, 0),
      name: 'crash',
      color: 0xff0055
    });

    // 6. BASS / KICK DRUM (Center Floor visual)
    this.drums.kick = this.createKickDrumMesh({
      radius: 1.0,
      depth: 0.9,
      pos: new THREE.Vector3(0, -0.75, -2.7),
      name: 'kick',
      color: 0x00f0ff
    });

    // 7. CENTER VIRTUAL KICK HAND-PAD (Reachable floating pad: x: 0, y: -0.55, z: -2.0)
    this.drums.kickpad = this.createVirtualPadMesh({
      radius: 0.55,
      pos: new THREE.Vector3(0, -0.55, -2.0),
      name: 'kickpad',
      color: 0x00f0ff
    });
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

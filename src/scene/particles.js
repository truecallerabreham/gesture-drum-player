/**
 * Neon Particle Sparks and Dynamic Stage Lighting Effects.
 */

export class ParticleEffects {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;
    this.maxParticles = 600;
    this.activeSparks = [];

    this.createParticleSystem();
  }

  createParticleSystem() {
    const THREE = this.THREE;

    this.geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Particle Material with additive blending
    this.mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleMesh = new THREE.Points(this.geo, this.mat);
    this.scene.add(this.particleMesh);
  }

  /**
   * Spawns a burst of neon sparks at the given 3D position
   * @param {THREE.Vector3} position - Strike location
   * @param {number} hexColor - Particle color (e.g. 0x00f0ff, 0xff0077)
   * @param {number} count - Number of sparks
   * @param {number} velocity - Hit force scaling
   */
  emitBurst(position, hexColor = 0x00f0ff, count = 35, velocity = 1.0) {
    const THREE = this.THREE;
    const color = new THREE.Color(hexColor);
    const speedScale = 2.5 * velocity;

    for (let i = 0; i < count; i++) {
      if (this.activeSparks.length >= this.maxParticles) {
        this.activeSparks.shift(); // Evict oldest
      }

      // Random spherical explosion vector with upward bias
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // upward hemisphere
      const speed = (Math.random() * 0.8 + 0.2) * speedScale;

      const vx = Math.cos(theta) * Math.sin(phi) * speed;
      const vy = Math.cos(phi) * speed * 1.2 + 0.5; // upward bounce
      const vz = Math.sin(theta) * Math.sin(phi) * speed;

      this.activeSparks.push({
        x: position.x + (Math.random() - 0.5) * 0.1,
        y: position.y + 0.05,
        z: position.z + (Math.random() - 0.5) * 0.1,
        vx,
        vy,
        vz,
        color,
        life: 1.0,
        decay: Math.random() * 1.5 + 2.0 // dies in ~0.3 - 0.5s
      });
    }
  }

  /**
   * Updates particle positions and decay
   */
  update(dt) {
    const posAttr = this.geo.attributes.position;
    const colAttr = this.geo.attributes.color;

    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const p = this.activeSparks[i];
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.activeSparks.splice(i, 1);
        continue;
      }

      // Physics integration (gravity + air drag)
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 9.8 * dt * 0.6; // subtle gravity

      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vz *= 0.96;
    }

    // Update GPU buffers
    for (let i = 0; i < this.maxParticles; i++) {
      const idx3 = i * 3;
      if (i < this.activeSparks.length) {
        const p = this.activeSparks[i];
        this.positions[idx3] = p.x;
        this.positions[idx3 + 1] = p.y;
        this.positions[idx3 + 2] = p.z;

        // Fade color with remaining life
        this.colors[idx3] = p.color.r * p.life;
        this.colors[idx3 + 1] = p.color.g * p.life;
        this.colors[idx3 + 2] = p.color.b * p.life;
      } else {
        // Hide inactive particles far away
        this.positions[idx3] = 0;
        this.positions[idx3 + 1] = -999;
        this.positions[idx3 + 2] = 0;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }
}

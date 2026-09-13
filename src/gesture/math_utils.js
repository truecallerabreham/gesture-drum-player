/**
 * Math and Physics Utilities for Gesture Tracking and Hit Detection.
 */

export class MathUtils {
  /**
   * Euclidean distance between two 3D points
   */
  static distance3D(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Exponential Moving Average filter for vector coordinates
   * @param {Object} current - New raw landmark point {x, y, z}
   * @param {Object} previous - Smoothed previous point {x, y, z}
   * @param {number} alpha - Smoothing factor (0 = full previous, 1 = full current)
   */
  static smoothPoint(current, previous, alpha = 0.7) {
    if (!previous) return { ...current };
    return {
      x: previous.x + alpha * (current.x - previous.x),
      y: previous.y + alpha * (current.y - previous.y),
      z: (previous.z || 0) + alpha * ((current.z || 0) - (previous.z || 0))
    };
  }

  /**
   * Calculates instantaneous velocity given current and previous positions
   * @param {Object} current - Point at time t
   * @param {Object} previous - Point at time t - dt
   * @param {number} dt - Time delta in seconds
   * @returns {Object} - Velocity components {vx, vy, vz, speed}
   */
  static calculateVelocity(current, previous, dt) {
    if (!previous || dt <= 0) {
      return { vx: 0, vy: 0, vz: 0, speed: 0 };
    }
    const vx = (current.x - previous.x) / dt;
    const vy = (current.y - previous.y) / dt;
    const vz = ((current.z || 0) - (previous.z || 0)) / dt;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    return { vx, vy, vz, speed };
  }

  /**
   * Tests if a 3D point lies within a cylinder with vertical axis Y
   * @param {Object} point - {x, y, z}
   * @param {Object} center - Cylinder base center {x, y, z}
   * @param {number} radius - Cylinder radius
   * @param {number} height - Cylinder vertical height
   * @returns {boolean}
   */
  static pointInCylinder(point, center, radius, height) {
    const dx = point.x - center.x;
    const dz = point.z - center.z;
    const horizontalDistSq = dx * dx + dz * dz;
    if (horizontalDistSq > radius * radius) {
      return false;
    }
    const yMin = center.y - height * 0.5;
    const yMax = center.y + height * 0.5;
    return point.y >= yMin && point.y <= yMax;
  }

  /**
   * Clamps a value between min and max
   */
  static clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Maps a value from one range to another with optional clamping
   */
  static mapRange(val, inMin, inMax, outMin, outMax, clamp = true) {
    let result = outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
    if (clamp) {
      const low = Math.min(outMin, outMax);
      const high = Math.max(outMin, outMax);
      result = MathUtils.clamp(result, low, high);
    }
    return result;
  }

  /**
   * Calculates minimum perpendicular distance from a 3D forward ray to a point
   * @param {Object} rayOrigin - {x, y, z}
   * @param {Object} rayDir - {x, y, z} normalized
   * @param {Object} targetPoint - {x, y, z}
   * @returns {number} Distance in units
   */
  static rayDistanceToPoint(rayOrigin, rayDir, targetPoint) {
    const vx = targetPoint.x - rayOrigin.x;
    const vy = targetPoint.y - rayOrigin.y;
    const vz = (targetPoint.z || 0) - (rayOrigin.z || 0);

    const t = Math.max(0, vx * rayDir.x + vy * rayDir.y + vz * rayDir.z);
    const closestX = rayOrigin.x + t * rayDir.x;
    const closestY = rayOrigin.y + t * rayDir.y;
    const closestZ = (rayOrigin.z || 0) + t * rayDir.z;

    return MathUtils.distance3D(targetPoint, { x: closestX, y: closestY, z: closestZ });
  }

  /**
   * Tests if a forward ray intersects a 3D circular disc/drumhead
   */
  static rayIntersectsDisc(rayOrigin, rayDir, discCenter, discRadius, planeNormal = { x: 0, y: 1, z: 0 }) {
    const denom = rayDir.x * planeNormal.x + rayDir.y * planeNormal.y + rayDir.z * planeNormal.z;
    if (Math.abs(denom) < 0.0001) {
      return null; // Parallel to disc plane
    }

    const vx = discCenter.x - rayOrigin.x;
    const vy = discCenter.y - rayOrigin.y;
    const vz = discCenter.z - (rayOrigin.z || 0);
    const t = (vx * planeNormal.x + vy * planeNormal.y + vz * planeNormal.z) / denom;

    if (t < 0.1 || t > 15.0) {
      return null; // Behind ray or too far
    }

    const hitPoint = {
      x: rayOrigin.x + t * rayDir.x,
      y: rayOrigin.y + t * rayDir.y,
      z: (rayOrigin.z || 0) + t * rayDir.z
    };

    const distToCenter = MathUtils.distance3D(hitPoint, discCenter);
    if (distToCenter <= discRadius) {
      return { hitPoint, distance: t, distToCenter };
    }
    return null;
  }
}

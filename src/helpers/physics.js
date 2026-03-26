import { PHYSICS } from '@/hooks/useTreeStore'

export function computeGravityForce(pos1, mass1, pos2, mass2) {
  const dx = pos2[0] - pos1[0]
  const dy = pos2[1] - pos1[1]
  const distSq = Math.max(dx * dx + dy * dy, PHYSICS.minGravityDist * PHYSICS.minGravityDist)
  const dist = Math.sqrt(distSq)
  const force = (PHYSICS.G * mass1 * mass2) / distSq
  return [
    (force * dx) / dist,
    (force * dy) / dist,
  ]
}

export function clampVelocity(vel) {
  const speed = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1])
  if (speed > PHYSICS.maxVelocity) {
    const scale = PHYSICS.maxVelocity / speed
    return [vel[0] * scale, vel[1] * scale]
  }
  return vel
}

export function applyBounce(pos1, pos2, vel1, vel2) {
  const dx = pos2[0] - pos1[0]
  const dy = pos2[1] - pos1[1]
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < PHYSICS.bounceDist && dist > 0) {
    const nx = dx / dist
    const ny = dy / dist
    const overlap = PHYSICS.bounceDist - dist
    const pushStrength = overlap * PHYSICS.bounceStrength
    return {
      vel1: [vel1[0] - nx * pushStrength, vel1[1] - ny * pushStrength],
      vel2: [vel2[0] + nx * pushStrength, vel2[1] + ny * pushStrength],
    }
  }
  return { vel1, vel2 }
}

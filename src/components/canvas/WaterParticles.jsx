'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTreeStore } from '@/hooks/useTreeStore'

const PARTICLE_COUNT = 6

export default function WaterParticles() {
  const particlesRef = useRef([])
  const groupRef = useRef()

  // Initialize particle data
  if (particlesRef.current.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.push({
        t: i / PARTICLE_COUNT, // progress along path 0-1
        active: false,
        targetX: 0,
        targetY: 0,
      })
    }
  }

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const cursor = useTreeStore.getState().cursorWorldPos
    const trees = useTreeStore.getState().trees
    let wateringTree = null

    trees.forEach((tree) => {
      if (tree.isWatering) wateringTree = tree
    })

    particlesRef.current.forEach((p, i) => {
      const mesh = groupRef.current.children[i]
      if (!mesh) return

      if (wateringTree) {
        p.active = true
        p.targetX = wateringTree.position[0]
        p.targetY = wateringTree.position[1]
        p.t += delta * (1.5 + Math.random() * 0.5)
        if (p.t > 1) p.t -= 1

        // Lerp from cursor to tree with a slight curve
        const t = p.t
        const cx = cursor[0] + (p.targetX - cursor[0]) * t
        const cy = cursor[1] + (p.targetY - cursor[1]) * t
        const offset = Math.sin(t * Math.PI) * 15 * (i % 2 === 0 ? 1 : -1)

        mesh.position.set(cx + offset * 0.3, cy + offset, 0.5)
        mesh.material.opacity = Math.sin(t * Math.PI) * 0.6
        mesh.visible = true
      } else {
        p.active = false
        mesh.visible = false
      }
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <mesh key={i} visible={false}>
          <circleGeometry args={[2.5, 8]} />
          <meshBasicMaterial color='#66ccff' transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

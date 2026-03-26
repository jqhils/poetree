'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTreeStore } from '@/hooks/useTreeStore'

export default function AmbientWater() {
  const groupRef = useRef()
  const meshRefs = useRef([])

  useFrame(() => {
    if (!groupRef.current) return

    const drops = useTreeStore.getState().waterDrops

    // Ensure we have enough meshes
    const children = groupRef.current.children
    for (let i = 0; i < children.length; i++) {
      if (i < drops.length) {
        const drop = drops[i]
        children[i].position.set(drop.position[0], drop.position[1], 0.5)
        children[i].material.opacity = drop.opacity * 0.5
        children[i].visible = true
      } else {
        children[i].visible = false
      }
    }
  })

  // Pre-allocate pool of meshes
  const poolSize = 20

  return (
    <group ref={groupRef}>
      {Array.from({ length: poolSize }).map((_, i) => (
        <mesh key={i} visible={false}>
          <circleGeometry args={[3, 8]} />
          <meshBasicMaterial color='#4499cc' transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

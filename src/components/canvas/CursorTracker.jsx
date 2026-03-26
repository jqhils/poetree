'use client'

import { useTreeStore } from '@/hooks/useTreeStore'

export default function CursorTracker() {
  const setCursorPos = useTreeStore((s) => s.setCursorPos)

  return (
    <mesh
      position={[0, 0, -1]}
      onPointerMove={(e) => {
        setCursorPos(e.point.x, e.point.y)
      }}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

'use client'

import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { r3f } from '@/helpers/global'

export default function Scene({ ...props }) {
  return (
    <Canvas
      {...props}
      orthographic
      camera={{ zoom: 1, position: [0, 0, 100], near: 0.1, far: 1000 }}
      gl={{ antialias: true }}
    >
      <color attach='background' args={['#000000']} />
      {/* @ts-ignore */}
      <r3f.Out />
      <Preload all />
    </Canvas>
  )
}

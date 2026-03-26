'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTreeStore, PHYSICS } from '@/hooks/useTreeStore'

const MAX_TREES = 30

const vertexShader = `
  uniform vec3 treePosns[${MAX_TREES}];
  uniform int treeCount;
  uniform vec3 cursorPos; // xy = position, z = mass

  varying vec2 vUv;
  varying vec2 vWorldPos;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Cursor gravity distortion
    vec2 cursorDir = cursorPos.xy - pos.xy;
    float cursorDist = max(length(cursorDir), 30.0);
    float cursorStrength = cursorPos.z / (cursorDist * cursorDist) * ${PHYSICS.gridDistortion.toFixed(1)};
    pos.xy += normalize(cursorDir) * cursorStrength;

    // Tree gravity distortion
    for (int i = 0; i < ${MAX_TREES}; i++) {
      if (i >= treeCount) break;
      vec2 dir = treePosns[i].xy - pos.xy;
      float dist = max(length(dir), 30.0);
      float strength = treePosns[i].z / (dist * dist) * ${PHYSICS.gridDistortion.toFixed(1)};
      pos.xy += normalize(dir) * strength;
    }

    vWorldPos = pos.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  varying vec2 vWorldPos;

  void main() {
    // Grid lines based on world position — use smoothstep instead of fwidth
    float gridSize = 40.0;
    vec2 coord = mod(vWorldPos, gridSize);
    float lineWidth = 1.0;

    float lineX = smoothstep(lineWidth, 0.0, coord.x) + smoothstep(gridSize - lineWidth, gridSize, coord.x);
    float lineY = smoothstep(lineWidth, 0.0, coord.y) + smoothstep(gridSize - lineWidth, gridSize, coord.y);
    float alpha = clamp(lineX + lineY, 0.0, 1.0) * 0.12;

    gl_FragColor = vec4(0.3, 0.5, 0.6, alpha);
  }
`

export default function SpacetimeGrid() {
  const meshRef = useRef()
  const materialRef = useRef()
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      treePosns: { value: new Array(MAX_TREES).fill(new THREE.Vector3()) },
      treeCount: { value: 0 },
      cursorPos: { value: new THREE.Vector3(0, 0, PHYSICS.cursorMass) },
    }),
    [],
  )

  useFrame(() => {
    if (!materialRef.current) return

    const trees = useTreeStore.getState().trees
    const cursor = useTreeStore.getState().cursorWorldPos
    const arr = uniforms.treePosns.value
    let i = 0

    trees.forEach((tree) => {
      if (i < MAX_TREES) {
        arr[i] = new THREE.Vector3(tree.position[0], tree.position[1], tree.mass)
        i++
      }
    })

    uniforms.treeCount.value = i
    uniforms.cursorPos.value.set(cursor[0], cursor[1], PHYSICS.cursorMass)
  })

  // Size grid to cover viewport with margin
  const width = Math.max(viewport.width * 1.5, 2000)
  const height = Math.max(viewport.height * 1.5, 2000)

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <planeGeometry args={[width, height, 80, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useTreeStore, PHYSICS } from '@/hooks/useTreeStore'

const FONT_URL = '/fonts/SpaceMono.ttf'
const BASE_FONT_SIZE = 18
const LINE_HEIGHT = 2.0

export default function PoemTree({ id, groupRef }) {
  const tree = useTreeStore((s) => s.trees.get(id))
  const harvestTree = useTreeStore((s) => s.harvestTree)
  const localRef = useRef()
  const [harvestAnim, setHarvestAnim] = useState(false)
  const harvestScale = useRef(1)

  useEffect(() => {
    if (groupRef) groupRef.current = localRef.current
  }, [groupRef])

  useFrame((_, delta) => {
    if (!localRef.current || !tree) return

    // Gentle rotation — clamp to ±0.15 rad so text stays readable
    const maxAngle = 0.15
    localRef.current.rotation.z += tree.rotation
    localRef.current.rotation.z = Math.max(-maxAngle, Math.min(maxAngle, localRef.current.rotation.z))

    // Harvest collapse animation
    if (harvestAnim) {
      harvestScale.current -= delta * 3
      if (harvestScale.current <= 0) {
        harvestTree(id)
        return
      }
      localRef.current.scale.setScalar(harvestScale.current)
    }

    // Watering pulse
    if (tree.isWatering && !harvestAnim) {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.03
      localRef.current.scale.setScalar(pulse)
    } else if (!harvestAnim) {
      localRef.current.scale.setScalar(1)
    }
  })

  if (!tree) return null

  // Determine what text to show
  const hasPoem = !!tree.fullPoem
  const isFullyRevealed = hasPoem && tree.revealedChars >= tree.fullPoem.length
  const isHarvestable = isFullyRevealed

  // Split poem into lines for vertical stacking
  const lines = hasPoem ? tree.fullPoem.split('\n') : []

  // Calculate how many chars are revealed per line
  let charsRemaining = Math.floor(tree.revealedChars)
  const fadeChars = 4
  const revealedPerLine = []

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    if (charsRemaining >= line.length) {
      revealedPerLine.push({ solid: line, fading: '' })
      charsRemaining -= line.length
      if (li < lines.length - 1) charsRemaining -= 1
    } else if (charsRemaining > 0) {
      const solidEnd = Math.max(0, charsRemaining - fadeChars)
      revealedPerLine.push({
        solid: line.substring(0, solidEnd),
        fading: line.substring(solidEnd, charsRemaining),
      })
      charsRemaining = 0
    } else {
      revealedPerLine.push({ solid: '', fading: '' })
    }
  }

  // Color: shifts based on progress, turns orange past threshold
  const progress = hasPoem ? tree.revealedChars / tree.fullPoem.length : 0
  let color
  if (isHarvestable) {
    color = '#ffdd88'
  } else if (progress >= PHYSICS.orangeThreshold) {
    // Lerp from green to orange as it passes the threshold
    const orangeProgress = (progress - PHYSICS.orangeThreshold) / (1 - PHYSICS.orangeThreshold)
    color = lerpColor('#aaccaa', '#ee8833', orangeProgress)
  } else {
    color = lerpColor('#556677', '#aaccaa', progress / PHYSICS.orangeThreshold)
  }

  // Font size grows slightly with progress
  const fontSize = BASE_FONT_SIZE + progress * 6

  const handleClick = (e) => {
    e.stopPropagation()
    if (isHarvestable && !harvestAnim) {
      setHarvestAnim(true)
    }
  }

  return (
    <group
      ref={localRef}
      position={[tree.position[0], tree.position[1], 0]}
      onClick={handleClick}
    >
      {/* Theme label — above poem, fades as poem grows */}
      <Text
        position={[0, fontSize * 0.8, 0]}
        fontSize={10}
        color='#667788'
        anchorX='left'
        anchorY='middle'
        font={FONT_URL}
        fillOpacity={tree.opacity * Math.max(0.15, 1 - progress * 1.5)}
        maxWidth={300}
        textAlign='left'
      >
        {tree.theme}
      </Text>

      {/* Poem lines — top-to-bottom, left-aligned */}
      {revealedPerLine.map((parts, i) => {
        const revealed = parts.solid + parts.fading
        if (!revealed) return null
        const y = -(i + 0.5) * (fontSize * LINE_HEIGHT)
        const x = 0

        // Fade: chars near the reveal edge are slightly transparent
        const hasFading = parts.fading.length > 0
        const fadeOpacity = hasFading
          ? tree.opacity * (0.6 + 0.4 * (parts.solid.length / Math.max(revealed.length, 1)))
          : tree.opacity

        return (
          <Text
            key={i}
            position={[x, y, 0]}
            fontSize={fontSize}
            color={color}
            anchorX='left'
            anchorY='middle'
            font={FONT_URL}
            fillOpacity={fadeOpacity}
            maxWidth={300}
            textAlign='left'
          >
            {revealed}
          </Text>
        )
      })}

      {/* Fetching indicator */}
      {tree.isFetchingPoem && (
        <Text
          position={[0, -(fontSize * LINE_HEIGHT * 0.5), 0]}
          fontSize={10}
          color='#88ccaa'
          anchorX='left'
          fillOpacity={0.5 + Math.sin(Date.now() * 0.005) * 0.3}
          font={FONT_URL}
        >
          ...
        </Text>
      )}

      {/* Harvestable glow ring */}
      {isHarvestable && (
        <mesh position={[60, -(lines.length * fontSize * LINE_HEIGHT) / 2, -0.1]}>
          <ringGeometry args={[fontSize * 5, fontSize * 5 + 2, 32]} />
          <meshBasicMaterial color='#ffdd88' transparent opacity={0.2 + Math.sin(Date.now() * 0.003) * 0.1} />
        </mesh>
      )}

      {/* Life indicator ring */}
      {!isHarvestable && (
        <mesh position={[0, fontSize * 1.8, -0.1]}>
          <ringGeometry
            args={[
              8, 10, 32, 1, 0,
              Math.PI * 2 * Math.max(0, 1 - (Date.now() - tree.spawnTime) / tree.lifespan),
            ]}
          />
          <meshBasicMaterial color='#445566' transparent opacity={0.3 * tree.opacity} />
        </mesh>
      )}
    </group>
  )
}

// Simple hex color lerp
function lerpColor(a, b, t) {
  t = Math.max(0, Math.min(1, t))
  const ah = parseInt(a.replace('#', ''), 16)
  const bh = parseInt(b.replace('#', ''), 16)
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`
}

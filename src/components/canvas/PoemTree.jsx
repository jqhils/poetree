'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useTreeStore, PHYSICS } from '@/hooks/useTreeStore'

const FONT_EN = '/fonts/SpaceMono.ttf'
const FONT_ZH = '/fonts/NotoSansSC.otf'
const FONT_AR = '/fonts/NotoSansArabic.ttf'
const BASE_FONT_SIZE = 12
const LINE_HEIGHT = 1.8
const CHAR_WIDTH_RATIO = 0.6

// Geometric indent patterns — cycles through as poem grows
const PATTERNS = [
  (i, count) => Math.abs(i - count / 2) / (count / 2), // diamond
  (i, count) => i / count, // staircase right
  (i, count) => 1 - i / count, // staircase left
  (i, count) => Math.sin((i / count) * Math.PI), // wave bulge
  (i, count) => (i % 2) * 0.5, // zigzag
]

const RAINBOW_COLORS = [
  '#ff4444', '#ff8800', '#ffdd00', '#44dd44',
  '#4488ff', '#8844ff', '#ff44cc',
]

export default function PoemTree({ id, groupRef }) {
  const tree = useTreeStore((s) => s.trees.get(id))
  const harvestTree = useTreeStore((s) => s.harvestTree)
  const localRef = useRef()
  const [harvestAnim, setHarvestAnim] = useState(false)
  const harvestScale = useRef(1)
  // Stable pattern index per tree
  const patternIdx = useRef(Math.floor(Math.random() * PATTERNS.length))

  useEffect(() => {
    if (groupRef) groupRef.current = localRef.current
  }, [groupRef])

  useFrame((_, delta) => {
    if (!localRef.current || !tree) return

    // Free rotation
    localRef.current.rotation.z += tree.rotation

    if (harvestAnim) {
      harvestScale.current -= delta * 3
      if (harvestScale.current <= 0) {
        harvestTree(id)
        return
      }
      localRef.current.scale.setScalar(harvestScale.current)
    }
  })

  if (!tree) return null

  const hasPoem = !!tree.fullPoem
  const isFullyRevealed = hasPoem && tree.revealedChars >= tree.fullPoem.length
  const isHarvestable = isFullyRevealed

  let poemText = hasPoem ? tree.fullPoem : ''
  // Chinese poems end with ciggie emoji
  if (tree.lang === 'zh' && hasPoem && !poemText.endsWith('🚬')) {
    poemText = poemText + '\n🚬'
  }

  const lines = poemText ? poemText.split('\n') : []

  // Calculate revealed chars per line
  let charsRemaining = Math.floor(tree.revealedChars)
  const revealedPerLine = []

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    if (charsRemaining >= line.length) {
      revealedPerLine.push(line)
      charsRemaining -= line.length
      if (li < lines.length - 1) charsRemaining -= 1
    } else if (charsRemaining > 0) {
      revealedPerLine.push(line.substring(0, charsRemaining))
      charsRemaining = 0
    } else {
      revealedPerLine.push('')
    }
  }

  const progress = hasPoem ? tree.revealedChars / tree.fullPoem.length : 0

  // Solid color: white, or orange past threshold. Rainbow overrides.
  const baseColor = progress >= PHYSICS.orangeThreshold ? '#ee8833' : '#ffffff'

  const fontSize = BASE_FONT_SIZE + progress * 4
  const fontUrl = tree.lang === 'zh' ? FONT_ZH : tree.lang === 'ar' ? FONT_AR : FONT_EN
  const isRTL = tree.lang === 'ar'

  // Geometric indent pattern
  const pattern = PATTERNS[patternIdx.current]
  const revealedCount = revealedPerLine.filter((t) => t.length > 0).length
  const maxIndent = 60

  const handleClick = (e) => {
    e.stopPropagation()
    if (isHarvestable && !harvestAnim) {
      setHarvestAnim(true)
    }
  }

  const poemCenterY = revealedCount > 0 ? -(revealedCount * fontSize * LINE_HEIGHT) / 2 : 0

  // For rainbow: assign a color per word using time-based offset
  const now = Date.now()

  return (
    <group
      ref={localRef}
      position={[tree.position[0], tree.position[1], 0]}
      onClick={handleClick}
    >
      {/* Dot */}
      <mesh position={[-12, poemCenterY, 0]}>
        <circleGeometry args={[2.5, 16]} />
        <meshBasicMaterial
          color={tree.isRainbow ? RAINBOW_COLORS[Math.floor(now / 100) % RAINBOW_COLORS.length] : baseColor}
          transparent
          opacity={tree.opacity}
        />
      </mesh>

      {/* Poem lines */}
      {tree.isRainbow
        ? // Rainbow mode: render each word separately with its own color
          revealedPerLine.map((text, i) => {
            if (!text) return null
            const y = -(i + 0.5) * (fontSize * LINE_HEIGHT)
            const indent = pattern(i, Math.max(revealedCount, 1)) * maxIndent
            const words = text.split(' ')
            let xOffset = indent
            return (
              <group key={i} position={[0, y, 0]}>
                {words.map((word, wi) => {
                  const colorIdx = (i * 7 + wi + Math.floor(now / 150)) % RAINBOW_COLORS.length
                  const wordX = xOffset
                  // Estimate word width
                  xOffset += (word.length + 1) * CHAR_WIDTH_RATIO * fontSize
                  return (
                    <Text
                      key={wi}
                      position={[wordX, 0, 0]}
                      fontSize={fontSize}
                      color={RAINBOW_COLORS[colorIdx]}
                      anchorX='left'
                      anchorY='middle'
                      font={fontUrl}
                      fillOpacity={tree.opacity}
                    >
                      {word}
                    </Text>
                  )
                })}
              </group>
            )
          })
        : // Normal mode
          revealedPerLine.map((text, i) => {
            if (!text) return null
            const y = -(i + 0.5) * (fontSize * LINE_HEIGHT)
            const indent = pattern(i, Math.max(revealedCount, 1)) * maxIndent

            return (
              <Text
                key={i}
                position={[indent, y, 0]}
                fontSize={fontSize}
                color={baseColor}
                anchorX={isRTL ? 'right' : 'left'}
                anchorY='middle'
                font={fontUrl}
                fillOpacity={tree.opacity}
                maxWidth={400}
                textAlign={isRTL ? 'right' : 'left'}
                direction={isRTL ? 'rtl' : 'ltr'}
              >
                {text}
              </Text>
            )
          })}

      {/* Fetching indicator */}
      {tree.isFetchingPoem && revealedCount === 0 && (
        <mesh position={[-12, 0, 0]}>
          <ringGeometry args={[4, 6, 16]} />
          <meshBasicMaterial color='#88ccaa' transparent opacity={0.4} />
        </mesh>
      )}

      {/* Harvestable glow ring */}
      {isHarvestable && (
        <mesh position={[60, poemCenterY, -0.1]}>
          <ringGeometry args={[fontSize * 6, fontSize * 6 + 2, 32]} />
          <meshBasicMaterial color='#ee8833' transparent opacity={0.2} />
        </mesh>
      )}

      {/* Life indicator ring */}
      {!isHarvestable && (
        <mesh position={[-12, poemCenterY + 14, -0.1]}>
          <ringGeometry
            args={[
              6, 8, 32, 1, 0,
              Math.PI * 2 * Math.max(0, 1 - (Date.now() - tree.spawnTime) / tree.lifespan),
            ]}
          />
          <meshBasicMaterial color='#445566' transparent opacity={0.3 * tree.opacity} />
        </mesh>
      )}
    </group>
  )
}

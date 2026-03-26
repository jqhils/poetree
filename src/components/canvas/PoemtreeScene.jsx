'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import CursorTracker from './CursorTracker'
import SpacetimeGrid from './SpacetimeGrid'
import PoemTree from './PoemTree'
import WaterParticles from './WaterParticles'
import AmbientWater from './AmbientWater'
import { useTreeStore, PHYSICS } from '@/hooks/useTreeStore'
import { computeGravityForce, clampVelocity, applyBounce } from '@/helpers/physics'

const MAX_TREES = 25

async function fetchPoem(treeId) {
  const tree = useTreeStore.getState().trees.get(treeId)
  if (!tree || tree.isFetchingPoem || tree.fullPoem) return

  useTreeStore.getState().updateTree(treeId, { isFetchingPoem: true })

  try {
    const res = await fetch('/api/poem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: tree.theme }),
    })
    const { poem } = await res.json()

    useTreeStore.getState().updateTree(treeId, {
      fullPoem: poem,
      isFetchingPoem: false,
    })
  } catch (e) {
    console.error('Poem fetch failed:', e)
    useTreeStore.getState().updateTree(treeId, {
      fullPoem: 'Something went wrong\nBut that is okay\nErrors are poems too\nIn their own sad way\nThe server wept quietly\nA 500 in the night\nWe tried our best\nGoodnight',
      isFetchingPoem: false,
    })
  }
}

export default function PoemtreeScene() {
  const lastSpawnRef = useRef(Date.now())
  const lastWaterDropRef = useRef(Date.now())
  const treeRefsMap = useRef(new Map())
  const trees = useTreeStore((s) => s.trees)
  const treeIds = Array.from(trees.keys())

  // Spawn initial tree quickly
  useEffect(() => {
    const timer = setTimeout(() => {
      useTreeStore.getState().spawnTree()
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getTreeRef = useCallback((id) => {
    if (!treeRefsMap.current.has(id)) {
      treeRefsMap.current.set(id, { current: null })
    }
    return treeRefsMap.current.get(id)
  }, [])

  useFrame((state, delta) => {
    const store = useTreeStore.getState()
    const { trees, cursorWorldPos, cursorVelocity } = store
    const now = Date.now()

    // --- SPAWNING ---
    if (now - lastSpawnRef.current > PHYSICS.spawnInterval && trees.size < MAX_TREES) {
      store.spawnTree()
      lastSpawnRef.current = now
    }

    // --- AMBIENT WATER DROPS (when few trees) ---
    if (trees.size < 3 && now - lastWaterDropRef.current > PHYSICS.waterDropSpawnInterval) {
      store.spawnWaterDrop()
      lastWaterDropRef.current = now
    }

    // Update water drops — drift, get absorbed by nearby trees, expire
    let waterDrops = [...store.waterDrops]
    const dropsToRemove = new Set()

    for (const drop of waterDrops) {
      // Drift
      drop.position[0] += drop.velocity[0]
      drop.position[1] += drop.velocity[1]

      // Gravity toward nearby trees
      trees.forEach((tree) => {
        const dx = tree.position[0] - drop.position[0]
        const dy = tree.position[1] - drop.position[1]
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0 && dist < 300) {
          const pull = (tree.mass * 0.5) / Math.max(dist * dist, 400)
          drop.velocity[0] += (dx / dist) * pull
          drop.velocity[1] += (dy / dist) * pull
        }
        // Absorb — boost the tree's growth
        if (dist < PHYSICS.waterDropAbsorbRadius && tree.fullPoem) {
          const totalChars = tree.fullPoem.length
          if (tree.revealedChars < totalChars) {
            tree.revealedChars = Math.min(totalChars, tree.revealedChars + tree.growthRate * 0.3)
            const progress = tree.revealedChars / totalChars
            tree.mass = PHYSICS.baseMass + (PHYSICS.maxMass - PHYSICS.baseMass) * progress
          }
          dropsToRemove.add(drop.id)
        }
      })

      // Damping
      drop.velocity[0] *= 0.998
      drop.velocity[1] *= 0.998

      // Lifespan fade
      const dropAge = now - drop.spawnTime
      if (dropAge > PHYSICS.waterDropLifespan - 2000) {
        drop.opacity = Math.max(0, (PHYSICS.waterDropLifespan - dropAge) / 2000)
      }
      if (dropAge > PHYSICS.waterDropLifespan) {
        dropsToRemove.add(drop.id)
      }
    }

    if (dropsToRemove.size > 0) {
      waterDrops = waterDrops.filter((d) => !dropsToRemove.has(d.id))
    }
    store.updateWaterDrops(waterDrops)

    const treeArr = Array.from(trees.values())

    // --- N-BODY GRAVITY (tree-tree) ---
    for (let i = 0; i < treeArr.length; i++) {
      for (let j = i + 1; j < treeArr.length; j++) {
        const a = treeArr[i]
        const b = treeArr[j]

        const [fx, fy] = computeGravityForce(a.position, a.mass, b.position, b.mass)

        a.velocity[0] += (fx / a.mass) * delta
        a.velocity[1] += (fy / a.mass) * delta
        b.velocity[0] -= (fx / b.mass) * delta
        b.velocity[1] -= (fy / b.mass) * delta

        const result = applyBounce(a.position, b.position, a.velocity, b.velocity)
        a.velocity = result.vel1
        b.velocity = result.vel2
      }
    }

    // --- CURSOR GRAVITY + WAKE ---
    const cursorSpeed = Math.sqrt(
      cursorVelocity[0] * cursorVelocity[0] + cursorVelocity[1] * cursorVelocity[1],
    )

    for (const tree of treeArr) {
      const [fx, fy] = computeGravityForce(tree.position, tree.mass, cursorWorldPos, PHYSICS.cursorMass)
      tree.velocity[0] += (fx / tree.mass) * delta
      tree.velocity[1] += (fy / tree.mass) * delta

      if (cursorSpeed > 1) {
        const dx = tree.position[0] - cursorWorldPos[0]
        const dy = tree.position[1] - cursorWorldPos[1]
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200 && dist > 0) {
          const perpX = -cursorVelocity[1]
          const perpY = cursorVelocity[0]
          const wakeFactor = (PHYSICS.wakeTurbulence * cursorSpeed) / Math.max(dist, 50)
          const side = Math.sign(dx * cursorVelocity[1] - dy * cursorVelocity[0])
          tree.velocity[0] += perpX * wakeFactor * side * delta
          tree.velocity[1] += perpY * wakeFactor * side * delta
        }
      }

      // --- BROWNIAN MOTION (slow random nudges) ---
      if (now - tree.lastBrownian > PHYSICS.brownianInterval) {
        tree.velocity[0] += (Math.random() - 0.5) * PHYSICS.brownianStrength
        tree.velocity[1] += (Math.random() - 0.5) * PHYSICS.brownianStrength
        tree.lastBrownian = now
      }
    }

    // --- UPDATE POSITIONS, WATERING, LIFECYCLE ---
    const halfW = state.viewport.width / 2 + 200
    const halfH = state.viewport.height / 2 + 200
    const toRemove = []

    for (const tree of treeArr) {
      // Damping
      tree.velocity[0] *= PHYSICS.damping
      tree.velocity[1] *= PHYSICS.damping
      tree.velocity = clampVelocity(tree.velocity)

      // Update position
      tree.position[0] += tree.velocity[0]
      tree.position[1] += tree.velocity[1]

      // Boundary wrap
      if (tree.position[0] > halfW) tree.position[0] = -halfW
      if (tree.position[0] < -halfW) tree.position[0] = halfW
      if (tree.position[1] > halfH) tree.position[1] = -halfH
      if (tree.position[1] < -halfH) tree.position[1] = halfH

      // --- WATERING ---
      const dx = tree.position[0] - cursorWorldPos[0]
      const dy = tree.position[1] - cursorWorldPos[1]
      const cursorDist = Math.sqrt(dx * dx + dy * dy)
      tree.isWatering = cursorDist < PHYSICS.waterRadius

      // Fetch poem on first water contact
      if (tree.isWatering && !tree.fullPoem && !tree.isFetchingPoem) {
        fetchPoem(tree.id)
      }

      if (tree.fullPoem) {
        const totalChars = tree.fullPoem.length

        if (tree.revealedChars < totalChars) {
          // Base passive growth (5% of growth rate)
          const baseGrowth = tree.growthRate * PHYSICS.baseGrowthRate * delta

          // Active watering growth (proportional: 15% boost compounding)
          let waterGrowth = 0
          if (tree.isWatering) {
            const currentRate = tree.growthRate * (1 + PHYSICS.waterGrowthBoost * (tree.revealedChars / totalChars))
            waterGrowth = currentRate * delta
          }

          tree.revealedChars = Math.min(totalChars, tree.revealedChars + baseGrowth + waterGrowth)

          // Mass scales with progress
          const progress = tree.revealedChars / totalChars
          tree.mass = PHYSICS.baseMass + (PHYSICS.maxMass - PHYSICS.baseMass) * progress
        }
      }

      // --- LIFECYCLE ---
      const age = now - tree.spawnTime
      const timeLeft = tree.lifespan - age

      if (timeLeft < 5000) {
        tree.opacity = Math.max(0, timeLeft / 5000)
      }

      if (age > tree.lifespan) {
        toRemove.push(tree.id)
      }

      // Imperatively update Three.js group position
      const ref = treeRefsMap.current.get(tree.id)
      if (ref?.current) {
        ref.current.position.set(tree.position[0], tree.position[1], 0)
      }
    }

    // Batch store update
    for (const tree of treeArr) {
      store.updateTree(tree.id, {
        position: [...tree.position],
        velocity: [...tree.velocity],
        isWatering: tree.isWatering,
        revealedChars: tree.revealedChars,
        mass: tree.mass,
        opacity: tree.opacity,
        lastBrownian: tree.lastBrownian,
      })
    }

    // Remove dead trees
    for (const id of toRemove) {
      store.removeTree(id)
      treeRefsMap.current.delete(id)
    }
  })

  // Clean up stale refs
  useEffect(() => {
    const currentIds = new Set(trees.keys())
    for (const id of treeRefsMap.current.keys()) {
      if (!currentIds.has(id)) {
        treeRefsMap.current.delete(id)
      }
    }
  }, [trees])

  return (
    <>
      <CursorTracker />
      <SpacetimeGrid />
      <WaterParticles />
      <AmbientWater />
      {treeIds.map((id) => (
        <PoemTree key={id} id={id} groupRef={getTreeRef(id)} />
      ))}
    </>
  )
}

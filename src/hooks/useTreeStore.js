import { create } from 'zustand'
import { getRandomTheme } from '@/helpers/poemPrompt'

let nextId = 0
let nextWaterId = 0

export const PHYSICS = {
  G: 260, // 30% faster
  cursorMass: 20,
  maxMass: 20,
  baseMass: 1,
  minGravityDist: 40,
  damping: 0.994,
  maxVelocity: 5.2, // 30% faster
  waterRadius: 90,
  spawnInterval: 3000, // faster spawn
  bounceDist: 70, // bigger bump zone
  bounceStrength: 1.2, // stronger bounce
  wakeTurbulence: 0.39, // 30% faster
  gridDistortion: 800,
  baseGrowthRate: 0.05, // 5% of tree's growthRate applied passively
  waterGrowthBoost: 0.15, // 15% proportional increase per water tick
  brownianStrength: 0.12, // slow random drift
  brownianInterval: 500, // ms between random nudges
  orangeThreshold: 0.7, // fraction of poem revealed to turn orange
  waterDropSpawnInterval: 800, // ms between ambient water drops
  waterDropLifespan: 8000, // ms before water drop fades
  waterDropAbsorbRadius: 60, // how close a tree must be to absorb
}

export const useTreeStore = create((set, get) => ({
  trees: new Map(),
  waterDrops: [], // ambient water drops that float around
  harvestedPoems: [],
  cursorWorldPos: [0, 0],
  cursorVelocity: [0, 0],
  showCollection: false,

  setCursorPos: (x, y) => {
    const prev = get().cursorWorldPos
    set({
      cursorWorldPos: [x, y],
      cursorVelocity: [x - prev[0], y - prev[1]],
    })
  },

  spawnTree: () => {
    const id = `tree-${nextId++}`
    const halfW = window.innerWidth / 2
    const halfH = window.innerHeight / 2
    const x = (Math.random() - 0.5) * halfW * 1.4
    const y = (Math.random() - 0.5) * halfH * 1.4
    const vx = (Math.random() - 0.5) * 2.0
    const vy = (Math.random() - 0.5) * 2.0
    const lifespan = 15000 + Math.random() * 5000
    const growthRate = 8 + Math.random() * 12

    const tree = {
      id,
      position: [x, y],
      velocity: [vx, vy],
      mass: PHYSICS.baseMass,
      theme: getRandomTheme(),
      fullPoem: null,
      revealedChars: 0,
      growthRate,
      spawnTime: Date.now(),
      lifespan,
      isWatering: false,
      isFetchingPoem: false,
      rotation: (Math.random() - 0.5) * 0.002,
      opacity: 1,
      lastBrownian: Date.now(),
    }

    set((state) => {
      const trees = new Map(state.trees)
      trees.set(id, tree)
      return { trees }
    })
    return id
  },

  spawnWaterDrop: () => {
    const halfW = window.innerWidth / 2
    const halfH = window.innerHeight / 2
    const drop = {
      id: `drop-${nextWaterId++}`,
      position: [
        (Math.random() - 0.5) * halfW * 1.2,
        (Math.random() - 0.5) * halfH * 1.2,
      ],
      velocity: [(Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4],
      spawnTime: Date.now(),
      opacity: 1,
    }
    set((state) => ({ waterDrops: [...state.waterDrops, drop] }))
  },

  removeWaterDrop: (id) => {
    set((state) => ({
      waterDrops: state.waterDrops.filter((d) => d.id !== id),
    }))
  },

  updateWaterDrops: (drops) => {
    set({ waterDrops: drops })
  },

  removeTree: (id) => {
    set((state) => {
      const trees = new Map(state.trees)
      trees.delete(id)
      return { trees }
    })
  },

  updateTree: (id, partial) => {
    set((state) => {
      const trees = new Map(state.trees)
      const tree = trees.get(id)
      if (!tree) return state
      trees.set(id, { ...tree, ...partial })
      return { trees }
    })
  },

  harvestTree: (id) => {
    const tree = get().trees.get(id)
    if (!tree || !tree.fullPoem) return
    const totalChars = tree.fullPoem.length
    if (tree.revealedChars < totalChars) return
    set((state) => {
      const trees = new Map(state.trees)
      trees.delete(id)
      return {
        trees,
        harvestedPoems: [
          ...state.harvestedPoems,
          { theme: tree.theme, poem: tree.fullPoem, harvestTime: Date.now() },
        ],
      }
    })
  },

  setShowCollection: (show) => set({ showCollection: show }),
}))

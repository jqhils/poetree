'use client'

import { useTreeStore } from '@/hooks/useTreeStore'

export default function HUD() {
  const poemCount = useTreeStore((s) => s.harvestedPoems.length)
  const setShowCollection = useTreeStore((s) => s.setShowCollection)

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 24,
          left: 28,
          zIndex: 10,
          pointerEvents: 'none',
          fontFamily: "'Space Mono', serif",
          color: '#ffffff',
          fontSize: 20,
          letterSpacing: 1,
          opacity: 0.7,
        }}
      >
        Poetree
      </div>

      <button
        onClick={() => setShowCollection(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 28,
          zIndex: 10,
          pointerEvents: 'auto',
          fontFamily: "'Space Mono', serif",
          color: '#ffffff',
          fontSize: 14,
          letterSpacing: 1,
          opacity: 0.6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.target.style.opacity = 1)}
        onMouseLeave={(e) => (e.target.style.opacity = 0.6)}
      >
        Poems: {poemCount}
      </button>
    </>
  )
}

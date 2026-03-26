'use client'

import { useTreeStore } from '@/hooks/useTreeStore'

export default function PoemCollection() {
  const showCollection = useTreeStore((s) => s.showCollection)
  const setShowCollection = useTreeStore((s) => s.setShowCollection)
  const poems = useTreeStore((s) => s.harvestedPoems)

  if (!showCollection) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
      onClick={() => setShowCollection(false)}
    >
      <div
        style={{
          maxWidth: 500,
          maxHeight: '80vh',
          overflow: 'auto',
          padding: 40,
          color: '#fff',
          fontFamily: "'Space Mono', serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 24, marginBottom: 30, opacity: 0.8, letterSpacing: 1 }}>
          Harvested Poems
        </h2>

        {poems.length === 0 && (
          <p style={{ opacity: 0.4, fontSize: 14, fontStyle: 'italic' }}>
            No poems harvested yet. Water a tree to full bloom and click it to harvest.
          </p>
        )}

        {poems.map((poem, i) => (
          <div
            key={i}
            style={{
              marginBottom: 30,
              paddingBottom: 20,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 11, opacity: 0.4, fontStyle: 'italic' }}>
              {poem.theme}
            </p>
            {poem.poem.split('\n').map((line, j) => (
              <p
                key={j}
                style={{
                  margin: '4px 0',
                  fontSize: 15,
                  opacity: 0.8,
                  lineHeight: 1.6,
                }}
              >
                {line}
              </p>
            ))}
          </div>
        ))}

        <button
          onClick={() => setShowCollection(false)}
          style={{
            marginTop: 10,
            background: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '8px 20px',
            cursor: 'pointer',
            fontFamily: "'Space Mono', serif",
            fontSize: 13,
            opacity: 0.6,
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

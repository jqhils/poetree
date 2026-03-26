'use client'

import dynamic from 'next/dynamic'
import { r3f } from '@/helpers/global'
import HUD from '@/components/dom/HUD'
import PoemCollection from '@/components/dom/PoemCollection'

const PoemtreeScene = dynamic(() => import('@/components/canvas/PoemtreeScene'), { ssr: false })

export default function Page() {
  return (
    <>
      <HUD />
      <PoemCollection />
      <r3f.In>
        <PoemtreeScene />
      </r3f.In>
    </>
  )
}

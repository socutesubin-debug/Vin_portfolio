import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { useExperience, type Origin } from '../../state/experienceStore'
import { Lift, useObjectInteraction } from './interaction'
import { cardFrontTexture } from './textures'

export const CARD_SIZE = { w: 0.36, h: 0.21, t: 0.004 }

const edge = new MeshStandardMaterial({ color: '#E9E6E0', roughness: 0.9 })
const back = new MeshStandardMaterial({ color: '#EFEDE8', roughness: 0.9 })

/** 상판·Contact 서랍에 놓이는 명함. 두 위치 모두 같은 디자인/데이터를 사용한다. */
export default function BusinessCardObject({
  id,
  context,
  canInteract,
}: {
  id: string
  context: 'home' | 'contact'
  canInteract: () => boolean
}) {
  const openFocus = useExperience((s) => s.openFocus)
  const hidden = useExperience((s) => s.focus.type === 'card' && s.focus.context === context)
  const materials = useMemo(() => {
    const front = new MeshStandardMaterial({ map: cardFrontTexture(), roughness: 0.85 })
    // BoxGeometry 면 순서: +x, −x, +y(앞면), −y, +z, −z
    return [edge, edge, front, back, edge, edge]
  }, [])
  const handlers = useObjectInteraction(id, canInteract, (origin: Origin) =>
    openFocus({ type: 'card', context }, origin, document.querySelector(`[data-opener="card-${context}"]`)),
  )
  return (
    <Lift active={() => useExperience.getState().hovered === id} amount={0.03}>
      <mesh visible={!hidden} material={materials} castShadow position={[0, CARD_SIZE.t / 2, 0]} {...handlers}>
        <boxGeometry args={[CARD_SIZE.w, CARD_SIZE.t, CARD_SIZE.h]} />
      </mesh>
    </Lift>
  )
}

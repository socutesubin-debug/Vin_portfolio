import type { ReactNode } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { canUseHotspot, type HotspotId } from '../config/hotspots'
import { useHome } from '../state/homeStore'

/**
 * 누를 수 있는 3D 오브제를 감싼다. 호버·클릭(탭)을 상태 스토어로 넘길 뿐, 모양과 반응 연출은 오브제가 맡는다.
 * 그 오브제의 장면이 아니거나 전환 중이면 아무것도 하지 않는다.
 */
export default function Hotspot({ id, children }: { id: HotspotId; children: ReactNode }) {
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!canUseHotspot(id, useHome.getState().mode)) return
    // 터치는 호버 없이 탭으로 바로 동작한다
    if (e.pointerType !== 'touch') useHome.getState().setHover(id)
    document.body.style.cursor = 'pointer'
  }
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (useHome.getState().hovered === id) useHome.getState().setHover(null)
    document.body.style.cursor = ''
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!canUseHotspot(id, useHome.getState().mode)) return
    document.body.style.cursor = ''
    useHome.getState().activate(id)
  }

  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
    </group>
  )
}

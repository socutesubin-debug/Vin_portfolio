import { useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { useExperience, type Origin } from '../../state/experienceStore'

/** 3D 오브제 포인터 이벤트. 상호작용 가능 조건은 매 이벤트마다 rig/스토어에서 읽는다. */
export function useObjectInteraction(id: string, canInteract: () => boolean, activate: (origin: Origin) => void) {
  const setHovered = useExperience((s) => s.setHovered)
  const allowed = () => {
    const s = useExperience.getState()
    return s.introDone && s.focus.type === 'none' && canInteract()
  }
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      if (!allowed()) return
      setHovered(id)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      if (useExperience.getState().hovered === id) setHovered(null)
      document.body.style.cursor = ''
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      if (!allowed()) return
      document.body.style.cursor = ''
      activate({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY })
    },
  }
}

/**
 * Hover 피드백 전용 그룹. 스크롤 타임라인이 움직이는 부모와 분리해
 * 같은 Transform 속성을 두 시스템이 동시에 쓰지 않게 한다.
 */
export function Lift({ active, amount = 0.035, children }: { active: () => boolean; amount?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const target = active() ? amount : 0
    g.position.y = useExperience.getState().reducedMotion ? target : MathUtils.damp(g.position.y, target, 12, dt)
  })
  return <group ref={ref}>{children}</group>
}

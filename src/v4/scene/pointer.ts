/**
 * 화면 전체 기준 포인터 위치(-1~1, 위가 +y). 마우스·펜만 받고 터치는 무시한다.
 * 포인터가 창 밖으로 나가거나 창이 포커스를 잃으면 inside=false → 카메라가 기본 구도로 돌아간다.
 */
export const pointer = { x: 0, y: 0, inside: false }

/** 마우스로 카메라를 움직일 수 있는 환경인지(터치 기기는 끈다) */
export const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 한 번만 등록한다. 해제 함수를 돌려준다 */
export function trackPointer() {
  const move = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    pointer.inside = true
  }
  const leave = () => {
    pointer.inside = false
  }
  const out = (e: MouseEvent) => {
    if (!e.relatedTarget) leave()
  }
  window.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('mouseout', out)
  document.documentElement.addEventListener('mouseleave', leave)
  window.addEventListener('blur', leave)
  return () => {
    window.removeEventListener('pointermove', move)
    document.removeEventListener('mouseout', out)
    document.documentElement.removeEventListener('mouseleave', leave)
    window.removeEventListener('blur', leave)
  }
}

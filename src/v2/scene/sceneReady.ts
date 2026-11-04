import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * 3D 장면이 실제로 그려지기 시작했는지 알린다.
 * V3 인트로가 빛 전환을 걷어 내기 전에 이 신호를 기다린다(첫 화면이 빈 채로 드러나지 않게).
 */
const EVENT = 'v2:scene-ready'
let ready = false

export const isSceneReady = () => ready

/** 장면이 준비되면(이미 준비됐으면 바로) 한 번 부른다. 해제 함수를 돌려준다 */
export function onSceneReady(fn: () => void) {
  if (ready) {
    fn()
    return () => {}
  }
  window.addEventListener(EVENT, fn, { once: true })
  return () => window.removeEventListener(EVENT, fn)
}

/** Canvas 안에 둔다. 셰이더 준비가 끝난 뒤인 3번째 프레임에 신호를 보낸다 */
export function SceneReadySignal() {
  const frames = useRef(0)
  useEffect(
    () => () => {
      ready = false
    },
    [],
  )
  useFrame(() => {
    if (ready || ++frames.current < 3) return
    ready = true
    window.dispatchEvent(new Event(EVENT))
  })
  return null
}

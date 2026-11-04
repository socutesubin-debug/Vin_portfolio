import { useSyncExternalStore } from 'react'

/** 모션 줄이기(OS 설정)를 따른다 */
const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
export const prefersReducedMotion = () => mq.matches
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => mq.matches,
  )
}

/** 소리: 첫 방문은 꺼짐. 켜면 페이지를 옮겨도 유지한다 */
const SOUND_KEY = 'v5.sound'
const soundListeners = new Set<() => void>()
export const isSoundOn = () => sessionStorage.getItem(SOUND_KEY) === 'on'
export function setSoundOn(on: boolean) {
  sessionStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  soundListeners.forEach((l) => l())
}
export function useSoundOn() {
  return useSyncExternalStore(
    (cb) => {
      soundListeners.add(cb)
      return () => soundListeners.delete(cb)
    },
    isSoundOn,
  )
}

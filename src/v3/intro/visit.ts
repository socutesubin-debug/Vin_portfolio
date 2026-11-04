import { onSceneReady } from '../../v2/scene/sceneReady'
import { INTRO_RULES } from './introConfig'

/** 6-1장: 첫 방문은 INTRO부터, 본 적 있거나 프로젝트 주소·/quick이면 INTRO 생략. ?intro=1이면 강제 재생 */
export function shouldPlayIntro() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('intro') === '1') return true
  if (INTRO_RULES.skipPaths.some((re) => re.test(window.location.pathname))) return false
  return !hasSeenIntro()
}

export function hasSeenIntro() {
  try {
    return window.localStorage.getItem(INTRO_RULES.seenKey) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_RULES.seenKey, '1')
  } catch {
    // 저장이 막혀 있으면 다음 방문에도 INTRO부터
  }
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 3D 장면이 처음 그려질 때까지 기다린다(최대 maxSec초) */
export function waitSceneReady(maxSec: number) {
  return new Promise<void>((resolve) => {
    let off: (() => void) | null = null
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      off?.()
      resolve()
    }
    const timer = window.setTimeout(done, maxSec * 1000)
    off = onSceneReady(done)
  })
}

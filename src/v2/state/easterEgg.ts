/**
 * 이스터에그 진행 상태(열쇠를 주웠는지, 어떤 서랍을 열었는지)를 브라우저에 저장한다.
 * 다시 방문해도 열쇠와 열린 서랍이 그대로 유지된다. 저장이 막힌 환경에서도 화면은 정상 동작한다.
 */

const KEY = 'vin-v2-easter-egg'

export interface EasterEggSave {
  hasKey: boolean
  /** 열쇠로 연 서랍 id */
  unlocked: string[]
}

const EMPTY: EasterEggSave = { hasKey: false, unlocked: [] }

export function loadEasterEgg(): EasterEggSave {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const v = JSON.parse(raw)
    return {
      hasKey: v?.hasKey === true,
      unlocked: Array.isArray(v?.unlocked) ? v.unlocked.filter((x: unknown) => typeof x === 'string') : [],
    }
  } catch {
    return EMPTY
  }
}

export function saveEasterEgg(save: EasterEggSave) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // 저장이 막혀 있으면 이번 방문 동안만 유지한다
  }
}

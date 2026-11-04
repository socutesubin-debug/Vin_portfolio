import { useEffect } from 'react'
import { isHomeInteractive, useHome, type HomeMode } from '../state/homeStore'

/** 휠 한 번으로 볼 만큼 쌓인 양(px) */
const WHEEL_STEP = 60
/** 스와이프로 볼 거리(px) */
const SWIPE_STEP = 50
/** 장면이 자리 잡은 뒤 이 시간(ms) 동안은 휠을 무시한다(트랙패드 관성으로 두 장면을 건너뛰지 않게) */
const SETTLE_MS = 700

/**
 * 스크롤로 장면 넘기기 + 지금 장면을 body[data-scene]에 표시(로고·메뉴 색, 목록 뒤 장면 흐림).
 * - HOME에서 아래로: 카메라가 서랍장으로 내려간다(WORK)
 * - 서랍 속 파일에서 아래로: 프로젝트 목록, 위로: HOME
 * - ABOUT(노트북 이력서)에서 끝까지 내린 뒤 더 아래로: 서랍(WORK), 맨 위에서 위로: HOME
 * - 서랍 속 파일에서 Escape: HOME
 * 터치는 위로 쓸어 올리면 아래로 스크롤한 것과 같다. 프로젝트 목록 안에서는 목록 자체가 스크롤된다.
 */
export default function SceneNav() {
  const mode = useHome((s) => s.mode)

  useEffect(() => {
    document.body.dataset.scene = mode === 'WORK_LIST' ? 'list' : mode.startsWith('WORK_') ? 'work' : mode === 'ABOUT_OPEN' ? 'about' : 'home'
  }, [mode])

  useEffect(() => {
    let acc = 0
    let settledAt = performance.now()
    let last: HomeMode = useHome.getState().mode
    const unsub = useHome.subscribe((s) => {
      if (s.mode !== last) {
        last = s.mode
        settledAt = performance.now()
        acc = 0
      }
    })

    const step = (dir: 1 | -1) => {
      const s = useHome.getState()
      if (performance.now() - settledAt < SETTLE_MS) return
      if (dir > 0) {
        if (isHomeInteractive(s.mode) || s.mode === 'ABOUT_OPEN') s.openWork()
        else if (s.mode === 'WORK_FILES') s.showProjects()
      } else if (s.mode === 'WORK_FILES') s.goHome()
      else if (s.mode === 'ABOUT_OPEN') s.closeAbout()
    }

    /** ABOUT: 이력서가 아직 더 내려가거나 올라갈 수 있으면 그 스크롤이 먼저다 */
    const resumeCanScroll = (dir: number) => {
      const sc = document.querySelector<HTMLElement>('[data-resume-scroll]')
      if (!sc) return false
      return dir > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2 : sc.scrollTop > 0
    }

    const onWheel = (e: WheelEvent) => {
      const mode = useHome.getState().mode
      if (mode === 'WORK_LIST') return
      if (mode === 'ABOUT_OPEN' && resumeCanScroll(e.deltaY)) {
        acc = 0
        return
      }
      acc += e.deltaY
      // 이력서 끝에서는 조금 더 내려야 넘어간다(이력서를 읽던 관성으로 바로 넘어가지 않게)
      const need = mode === 'ABOUT_OPEN' ? WHEEL_STEP * 3 : WHEEL_STEP
      if (Math.abs(acc) >= need) {
        step(acc > 0 ? 1 : -1)
        acc = 0
      }
    }
    let startY: number | null = null
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const y = e.changedTouches[0]?.clientY
      if (startY === null || y === undefined || useHome.getState().mode === 'WORK_LIST') return
      const dy = startY - y
      if (useHome.getState().mode === 'ABOUT_OPEN' && resumeCanScroll(dy)) return
      if (Math.abs(dy) >= SWIPE_STEP) step(dy > 0 ? 1 : -1)
      startY = null
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useHome.getState().mode === 'WORK_FILES') useHome.getState().goHome()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      unsub()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <p className="v4-cue" data-show={mode === 'WORK_FILES'} aria-live="polite">
      {mode === 'WORK_FILES' ? 'Scroll or click the files to see projects' : ''}
    </p>
  )
}

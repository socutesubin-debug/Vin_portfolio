import { useCallback, useRef, useState } from 'react'
import V2App from '../v2/V2App'
import IntroSequence, { IntroStill } from './intro/IntroSequence'
import LightOverlay, { light } from './intro/LightOverlay'
import { INTRO_LIGHT } from './intro/introConfig'
import { markIntroSeen, reducedMotion, shouldPlayIntro, waitSceneReady } from './intro/visit'
import DevHomeReference from './dev/DevHomeReference'
import './ui/v3.css'

type Phase = 'intro' | 'home'

const wait = (sec: number) => new Promise((r) => setTimeout(r, sec * 1000))
const lockScroll = (on: boolean) => {
  document.documentElement.style.overflow = on ? 'hidden' : ''
}

function initial(): { phase: Phase; still: boolean } {
  if (!shouldPlayIntro()) return { phase: 'home', still: false }
  // 움직임 줄이기: 시퀀스 없이 마지막 장면 정지 이미지 → 페이드로 바로 S04
  if (reducedMotion()) return { phase: 'home', still: true }
  return { phase: 'intro', still: false }
}

/**
 * V3: INTRO(S01~S03, 스크롤 영상) → 빛 전환 → S04 3D HOME(V2 작업실 재사용).
 * INTRO가 끝나면 화면에서 아예 내려서, 3D 구간에서 위로 스크롤해도 되감기지 않는다(다시 보기 버튼으로만).
 */
export default function V3App() {
  const [{ phase, still }, setState] = useState(initial)
  const leaving = useRef(false)

  /** INTRO → S04. 빛이 가장 밝은 채로 3D를 올리고, 준비되면 빛을 걷어 낸다 */
  const toHome = useCallback(async () => {
    if (leaving.current) return
    leaving.current = true
    markIntroSeen()
    light.locked = true
    light.force(1)
    lockScroll(true)
    window.scrollTo(0, 0)
    setState({ phase: 'home', still: false })
    await waitSceneReady(INTRO_LIGHT.maxWaitSec)
    await wait(INTRO_LIGHT.holdSec)
    await light.animate(0, INTRO_LIGHT.revealSec, 'power2.out')
    light.locked = false
    lockScroll(false)
    leaving.current = false
  }, [])

  /** Skip: 빛을 시간으로 끝까지 올린 뒤 S04 */
  const skip = useCallback(async () => {
    if (leaving.current) return
    light.locked = true
    await light.animate(1, INTRO_LIGHT.skipRampSec, 'power2.in')
    void toHome()
  }, [toHome])

  const stillDone = useCallback(() => {
    markIntroSeen()
    setState((s) => ({ ...s, still: false }))
  }, [])

  const replay = () => {
    light.locked = false
    light.force(0)
    window.scrollTo(0, 0)
    setState(reducedMotion() ? { phase: 'home', still: true } : { phase: 'intro', still: false })
  }

  return (
    <>
      {phase === 'intro' ? (
        <IntroSequence onFinish={toHome} onSkip={skip} />
      ) : (
        <>
          <V2App />
          {!still && (
            <button type="button" className="v3-replay" onClick={replay}>
              인트로 다시 보기
            </button>
          )}
          {import.meta.env.DEV && <DevHomeReference />}
        </>
      )}
      {still && <IntroStill onDone={stillDone} />}
      <LightOverlay />
    </>
  )
}

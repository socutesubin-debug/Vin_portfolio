import { useEffect } from 'react'
import { RING } from '../config/contact'
import { playRing, stopRing } from '../audio/ringtone'
import { nowSec, overlayOpen, useWorkspace } from '../state/workspaceStore'

/**
 * CONTACT 장면의 2D 조작:
 * - "전화 받기" 버튼(키보드·스크린리더·모바일용) + 전화기에 마우스를 올렸을 때 뜨는 안내
 * - ESC로 카드 닫기(수화기 내려놓기)
 * - 벨소리: 사운드가 켜져 있고 울리는 동안만
 */
export default function ContactControls() {
  const scene = useWorkspace((s) => s.activeScene)
  const callOpen = useWorkspace((s) => s.callOpen)
  const covered = useWorkspace(overlayOpen)
  const hover = useWorkspace((s) => s.phoneHover)
  const ringAt = useWorkspace((s) => s.ringAt)
  const silenced = useWorkspace((s) => s.ringSilenced)
  const soundOn = useWorkspace((s) => s.soundOn)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useWorkspace.getState().callOpen) useWorkspace.getState().hangUp()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 벨소리: 울림 시작 시각 기준으로 남은 울림만 재생한다
  useEffect(() => {
    const ringing = soundOn && ringAt !== null && !silenced && !callOpen && scene === 'contact'
    const elapsed = ringAt === null ? 0 : nowSec() - ringAt
    if (ringing && elapsed < RING.cycles * RING.period) playRing(elapsed)
    else stopRing()
    return stopRing
  }, [soundOn, ringAt, silenced, callOpen, scene])

  if (scene !== 'contact' || covered) return null

  return (
    <>
      <div className="v2-work-hint">
        <button type="button" className="v2-pill v2-pill--dark v2-call-btn" onClick={() => useWorkspace.getState().answerCall()}>
          전화 받기
        </button>
      </div>
      {hover && (
        <div className="v2-phone-tip" style={{ left: hover.x, top: hover.y }} aria-hidden="true">
          전화 받기
        </div>
      )}
    </>
  )
}

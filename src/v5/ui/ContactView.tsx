import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ringOnce, stopRing } from '../contact/ringTone'
import { focusElement, rememberOpener } from '../focus'
import { prefersReducedMotion } from '../prefs'
import { navigate, type Route } from '../router'
import { hasWebGL } from '../three/webgl'
import type { ContactScene } from '../three/ContactScene'
import { MessageForm } from './MessageForm'
import { Fallback, Loading } from './SceneStatus'

type Status = 'loading' | 'ready' | 'error' | 'nowebgl'

/**
 * Contact · 벽걸이 전화기. 벨(흔들림·소리 켜면 벨소리) → '전화 받기' → 수화기가 왼쪽에 자리하고 양식이 열린다(#message).
 * '메시지 바로 남기기'(#message)는 전화 받기 연출 없이 바로 양식을 연다.
 */
export default function ContactView({ route }: { route: Route }) {
  const host = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ContactScene | null>(null)
  const answerBtn = useRef<HTMLButtonElement>(null)
  const formTitle = useRef<HTMLHeadingElement>(null)
  const formBox = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const [status, setStatus] = useState<Status>(() => (hasWebGL() ? 'loading' : 'nowebgl'))
  /** 수화기를 든 상태(양식을 보여도 되는 상태) */
  const [answered, setAnswered] = useState(false)
  const wantForm = route.name === 'message'
  const fallback = status === 'error' || status === 'nowebgl'
  const formShown = wantForm && (answered || fallback)

  // 장면은 이 화면에 들어올 때만 불러온다
  useEffect(() => {
    if (status === 'nowebgl') return
    let scene: ContactScene | null = null
    let cancelled = false
    import('../three/ContactScene')
      .then(({ ContactScene }) => {
        if (cancelled) return
        scene = new ContactScene(host.current!, {
          reducedMotion: prefersReducedMotion(),
          onRing: ringOnce,
          onPick: () => answerRef.current(),
        })
        sceneRef.current = scene
        return scene.ready
      })
      .then(() => !cancelled && setStatus('ready'))
      .catch((err) => {
        console.error('[Contact] 3D 장면을 불러오지 못했습니다', err)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
      stopRing()
      scene?.dispose()
      sceneRef.current = null
    }
  }, [status === 'nowebgl'])

  /** 전화 받기: 벨 정지 → 수화기 이동(GSAP Timeline) → #message */
  const answer = useCallback(() => {
    const s = sceneRef.current
    if (busy.current) return
    rememberOpener(answerBtn.current)
    stopRing()
    if (!s) return navigate('#message')
    busy.current = true
    s.answer(() => {
      busy.current = false
      setAnswered(true)
      navigate('#message')
    })
  }, [])
  const answerRef = useRef(answer)
  answerRef.current = answer

  // 주소와 장면 맞추기: #message로 바로 오면 연출 없이 받은 상태, #contact로 돌아오면 수화기를 다시 건다
  useEffect(() => {
    const s = sceneRef.current
    if (status !== 'ready' || !s || busy.current) return
    if (wantForm && !s.answered) {
      stopRing()
      s.answer(() => setAnswered(true), true)
    } else if (wantForm && s.answered) setAnswered(true)
    else if (!wantForm && s.answered) {
      s.hangUp()
      setAnswered(false)
    }
  }, [wantForm, status])

  // 양식 등장(패널) + 제목 포커스. 닫히면 '전화 받기'로 포커스
  const wasShown = useRef(false)
  useLayoutEffect(() => {
    if (formShown && !wasShown.current) {
      const box = formBox.current
      if (box && !prefersReducedMotion()) gsap.fromTo(box, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' })
      focusElement(formTitle.current)
    } else if (!formShown && wasShown.current) {
      focusElement(answerBtn.current)
    }
    wasShown.current = formShown
  }, [formShown])

  const closeForm = useCallback(() => navigate('#contact'), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && formShown && closeForm()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [formShown, closeForm])

  return (
    <section className="v5-screen v5-contact" aria-labelledby="contact-title" data-form={formShown}>
      <div className="v5-contact-canvas" ref={host} aria-hidden="true" />

      <div className="v5-contact-head">
        <p className="v5-eyebrow">Contact · 전화기</p>
        <h1 id="contact-title" tabIndex={-1} data-screen-title>
          {formShown ? '전화를 받았어요' : '전화가 오고 있어요'}
        </h1>
        {!formShown && (
          <a className="v5-textlink" href="#message">
            메시지 바로 남기기 →
          </a>
        )}
      </div>

      {status === 'loading' && <Loading label="전화기를 준비하는 중…" progress={null} />}

      {!formShown && status === 'ready' && (
        <div className="v5-anchors">
          <button
            ref={(el) => {
              answerBtn.current = el
              sceneRef.current?.bindAnchor('answer', el)
            }}
            type="button"
            className="v5-anchor v5-anchor-answer"
            onClick={answer}
          >
            <span className="v5-ring-dot" aria-hidden="true" /> 전화 받기
          </button>
        </div>
      )}

      {fallback && !formShown && (
        <Fallback reason={status === 'nowebgl' ? 'webgl' : 'load'} illustration={<StaticPhone />}>
          <button ref={answerBtn} type="button" className="v5-btn v5-btn-primary" onClick={answer}>
            <span className="v5-ring-dot" aria-hidden="true" /> 전화 받기
          </button>
        </Fallback>
      )}

      {formShown && (
        <div className="v5-contact-form" ref={formBox} role="region" aria-labelledby="msg-title">
          <MessageForm ref={formTitle} onClose={closeForm} />
        </div>
      )}
    </section>
  )
}

function StaticPhone() {
  return (
    <svg viewBox="0 0 120 200" width="100%" height="100%" role="img">
      <rect x="40" y="10" width="60" height="96" rx="8" fill="#c42a1f" />
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={52 + c * 14} y={32 + r * 14} width="10" height="9" rx="2" fill="#d5d7da" />))}
      <rect x="22" y="8" width="16" height="92" rx="8" fill="#b3231b" />
      <path d="M30 100 q -12 40 10 60 q 30 20 40 -54" fill="none" stroke="#b3231b" strokeWidth="3" strokeDasharray="3 2" />
    </svg>
  )
}

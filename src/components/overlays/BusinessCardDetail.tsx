import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP } from '../../animations/gsap'
import { PROFILE } from '../../data/profile'
import { useExperience } from '../../state/experienceStore'
import Dialog, { CloseButton } from './Dialog'

const Pending = ({ children }: { children: string }) => <span className="todo-inline">{children} · 정보 확인 중</span>

/** Home·Contact 공용 명함 집중 화면. 앞/뒤 뒤집기, 닫으면 원래 자리로 돌아간다. */
export default function BusinessCardDetail({ context }: { context: 'home' | 'contact' }) {
  const closeFocus = useExperience((s) => s.closeFocus)
  const origin = useExperience((s) => s.origin)
  const reduced = useExperience((s) => s.reducedMotion)
  const [flipped, setFlipped] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const tween = useRef<gsap.core.Tween | null>(null)

  // 열린 위치(3D 명함 또는 버튼)에서 중앙으로 확대
  useGSAP(() => {
    const el = stage.current!
    const r = el.getBoundingClientRect()
    const from = origin
      ? { x: origin.x - (r.left + r.width / 2), y: origin.y - (r.top + r.height / 2), scale: 0.3, rotation: context === 'home' ? -18 : -12 }
      : { x: 0, y: 30, scale: 0.9, rotation: 0 }
    tween.current = gsap.from(el, { ...from, opacity: 0, duration: reduced ? 0 : 0.65, ease: 'power3.out' })
  })

  // Contact에서는 명함이 등장한 뒤 뒷면(연락처)으로 뒤집힌다
  useEffect(() => {
    if (context !== 'contact') return
    const id = window.setTimeout(() => setFlipped(true), reduced ? 0 : 700)
    return () => window.clearTimeout(id)
  }, [context, reduced])

  const closing = useRef(false)
  const close = () => {
    if (closing.current) return
    closing.current = true
    setFlipped(false)
    const el = stage.current
    const from = tween.current?.vars
    if (!el || reduced || !from) return closeFocus()
    // 열렸던 위치로 되돌아간 뒤 닫는다(프레임이 느려도 닫힘이 보장되도록 타임아웃 병행)
    const done = () => {
      window.clearTimeout(guard)
      closeFocus()
    }
    const guard = window.setTimeout(done, 900)
    tween.current?.kill()
    gsap.to(el, { x: from.x, y: from.y, scale: from.scale, rotation: from.rotation, opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: done })
  }

  return (
    <Dialog labelledBy="card-title" onClose={close} className="overlay--card">
      <CloseButton onClick={close} />
      <div className="card-stage" ref={stage}>
        <button
          type="button"
          className={`bcard ${flipped ? 'is-flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? '명함 앞면 보기' : '명함 뒷면 보기'}
        >
          <span className="bcard__inner">
            <span className="bcard__face bcard__front" aria-hidden={flipped}>
              <span className="bcard__logo" id="card-title">
                {PROFILE.brand}
              </span>
              <span className="bcard__name">{PROFILE.nameEn}</span>
            </span>
            <span className="bcard__face bcard__back" aria-hidden={!flipped}>
              <span className="bcard__back-top">
                <span className="bcard__back-name">{PROFILE.nameDisplay}</span>
                <span className="bcard__back-role">{PROFILE.role ?? <Pending>직무</Pending>}</span>
              </span>
              <span className="bcard__rows">
                <span className="bcard__row">
                  <span className="bcard__k">Email</span>
                  {PROFILE.email ? <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a> : <Pending>이메일</Pending>}
                </span>
                {PROFILE.links.length ? (
                  PROFILE.links.map((l) => (
                    <span className="bcard__row" key={l.url}>
                      <span className="bcard__k">{l.label}</span>
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.url.replace(/^https?:\/\//, '')}
                      </a>
                    </span>
                  ))
                ) : (
                  <span className="bcard__row">
                    <span className="bcard__k">Links</span>
                    <Pending>포트폴리오·SNS</Pending>
                  </span>
                )}
              </span>
              <span className="bcard__tag">
                {PROFILE.meaning} — {PROFILE.concept}
              </span>
            </span>
          </span>
        </button>
      </div>
      <div className="overlay__controls">
        <button type="button" className="btn btn--light" onClick={() => setFlipped((f) => !f)}>
          {flipped ? '앞면 보기' : '뒤집기'}
        </button>
      </div>
    </Dialog>
  )
}

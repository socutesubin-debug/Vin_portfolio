import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP } from '../../animations/gsap'
import { PROFILE } from '../../data/profile'
import { useExperience } from '../../state/experienceStore'
import Dialog from './Dialog'

/**
 * 전화가 연결된 뒤 나타나는 연락처 화면. 프로젝트 데이터(PROFILE)에 있는 이메일·링크만 보여주고,
 * 확인되지 않은 항목은 임의로 만들지 않고 '정보 확인 중'으로 표시한다.
 * HANG UP·Escape·배경 클릭은 모두 closeFocus()로 이어지고, 스토어가 call 상태를 hangingUp으로 바꾼다.
 */
export default function CallOverlay() {
  const closeFocus = useExperience((s) => s.closeFocus)
  const reduced = useExperience((s) => s.reducedMotion)
  const wrap = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useGSAP(
    () => {
      if (reduced) return
      gsap.from('.call__reveal', { y: 18, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' })
    },
    { scope: wrap },
  )
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copyEmail = async () => {
    if (!PROFILE.email) return
    try {
      await navigator.clipboard.writeText(PROFILE.email)
    } catch {
      // 클립보드 권한이 없으면 텍스트를 선택해 직접 복사하도록 둔다
      return
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Dialog labelledBy="call-title" onClose={closeFocus} className="overlay--call">
      <div ref={wrap} className="sheet call">
        <p className="call__status call__reveal" role="status">
          <span className="call__dot" aria-hidden="true" />
          Connected to VIN.
        </p>
        <h2 id="call-title" className="call__title call__reveal">
          Hello, let’s connect.
        </h2>
        <p className="call__brand call__reveal">
          {PROFILE.brand} — {PROFILE.meaning}
        </p>

        <dl className="call__list call__reveal">
          <div className="call__row">
            <dt>Email</dt>
            <dd>
              {PROFILE.email ? (
                <>
                  <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
                  <button type="button" className="call__copy" onClick={copyEmail}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <span className="sr-only" aria-live="polite">
                    {copied ? '이메일이 복사되었습니다' : ''}
                  </span>
                </>
              ) : (
                <span className="todo-inline">이메일 · 정보 확인 중</span>
              )}
            </dd>
          </div>
          {PROFILE.links.length ? (
            PROFILE.links.map((l) => (
              <div className="call__row" key={l.url}>
                <dt>{l.label}</dt>
                <dd>
                  <a href={l.url} target="_blank" rel="noreferrer noopener">
                    {l.url.replace(/^https?:\/\//, '')} ↗
                  </a>
                </dd>
              </div>
            ))
          ) : (
            <div className="call__row">
              <dt>Links</dt>
              <dd>
                <span className="todo-inline">포트폴리오·SNS · 정보 확인 중</span>
              </dd>
            </div>
          )}
        </dl>

        <button type="button" className="btn call__hangup call__reveal" onClick={closeFocus} data-autofocus>
          HANG UP
        </button>
      </div>
    </Dialog>
  )
}

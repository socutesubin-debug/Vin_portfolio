import { useEffect, useRef, type ReactNode } from 'react'
import { PROFILE, type ResumeEntry } from '../../data/profile'
import { screenOverlay } from '../scene/screenOverlay'
import { useHome } from '../state/homeStore'

const todo = (text = '준비 중') => <span className="v4-todo">{text}</span>

function Entries({ items }: { items: ResumeEntry[] }) {
  if (!items.length) return todo()
  return (
    <ul className="v4-resume__entries">
      {items.map((e, i) => (
        <li key={i}>
          {e.period && <span className="v4-resume__period">{e.period}</span>}
          <strong>{e.title}</strong>
          {e.detail && <p>{e.detail}</p>}
        </li>
      ))}
    </ul>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="v4-resume__section">
      <h3>{label}</h3>
      <div>{children}</div>
    </section>
  )
}

/**
 * ABOUT: 노트북 화면 안의 이력서(HTML). 카메라가 화면 정면에 도착하면(ABOUT_OPEN) 켜지고,
 * 위치·크기는 Canvas 안 Laptop이 화면 네 모서리에 맞춘다(screenOverlay).
 * 닫기·Escape → HOME, 끝까지 내린 뒤 더 스크롤하거나 "WORK →" → 서랍(WORK).
 * 내용은 data/profile.ts에서 확인된 문구만 쓴다(비어 있는 항목은 준비 중 표시).
 */
export default function AboutPanel() {
  const open = useHome((s) => s.mode === 'ABOUT_OPEN')
  const closeAbout = useHome((s) => s.closeAbout)
  const openWork = useHome((s) => s.openWork)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAbout()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [open, closeAbout])

  if (!open) return null
  const r = PROFILE.resume

  return (
    <section
      ref={(el) => {
        screenOverlay.el = el
      }}
      className="v4-resume"
      role="dialog"
      aria-modal="true"
      aria-labelledby="v4-resume-title"
    >
      <header className="v4-resume__bar">
        <span aria-hidden="true">C:\VIN&gt; about</span>
        <button ref={closeRef} type="button" className="v4-resume__close" onClick={closeAbout} aria-label="ABOUT 닫기">
          Close <span aria-hidden="true">✕</span>
        </button>
      </header>
      <div className="v4-resume__body" data-resume-scroll>
        <p className="v4-resume__eyebrow">About me · Resume</p>
        <h2 id="v4-resume-title" className="v4-resume__title">
          {PROFILE.nameEn}
        </h2>
        <p className="v4-resume__lead">{PROFILE.message}</p>
        <dl className="v4-resume__facts">
          <div>
            <dt>Brand</dt>
            <dd>
              {PROFILE.brand} — {PROFILE.meaning}
            </dd>
          </div>
          <div>
            <dt>Concept</dt>
            <dd>{PROFILE.concept}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{PROFILE.role ?? todo()}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{PROFILE.email ?? todo()}</dd>
          </div>
        </dl>
        <Section label="Profile">{r.profile ?? todo('자기소개 준비 중')}</Section>
        <Section label="Education">
          <Entries items={r.education} />
        </Section>
        <Section label="Experience">
          <Entries items={r.experience} />
        </Section>
        <Section label="Skills">{r.skills.length ? r.skills.join(' · ') : todo()}</Section>
        <Section label="Philosophy">{r.philosophy ?? todo()}</Section>
        <button type="button" className="v4-resume__next" onClick={openWork}>
          WORK <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

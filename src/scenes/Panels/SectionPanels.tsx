import type { MouseEvent } from 'react'
import { PROJECTS, PROJECT_ORDER } from '../../data/projects'
import { PROFILE } from '../../data/profile'
import { useExperience, type Focus } from '../../state/experienceStore'
import { scrollToSection, scrollToTop } from '../../animations/masterTimeline'
import { rig } from '../../animations/rig'
import type { NavSection } from '../../animations/stages'

const originOf = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/**
 * 각 구간의 텍스트와, 3D 오브제와 같은 기능을 하는 접근 가능한 HTML 버튼.
 * 3D 장면 위 고정 패널과 WebGL fallback 페이지에서 함께 쓴다.
 */
export function PanelContent({ section, headingLevel = 2 }: { section: NavSection; headingLevel?: 2 | 3 }) {
  const openFocus = useExperience((s) => s.openFocus)
  const replayIntro = useExperience((s) => s.replayIntro)
  const reduced = useExperience((s) => s.reducedMotion)
  const H = `h${headingLevel}` as 'h2'
  const open = (f: Exclude<Focus, { type: 'none' }>) => (e: MouseEvent<HTMLButtonElement>) =>
    openFocus(f, originOf(e), e.currentTarget)

  // 전화 받기: 3D 전화기가 울리는 중이면 수화기를 들고, 서랍이 닫혀 있으면 Contact 구간으로 이동한다.
  // WebGL이 없는 화면에서는 3D 없이 바로 연락처를 연다.
  const startCall = (e: MouseEvent<HTMLButtonElement>) => {
    const s = useExperience.getState()
    if (!s.webgl) {
      s.setCall('connected')
      s.openFocus({ type: 'call' }, originOf(e), e.currentTarget)
    } else if (rig.contact > 0.9 && s.call === 'ringing') s.setCall('pickingUp')
    else scrollToSection('contact', !reduced)
  }

  switch (section) {
    case 'home':
      return (
        <>
          <p className="panel__eyebrow">
            {PROFILE.brand} — {PROFILE.meaning.toUpperCase()}
          </p>
          <H className="panel__title">Look inside.</H>
          <p className="panel__body">상판 위 명함을 눌러 확인하거나, 스크롤해 서랍을 열어 보세요.</p>
          <div className="panel__actions">
            <button type="button" className="btn" data-opener="card-home" onClick={open({ type: 'card', context: 'home' })}>
              명함 보기
            </button>
          </div>
        </>
      )
    case 'about':
      return (
        <>
          <p className="panel__eyebrow">ABOUT / 01</p>
          <H className="panel__title">About me.</H>
          <p className="panel__body">첫 번째 서랍 속 이력서를 눌러 자세히 읽어 보세요.</p>
          <div className="panel__actions">
            <button type="button" className="btn" data-opener="resume" onClick={open({ type: 'resume' })}>
              이력서 열기
            </button>
          </div>
        </>
      )
    case 'work':
      return (
        <>
          <p className="panel__eyebrow">PROJECTS / 02</p>
          <H className="panel__title">Selected work.</H>
          <ul className="panel__files" aria-label="프로젝트 파일">
            {PROJECT_ORDER.map((slug, i) => (
              <li key={slug}>
                <button
                  type="button"
                  className="file-link"
                  data-opener={`file-${slug}`}
                  onClick={open({ type: 'project', slug })}
                >
                  <span className="file-link__no">0{i + 1}</span>
                  <span className="file-link__title">{PROJECTS[slug].title}</span>
                  <span className="file-link__cat">{PROJECTS[slug].category}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )
    case 'contact':
      return (
        <>
          <p className="panel__eyebrow">CONTACT / 03</p>
          <H className="panel__title">Let’s connect.</H>
          <p className="panel__body">울리는 전화의 수화기를 들면 연락처가 나타납니다.</p>
          <div className="panel__actions">
            <button type="button" className="btn" data-opener="call" onClick={startCall}>
              전화 받기
            </button>
            <button type="button" className="btn btn--ghost" data-opener="card-contact" onClick={open({ type: 'card', context: 'contact' })}>
              명함 보기
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => scrollToTop(!reduced)}>
              Back to top
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                scrollToTop(false)
                replayIntro()
              }}
            >
              Replay intro
            </button>
          </div>
        </>
      )
  }
}

/** 3D 장면 위에 고정되는 섹션 패널. 표시/숨김은 마스터 타임라인이 제어한다. */
export default function SectionPanels() {
  return (
    <>
      {(['home', 'about', 'work', 'contact'] as const).map((s) => (
        <section key={s} className={`panel panel-${s}`} aria-label={s.toUpperCase()}>
          <PanelContent section={s} />
        </section>
      ))}
    </>
  )
}

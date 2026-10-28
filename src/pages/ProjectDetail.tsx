import { useEffect, useRef } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { gsap, useGSAP } from '../animations/gsap'
import { scrollToSection } from '../animations/masterTimeline'
import { DETAIL_SECTIONS, PROJECTS, PROJECT_ORDER, isProjectSlug, neighborSlug, projectIndex } from '../data/projects'
import { useExperience } from '../state/experienceStore'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * /work/:slug — 프로젝트 상세(Scene 07의 긴 읽기 화면).
 * 3D 경험 위에 고정된 문서 레이어로 열려 메인 스크롤 위치가 그대로 보존된다.
 */
export default function ProjectDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const scroller = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const reduced = useExperience((s) => s.reducedMotion)
  const valid = isProjectSlug(slug)

  // 상세가 열려 있는 동안 아래 Focus 대화상자는 키 입력을 받지 않는다
  useEffect(() => {
    document.body.dataset.route = 'detail'
    return () => {
      delete document.body.dataset.route
    }
  }, [])

  useEffect(() => {
    if (!valid) return
    scroller.current?.scrollTo({ top: 0 })
    scroller.current?.focus({ preventScroll: true })
    // 목록으로 돌아갈 때 같은 파일이 선택되어 있도록 동기화
    const s = useExperience.getState()
    if (s.focus.type === 'project') s.setProject(slug)
  }, [slug, valid])

  useGSAP(
    () => {
      if (!valid || reduced) return
      gsap.from('.detail__hero > *', { y: 30, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out' })
    },
    { scope: scroller, dependencies: [slug], revertOnUpdate: true },
  )

  const back = () => {
    const s = useExperience.getState()
    const fromFocus = (location.state as { fromFocus?: boolean } | null)?.fromFocus
    navigate('/')
    if (!fromFocus || s.focus.type !== 'project') {
      // 직접 진입한 경우: Work 구간으로 이동하고 해당 파일을 선택 상태로 연다
      requestAnimationFrame(() => {
        scrollToSection('work', false)
        if (valid) s.openFocus({ type: 'project', slug }, null, document.querySelector(`[data-opener="file-${slug}"]`))
      })
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && back()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  if (!valid) return <Navigate to="/" replace />
  const p = PROJECTS[slug]
  const i = projectIndex(slug)
  const prev = neighborSlug(slug, -1)
  const next = neighborSlug(slug, 1)

  return (
    <div
      className="detail"
      ref={scroller}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onScroll={(e) => {
        const el = e.currentTarget
        const r = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)
        if (bar.current) bar.current.style.transform = `scaleX(${r})`
      }}
    >
      <div className="detail__progress" aria-hidden="true">
        <div ref={bar} />
      </div>
      <div className="detail__top">
        <button type="button" className="btn btn--light" onClick={back}>
          ← Back to Work
        </button>
        <span className="detail__count">
          {pad(i + 1)} / {pad(PROJECT_ORDER.length)}
        </span>
      </div>

      <article className="detail__inner">
        <header className="detail__hero">
          <p className="eyebrow">PROJECT {pad(i + 1)}</p>
          <h1 id="detail-title" className="detail__title">
            {p.title}
          </h1>
          <p className="detail__cat">{p.category}</p>
          <dl className="detail__meta">
            <div>
              <dt>Type</dt>
              <dd>{p.kind ?? <span className="todo-inline">TODO</span>}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{p.duration ?? <span className="todo-inline">TODO</span>}</dd>
            </div>
            <div>
              <dt>Team</dt>
              <dd>{p.team ?? <span className="todo-inline">TODO</span>}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{p.role ?? <span className="todo-inline">TODO</span>}</dd>
            </div>
          </dl>
        </header>

        {p.cover ? (
          <img className="detail__cover" src={p.cover} alt={`${p.title} 대표 이미지`} />
        ) : (
          <div className="detail__cover detail__cover--todo" aria-hidden="true">
            <span>Project hero image · TODO</span>
          </div>
        )}

        {DETAIL_SECTIONS.map((s, n) => (
          <section className="detail__section" key={s.key}>
            <h2>
              <span className="detail__num">{pad(n + 1)}</span>
              {s.title}
            </h2>
            {p.sections[s.key] ? (
              <p>{p.sections[s.key]}</p>
            ) : (
              <p className="todo">TODO · 실제 자료로 작성 필요 (임의의 조사 결과·수치를 넣지 않음)</p>
            )}
          </section>
        ))}

        {p.images?.length ? (
          <section className="detail__gallery">
            {p.images.map((src) => (
              <img key={src} src={src} alt="" loading="lazy" />
            ))}
          </section>
        ) : null}

        {p.externalUrl && (
          <p>
            <a className="btn" href={p.externalUrl} target="_blank" rel="noreferrer">
              프로젝트 링크 열기
            </a>
          </p>
        )}

        <nav className="detail__pager" aria-label="다른 프로젝트">
          <Link to={`/work/${prev}`} state={location.state} replace className="detail__pager-link">
            <span className="eyebrow">Previous</span>
            <span>{PROJECTS[prev].title}</span>
          </Link>
          <Link to={`/work/${next}`} state={location.state} replace className="detail__pager-link detail__pager-link--next">
            <span className="eyebrow">Next</span>
            <span>{PROJECTS[next].title}</span>
          </Link>
        </nav>
      </article>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap, useGSAP } from '../../animations/gsap'
import { PROJECTS, PROJECT_ORDER, neighborSlug, projectIndex, type ProjectSlug } from '../../data/projects'
import { useExperience } from '../../state/experienceStore'
import Dialog, { CloseButton } from './Dialog'

const pad = (n: number) => String(n).padStart(2, '0')

function Cover({ slug }: { slug: ProjectSlug }) {
  const p = PROJECTS[slug]
  return p.cover ? (
    <img className="pcard__cover" src={p.cover} alt={`${p.title} 대표 이미지`} loading="lazy" />
  ) : (
    <div className="pcard__cover pcard__cover--todo" aria-hidden="true">
      <span>Cover image · TODO</span>
    </div>
  )
}

/** Work 파일을 꺼냈을 때의 집중 화면: 가로 캐러셀(시안 07) + 전체 파일 그리드(시안 08). */
export default function ProjectFocus({ slug }: { slug: ProjectSlug }) {
  const closeFocus = useExperience((s) => s.closeFocus)
  const setProject = useExperience((s) => s.setProject)
  const reduced = useExperience((s) => s.reducedMotion)
  const [grid, setGrid] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const index = projectIndex(slug)

  useGSAP(
    () => {
      gsap.from('.pfocus__view', { y: 80, opacity: 0, duration: reduced ? 0 : 0.6, ease: 'power3.out' })
    },
    { scope: root },
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (grid) return
      if (e.key === 'ArrowRight') setProject(neighborSlug(slug, 1))
      if (e.key === 'ArrowLeft') setProject(neighborSlug(slug, -1))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [slug, grid, setProject])

  return (
    <Dialog labelledBy="pfocus-title" onClose={closeFocus} className="overlay--project">
      <div className="pfocus" ref={root}>
        <div className="pfocus__bar">
          <h2 id="pfocus-title" className="pfocus__heading">
            PROJECTS / 02
          </h2>
          <div className="pfocus__tools">
            <button type="button" className="btn btn--light" aria-pressed={grid} onClick={() => setGrid((g) => !g)}>
              {grid ? '하나씩 보기' : '전체 파일'}
            </button>
            <button type="button" className="btn btn--light" onClick={closeFocus}>
              Back to files
            </button>
          </div>
          <CloseButton onClick={closeFocus} label="프로젝트 닫기" />
        </div>

        <div className="pfocus__view">
          {grid ? (
            <ul className="pgrid">
              {PROJECT_ORDER.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    className="pcard pcard--grid"
                    onClick={() => {
                      setProject(s)
                      setGrid(false)
                    }}
                  >
                    <Cover slug={s} />
                    <span className="pcard__no">{pad(i + 1)}</span>
                    <span className="pcard__title">{PROJECTS[s].title}</span>
                    <span className="pcard__cat">{PROJECTS[s].category}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="carousel" style={{ ['--i' as string]: index }}>
              <ul className="carousel__track">
                {PROJECT_ORDER.map((s, i) => {
                  const p = PROJECTS[s]
                  const active = i === index
                  return (
                    <li
                      key={s}
                      className={`pcard ${active ? 'is-active' : ''}`}
                      aria-hidden={!active}
                      onClick={() => !active && setProject(s)}
                    >
                      <Cover slug={s} />
                      <div className="pcard__meta">
                        <span className="pcard__no">
                          {pad(i + 1)} / {pad(PROJECT_ORDER.length)}
                        </span>
                        <h3 className="pcard__title">{p.title}</h3>
                        <p className="pcard__cat">{p.category}</p>
                        <Link className="btn" to={`/work/${s}`} state={{ fromFocus: true }} tabIndex={active ? 0 : -1}>
                          Case study 보기 →
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="overlay__controls">
                <button type="button" className="btn btn--light" onClick={() => setProject(neighborSlug(slug, -1))}>
                  ← Previous
                </button>
                <span className="carousel__count" aria-live="polite">
                  {PROJECTS[slug].title} · {pad(index + 1)} / {pad(PROJECT_ORDER.length)}
                </span>
                <button type="button" className="btn btn--light" onClick={() => setProject(neighborSlug(slug, 1))}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}

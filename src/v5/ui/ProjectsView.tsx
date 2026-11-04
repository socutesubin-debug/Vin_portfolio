import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORIES_PROVISIONAL, PROJECTS, categoryOf, findProject, type Project } from '../data/projects'
import { readList, writeList, type Filter } from '../data/listState'
import { focusArrival, focusElement } from '../focus'
import { navigate, type Route } from '../router'

/** Projects 목록(#projects)과 상세(#project-<id>) */
export default function ProjectsView({ route }: { route: Route }) {
  return route.name === 'project' ? <ProjectDetail id={route.id} /> : <ProjectList />
}

// ---------------- 목록 ----------------
function ProjectList() {
  const scroller = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<Filter>(() => readList().filter)
  const shown = filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)

  // 상세에서 돌아오면 스크롤 위치를 복원하고, 열었던 카드로 포커스
  useLayoutEffect(() => {
    const s = readList()
    if (!s.returning) return
    scroller.current!.scrollTop = s.scroll
    writeList({ returning: false })
    const card = s.lastId ? scroller.current!.querySelector<HTMLElement>(`[data-project="${s.lastId}"]`) : null
    if (card) focusElement(card)
  }, [])

  const choose = (f: Filter) => {
    setFilter(f)
    writeList({ filter: f })
  }

  const openCard = (p: Project) => writeList({ filter, scroll: scroller.current!.scrollTop, lastId: p.id, returning: true })

  return (
    <section className="v5-screen v5-projects" aria-labelledby="projects-title">
      <div className="v5-scroll" ref={scroller}>
        <div className="v5-projects-inner">
          <h1 id="projects-title" tabIndex={-1} data-screen-title>
            Projects
          </h1>
          <div className="v5-filters" role="group" aria-label="분류 필터">
            <FilterChip label="All" count={PROJECTS.length} active={filter === 'all'} onClick={() => choose('all')} />
            {CATEGORIES.map((c) => {
              const n = PROJECTS.filter((p) => p.category === c.id).length
              return n ? <FilterChip key={c.id} label={c.label} count={n} active={filter === c.id} onClick={() => choose(c.id)} /> : null
            })}
          </div>
          <p className="v5-projects-note">
            {CATEGORIES_PROVISIONAL && <span className="v5-badge">분류명 확정 필요</span>}
            <span>지금 보이는 프로젝트는 모두 자리표시예요. 실제 작업으로 교체할 예정입니다.</span>
          </p>
          <p className="v5-sr" role="status">
            {shown.length}개 프로젝트
          </p>
          <ul className="v5-cards">
            {shown.map((p) => (
              <li key={p.id}>
                <a className="v5-card" href={`#project-${p.id}`} data-project={p.id} onClick={() => openCard(p)}>
                  <Thumb p={p} />
                  <span className="v5-card-row">
                    <span className="v5-card-title">{p.title}</span>
                    <span className="v5-card-arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                  <span className="v5-card-summary">
                    {categoryOf(p.category).label} · {p.summary}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className="v5-chip" aria-pressed={active} onClick={onClick}>
      {label} <span className="v5-chip-count">{count}</span>
    </button>
  )
}

function Thumb({ p, large }: { p: Project; large?: boolean }) {
  if (p.cover) return <img className="v5-thumb" src={p.cover} alt="" loading={large ? 'eager' : 'lazy'} />
  return (
    <span className="v5-thumb v5-thumb-empty" data-large={large}>
      <span>대표 이미지 준비 중</span>
    </span>
  )
}

// ---------------- 상세 ----------------
const SECTIONS: { key: keyof Project['study']; title: string }[] = [
  { key: 'problem', title: '문제와 목표' },
  { key: 'research', title: '조사와 관찰' },
  { key: 'decisions', title: '디자인 판단' },
  { key: 'flow', title: '흐름과 주요 화면' },
  { key: 'feedback', title: '피드백과 수정' },
  { key: 'result', title: '결과와 배운 점' },
]

const Pending = ({ children = '확인 필요' }: { children?: string }) => <span className="v5-placeholder-inline">{children}</span>
const isTemp = (v: string) => v.includes('임시')

function ProjectDetail({ id }: { id?: string }) {
  const p = findProject(id)
  const scroller = useRef<HTMLDivElement>(null)

  // 상세 도착 → 맨 위, 제목으로 포커스
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
    focusArrival(scroller.current ?? document)
  }, [id])

  if (!p) {
    return (
      <section className="v5-screen v5-projects">
        <div className="v5-scroll" ref={scroller}>
          <div className="v5-projects-inner v5-detail">
            <h1 tabIndex={-1} data-screen-title>
              프로젝트를 찾을 수 없어요
            </h1>
            <a className="v5-btn v5-btn-light" href="#projects">
              프로젝트 목록
            </a>
          </div>
        </div>
      </section>
    )
  }

  const s = p.study
  return (
    <section className="v5-screen v5-projects" aria-labelledby="detail-title">
      <div className="v5-scroll" ref={scroller}>
        <article className="v5-projects-inner v5-detail">
          <a className="v5-textlink" href="#projects">
            ← 프로젝트 목록
          </a>
          <p className="v5-eyebrow">
            {categoryOf(p.category).label}
            {CATEGORIES_PROVISIONAL && ' (분류명 확정 필요)'}
          </p>
          <h1 id="detail-title" tabIndex={-1} data-screen-title>
            {p.title} {p.placeholder && <span className="v5-badge">자리표시</span>}
          </h1>
          <p className="v5-detail-summary">{p.summary}</p>
          <Thumb p={p} large />

          <h2>배경 · 기간 · 팀 · 내 역할</h2>
          <dl className="v5-meta">
            <dt>작업 성격</dt>
            <dd>{s.kind ?? <Pending>개인 작업 · 수업 과제 · 가상 프로젝트 여부 확인 필요</Pending>}</dd>
            <dt>기간</dt>
            <dd>{isTemp(p.period) ? <Pending /> : p.period}</dd>
            <dt>팀</dt>
            <dd>{s.team ?? <Pending />}</dd>
            <dt>내 역할 · 기여 범위</dt>
            <dd>{isTemp(p.role) ? <Pending /> : p.role}</dd>
            <dt>도구</dt>
            <dd>{p.tools.every(isTemp) ? <Pending /> : p.tools.join(', ')}</dd>
          </dl>

          {SECTIONS.map((sec) => (
            <section key={sec.key} className="v5-detail-sec">
              <h2>{sec.title}</h2>
              {s[sec.key] ? <p>{s[sec.key]}</p> : <p className="v5-placeholder">{sec.title} — 확인된 내용으로 작성 예정</p>}
            </section>
          ))}

          <nav className="v5-detail-foot" aria-label="다음 이동">
            <button type="button" className="v5-btn v5-btn-ghost-light" onClick={() => navigate('#projects')}>
              ← 프로젝트 목록
            </button>
            <a className="v5-btn v5-btn-light" href="#contact">
              연락하기 →
            </a>
          </nav>
        </article>
      </div>
    </section>
  )
}

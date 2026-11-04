import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, PROJECTS, type CategoryId } from '../../v2/data/projects'
import { useHome } from '../state/homeStore'

type Filter = 'all' | CategoryId

/**
 * WORK 프로젝트 목록(HTML). 서랍 속 파일을 누르거나 한 번 더 스크롤하면(WORK_LIST) 뒤 장면이 흐려지며 열린다.
 * 제목 · 분류 필터(개수) · 두 줄 카드(대표 이미지 + 이름 + 화살표). 목록은 이 안에서 스크롤된다.
 * Escape·"서랍으로" 버튼은 서랍 속 파일로, HOME 메뉴는 HOME으로 돌아간다.
 * 내용은 v2/data/projects.ts를 그대로 쓴다(지금은 임시 프로젝트).
 */
export default function WorkList() {
  const open = useHome((s) => s.mode === 'WORK_LIST')
  const backToFiles = useHome((s) => s.backToFiles)
  const [filter, setFilter] = useState<Filter>('all')
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    titleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') backToFiles()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [open, backToFiles])

  const shown = useMemo(() => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)), [filter])

  if (!open) return null
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: PROJECTS.length },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, count: PROJECTS.filter((p) => p.category === c.id).length })),
  ]

  return (
    <section className="v4-work" aria-labelledby="v4-work-title">
      <div className="v4-work__inner">
        <button type="button" className="v4-work__back" onClick={backToFiles}>
          <span aria-hidden="true">←</span> Drawer
        </button>
        <h2 id="v4-work-title" ref={titleRef} tabIndex={-1} className="v4-work__title">
          Projects
        </h2>
        <div className="v4-work__chips" role="group" aria-label="분류">
          {chips.map((c) => (
            <button key={c.id} type="button" className="v4-chip" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
              <small>{c.count}</small>
            </button>
          ))}
        </div>
        <ul className="v4-work__grid">
          {shown.map((p) => (
            <li key={p.id} className="v4-card">
              <div className="v4-card__cover">
                {p.cover ? <img src={p.cover} alt="" loading="lazy" /> : <span className="v4-todo">이미지 준비 중</span>}
              </div>
              <div className="v4-card__meta">
                <h3>{p.title}</h3>
                <span aria-hidden="true">→</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

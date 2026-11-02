import { useEffect, useRef, useState } from 'react'
import { DRAWER_SLOTS } from '../config/cabinet'
import { CATEGORIES, PROJECTS, type CategoryId } from '../data/projects'
import { useWorkspace } from '../state/workspaceStore'

const PROJECT_DRAWER = DRAWER_SLOTS.findIndex((s) => s.contents === 'projects')
type Filter = 'all' | CategoryId

/** 전체 보기: 카테고리 필터 칩 + 2열 프로젝트 그리드(모바일 1열) */
export default function ProjectGrid() {
  const open = useWorkspace((s) => s.gridOpen)
  const [filter, setFilter] = useState<Filter>('all')
  const backRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    backRef.current?.focus()
    return () => prev?.focus?.()
  }, [open])

  if (!open) return null

  const { setGridOpen, setOpenDrawer, setOpenProject } = useWorkspace.getState()
  const back = () => {
    setGridOpen(false)
    setOpenDrawer(PROJECT_DRAWER)
  }
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: PROJECTS.length },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, count: PROJECTS.filter((p) => p.category === c.id).length })),
  ]
  const shown = filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)

  return (
    <div className="v2-grid" role="dialog" aria-modal="true" aria-labelledby="v2-grid-title">
      <div className="v2-grid__bar">
        <button ref={backRef} type="button" className="v2-grid__back" onClick={back}>
          ← 서랍으로 돌아가기
        </button>
      </div>

      <h2 id="v2-grid-title" className="v2-grid__title">
        Selected Projects
      </h2>

      <div className="v2-grid__chips" role="group" aria-label="카테고리">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className="v2-chip"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
            <sup>{c.count}</sup>
          </button>
        ))}
      </div>

      <ul className="v2-grid__list">
        {shown.map((p) => (
          <li key={p.id}>
            <button type="button" className="v2-grid__card" onClick={() => setOpenProject(p.id)}>
              {p.cover ? (
                <img className="v2-grid__cover" src={p.cover} alt="" />
              ) : (
                <div className="v2-grid__cover v2-grid__cover--empty">대표 이미지 준비 중</div>
              )}
              <span className="v2-grid__meta">
                <strong>{p.title}</strong>
                <span>{p.summary}</span>
              </span>
              <span className="v2-grid__arrow" aria-hidden="true">
                ↘
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

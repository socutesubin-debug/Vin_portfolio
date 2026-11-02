import { useEffect, useRef } from 'react'
import { categoryOf, findProject } from '../data/projects'
import { useWorkspace } from '../state/workspaceStore'

/** 폴더를 고르면 열리는 2D 전체 화면 프로젝트 상세. 닫기 버튼·ESC로 서랍 화면에 돌아간다 */
export default function ProjectDetail() {
  const project = findProject(useWorkspace((s) => s.openProject))
  const setOpenProject = useWorkspace((s) => s.setOpenProject)
  const closeRef = useRef<HTMLButtonElement>(null)

  // 열릴 때 닫기 버튼에 포커스, 닫히면 원래 자리(폴더 포스트잇·그리드 카드)로
  useEffect(() => {
    if (!project) return
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => prev?.focus?.()
  }, [project])

  if (!project) return null
  const category = categoryOf(project.category)

  return (
    <div className="v2-detail" role="dialog" aria-modal="true" aria-labelledby="v2-detail-title">
      <div className="v2-detail__bar">
        <span className="v2-detail__chip" style={{ background: category.color }}>
          {category.label}
        </span>
        <button ref={closeRef} type="button" className="v2-detail__close" onClick={() => setOpenProject(null)}>
          닫기 <span aria-hidden="true">✕</span>
        </button>
      </div>

      <article className="v2-detail__body">
        <header>
          <h2 id="v2-detail-title">{project.title}</h2>
          <p className="v2-detail__summary">{project.summary}</p>
          <dl className="v2-detail__meta">
            <div>
              <dt>역할</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>기간</dt>
              <dd>{project.period}</dd>
            </div>
            <div>
              <dt>사용 툴</dt>
              <dd>{project.tools.join(', ')}</dd>
            </div>
          </dl>
        </header>

        {project.cover ? (
          <img className="v2-detail__cover" src={project.cover} alt={`${project.title} 대표 이미지`} />
        ) : (
          <div className="v2-detail__cover v2-detail__cover--empty">대표 이미지 준비 중</div>
        )}

        {project.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>
    </div>
  )
}

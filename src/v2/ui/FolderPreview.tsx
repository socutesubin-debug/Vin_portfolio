import { useEffect, useLayoutEffect, useRef } from 'react'
import { categoryOf, findProject } from '../data/projects'
import { useWorkspace, type Pulled } from '../state/workspaceStore'

/** 화면 가운데 놓였을 때 폴더 기울기 */
const TILT = -3
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function PaperClip() {
  return (
    <svg className="v2-folder__clip" viewBox="0 0 40 96" aria-hidden="true">
      <path
        d="M14 30 V78 a8 8 0 0 0 16 0 V18 a12 12 0 0 0 -24 0 V70"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * 서랍에서 뽑힌 카드를 서류 폴더처럼 화면 가운데에 띄운다.
 * 3D 카드가 뽑혀 올라간 화면 위치(origin)에서 커지며 날아오고, 닫을 때는 그 자리로 줄어들며 돌아간다.
 */
function Folder({ pulled }: { pulled: Pulled }) {
  const project = findProject(pulled.id)!
  const category = categoryOf(project.category)
  const closing = useWorkspace((s) => s.pullClosing)
  const { requestUnpull, finishUnpull, setOpenProject } = useWorkspace.getState()
  const layer = useRef<HTMLDivElement>(null)
  const folder = useRef<HTMLDivElement>(null)
  const more = useRef<HTMLButtonElement>(null)

  /** 폴더 가운데에서 origin까지의 이동량 */
  const fromOrigin = () => {
    const r = folder.current!.getBoundingClientRect()
    return `translate(${pulled.origin.x - (r.left + r.width / 2)}px, ${pulled.origin.y - (r.top + r.height / 2)}px) scale(0.16) rotate(0deg)`
  }
  const rest = `translate(0px, 0px) scale(1) rotate(${TILT}deg)`

  // 들어오기
  useLayoutEffect(() => {
    // 키보드 사용자를 위해 포커스는 옮기되, 마우스로 열었을 때는 포커스 테두리를 그리지 않는다
    more.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
    if (reduced()) return
    folder.current!.animate(
      [
        { transform: fromOrigin(), opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: rest, opacity: 1 },
      ],
      { duration: 620, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' },
    )
    layer.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 서랍으로 돌아가기
  useEffect(() => {
    if (!closing) return
    if (reduced()) return finishUnpull()
    const a = folder.current!.animate(
      [
        { transform: rest, opacity: 1 },
        { opacity: 1, offset: 0.75 },
        { transform: fromOrigin(), opacity: 0 },
      ],
      { duration: 420, easing: 'cubic-bezier(0.5, 0, 0.75, 0.2)', fill: 'forwards' },
    )
    layer.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' })
    a.onfinish = finishUnpull
    return () => {
      a.onfinish = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing])

  return (
    <div ref={layer} className="v2-folder-layer" onClick={requestUnpull}>
      <div
        ref={folder}
        className="v2-folder"
        style={{ transform: rest }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="v2-folder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="v2-folder__tab">
          <span style={{ background: category.color }} />
          {project.tab ?? project.title}
        </div>

        <figure className="v2-folder__photo">
          {project.cover ? (
            <img src={project.cover} alt={`${project.title} 대표 이미지`} />
          ) : (
            <div className="v2-folder__photo-empty">대표 이미지 준비 중</div>
          )}
          <PaperClip />
        </figure>

        <div className="v2-folder__info">
          <dl>
            <div>
              <dt>Project</dt>
              <dd id="v2-folder-title">{project.title}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>{project.period}</dd>
            </div>
            <div>
              <dt>Tools</dt>
              <dd>{project.tools.join(', ')}</dd>
            </div>
            <div>
              <dt>Note</dt>
              <dd>{project.summary}</dd>
            </div>
          </dl>
        </div>

        <button ref={more} type="button" className="v2-folder__postit" onClick={() => setOpenProject(project.id)}>
          자세히 보기 →
        </button>
        <button type="button" className="v2-folder__close" onClick={requestUnpull} aria-label="폴더를 서랍에 다시 넣기">
          ✕
        </button>
      </div>
    </div>
  )
}

export default function FolderPreview() {
  const pulled = useWorkspace((s) => s.pulled)
  return pulled ? <Folder key={pulled.id} pulled={pulled} /> : null
}

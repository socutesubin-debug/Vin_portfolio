import { useCallback, useEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORIES_PROVISIONAL, PROJECTS } from '../data/projects'
import { writeList } from '../data/listState'
import { focusElement } from '../focus'
import { prefersReducedMotion } from '../prefs'
import { navigate } from '../router'
import { hasWebGL } from '../three/webgl'
import type { WorkAnchor, WorkScene } from '../three/WorkScene'
import { Fallback, Loading } from './SceneStatus'

type Status = 'loading' | 'ready' | 'error' | 'nowebgl'

const TABS = CATEGORIES.map((c) => ({ ...c, count: PROJECTS.filter((p) => p.category === c.id).length })).filter((t) => t.count > 0)

/**
 * Work · 수납장. 가운데 서랍(drawer2) '프로젝트 서랍 열기' → 서랍이 나오며 파일 탭 → 탭 → 해당 분류 목록.
 * 3D 버튼은 모두 같은 동작을 하는 HTML 버튼이 사물 위에 붙어 있어 키보드·터치로도 실행된다.
 */
export default function WorkView() {
  const host = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<WorkScene | null>(null)
  const openBtn = useRef<HTMLButtonElement>(null)
  const tabBtns = useRef<HTMLButtonElement[]>([])
  const busy = useRef(false)
  const [status, setStatus] = useState<Status>(() => (hasWebGL() ? 'loading' : 'nowebgl'))
  const [progress, setProgress] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  const goList = useCallback((filter: (typeof TABS)[number]['id'] | 'all') => {
    writeList({ filter, scroll: 0, lastId: null, returning: false })
    navigate('#projects')
  }, [])

  const openDrawer = useCallback(() => {
    const s = sceneRef.current
    if (!s || busy.current || s.isOpen) return
    busy.current = true
    setOpen(true)
    s.open(() => {
      busy.current = false
      focusElement(tabBtns.current[0])
    })
  }, [])

  const closeDrawer = useCallback(() => {
    const s = sceneRef.current
    if (!s || busy.current || !s.isOpen) return
    busy.current = true
    setOpen(false)
    s.close(() => {
      busy.current = false
    })
  }, [])

  // 서랍이 닫히면 다시 그려진 '프로젝트 서랍 열기' 버튼으로 포커스를 돌려준다
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !open) focusElement(openBtn.current)
    wasOpen.current = open
  }, [open])

  const pickTab = useCallback(
    (id: (typeof TABS)[number]['id']) => {
      const s = sceneRef.current
      if (!s || busy.current) return
      busy.current = true
      s.pick(id, () => goList(id))
    },
    [goList],
  )

  // 3D 사물 클릭·탭
  const onPick = useRef<(t: WorkAnchor) => void>(() => {})
  onPick.current = (t) => {
    if (t === 'drawer') openDrawer()
    else pickTab(t.slice(4) as (typeof TABS)[number]['id'])
  }

  // 장면은 이 화면에 들어올 때만 불러온다(three.js·모델 지연 로드)
  useEffect(() => {
    if (status === 'nowebgl') return
    let scene: WorkScene | null = null
    let cancelled = false
    import('../three/WorkScene')
      .then(({ WorkScene }) => {
        if (cancelled) return
        scene = new WorkScene(host.current!, {
          tabs: TABS,
          reducedMotion: prefersReducedMotion(),
          onProgress: setProgress,
          onPick: (t) => onPick.current(t),
        })
        sceneRef.current = scene
        return scene.ready
      })
      .then(() => !cancelled && setStatus('ready'))
      .catch((err) => {
        console.error('[Work] 3D 장면을 불러오지 못했습니다', err)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
      scene?.dispose()
      sceneRef.current = null
    }
  }, [status === 'nowebgl'])

  // Escape: 서랍이 열려 있으면 닫는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && open && closeDrawer()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeDrawer])

  const bind = (id: WorkAnchor) => (el: HTMLElement | null) => sceneRef.current?.bindAnchor(id, el)
  const ready = status === 'ready'
  const fallback = status === 'error' || status === 'nowebgl'

  return (
    <section className="v5-screen v5-work" aria-labelledby="work-title" data-open={open}>
      <div className="v5-work-canvas" ref={host} aria-hidden="true" />

      <div className="v5-work-head">
        <p className="v5-eyebrow">Work · 수납장</p>
        <h1 id="work-title" tabIndex={-1} data-screen-title>
          서랍을 열어 프로젝트를 찾아보세요
        </h1>
        <a className="v5-textlink" href="#projects" onClick={() => writeList({ filter: 'all', scroll: 0, returning: false })}>
          프로젝트 목록 바로 보기 →
        </a>
      </div>

      {status === 'loading' && <Loading label="수납장을 불러오는 중…" progress={progress} />}

      {ready && (
        <div className="v5-anchors">
          {!open && (
            <button
              ref={(el) => {
                openBtn.current = el
                bind('drawer')(el)
              }}
              type="button"
              className="v5-anchor v5-anchor-drawer"
              onClick={openDrawer}
            >
              프로젝트 서랍 열기
            </button>
          )}
          {open &&
            TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  if (el) tabBtns.current[i] = el
                  bind(`tab:${t.id}`)(el)
                }}
                type="button"
                className="v5-anchor v5-anchor-tab"
                onClick={() => pickTab(t.id)}
                aria-label={`${t.label} 파일 열기, 프로젝트 ${t.count}개`}
              >
                <span aria-hidden="true">{t.label}</span>
              </button>
            ))}
        </div>
      )}

      {ready && open && (
        <div className="v5-work-foot">
          <p className="v5-note" role="status">
            파일 탭을 골라 주세요.
            {CATEGORIES_PROVISIONAL && <span className="v5-badge">분류명 확정 필요</span>}
          </p>
          <button type="button" className="v5-btn v5-btn-ghost-light" onClick={closeDrawer}>
            서랍 닫기
          </button>
        </div>
      )}

      {fallback && (
        <Fallback reason={status === 'nowebgl' ? 'webgl' : 'load'} illustration={<StaticCabinet />}>
          <ul className="v5-fallback-tabs">
            {TABS.map((t) => (
              <li key={t.id}>
                <button type="button" className="v5-btn v5-btn-light" onClick={() => goList(t.id)}>
                  {t.label} 파일 <span className="v5-sub">{t.count}</span>
                </button>
              </li>
            ))}
          </ul>
          {CATEGORIES_PROVISIONAL && <span className="v5-badge">분류명 확정 필요</span>}
        </Fallback>
      )}
    </section>
  )
}

/** 폴백용 정적 수납장 그림 */
function StaticCabinet() {
  return (
    <svg viewBox="0 0 140 190" width="100%" height="100%" role="img">
      <rect x="4" y="4" width="132" height="166" rx="4" fill="#24318f" stroke="#c9ccd3" strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="12" y={12 + i * 52} width="116" height="46" rx="3" fill={i === 1 ? '#2d3ca6' : '#22307f'} stroke="#c9ccd3" strokeWidth="1.5" />
          <rect x="58" y={30 + i * 52} width="24" height="8" rx="2" fill="#d8dbe1" />
        </g>
      ))}
      <path d="M12 170 L24 186 H116 L128 170" fill="#24318f" />
    </svg>
  )
}

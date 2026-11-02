import { useEffect } from 'react'
import { DRAWER_SLOTS } from '../config/cabinet'
import { PROJECTS } from '../data/projects'
import { overlayOpen, useWorkspace } from '../state/workspaceStore'

const PROJECT_DRAWER = DRAWER_SLOTS.findIndex((s) => s.contents === 'projects')

/**
 * WORK 장면의 2D 조작:
 * - 서랍이 열려 있으면 "서랍 닫기"·"전체 보기" 버튼, 닫혀 있으면 안내 문구
 * - ESC: 맨 위 화면부터 하나씩 닫는다(상세 → 폴더 → 그리드 → 서랍)
 * - 키보드 사용자를 위한 숨김 버튼 목록(포커스하면 보인다)
 */
export default function WorkControls() {
  const scene = useWorkspace((s) => s.activeScene)
  const openDrawer = useWorkspace((s) => s.openDrawer)
  const covered = useWorkspace(overlayOpen)
  const { setOpenDrawer, setGridOpen, pull } = useWorkspace.getState()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = useWorkspace.getState()
      if (s.openProject) s.setOpenProject(null)
      else if (s.pulled) s.requestUnpull()
      else if (s.gridOpen) {
        s.setGridOpen(false)
        s.setOpenDrawer(PROJECT_DRAWER)
      } else if (s.openDrawer !== null) s.setOpenDrawer(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (scene !== 'work' || covered) return null
  const drawerOpen = openDrawer !== null
  // 키보드로 고른 카드는 화면 아래 가운데에서 뽑혀 나오는 것처럼 보이게 한다
  const keyboardOrigin = () => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.8 })

  return (
    <>
      <div className="v2-work-hint" aria-hidden={drawerOpen ? undefined : 'true'}>
        {drawerOpen ? (
          <>
            <button type="button" className="v2-pill" onClick={() => setOpenDrawer(null)}>
              서랍 닫기
            </button>
            <button type="button" className="v2-pill v2-pill--dark" onClick={() => setGridOpen(true)}>
              전체 보기
            </button>
          </>
        ) : (
          <span className="v2-pill v2-pill--quiet">맨 위 서랍을 열어 보세요</span>
        )}
      </div>

      <nav className="v2-skip" aria-label="WORK 서랍">
        {!drawerOpen ? (
          <button type="button" onClick={() => setOpenDrawer(PROJECT_DRAWER)}>
            WORK 서랍 열기
          </button>
        ) : (
          <ul>
            {PROJECTS.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => pull({ id: p.id, origin: keyboardOrigin() })}>
                  {p.title}
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => setGridOpen(true)}>
                전체 보기
              </button>
            </li>
          </ul>
        )}
      </nav>
    </>
  )
}

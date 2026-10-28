import { SCENE_ORDER, SCENES } from '../config/scenes'
import { scrollToScene } from '../animation/cameraTimeline'
import { useWorkspace } from '../state/workspaceStore'

/** 상단 중앙 메뉴. 현재 장면에 밑줄 */
export default function TopNav() {
  const active = useWorkspace((s) => s.activeScene)

  return (
    <nav className="v2-nav" aria-label="섹션">
      <span className="v2-nav__brand">VIN</span>
      <ul>
        {SCENE_ORDER.map((id) => (
          <li key={id}>
            <button
              type="button"
              className="v2-nav__link"
              aria-current={active === id ? 'true' : undefined}
              onClick={() => scrollToScene(id)}
            >
              {SCENES[id].label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

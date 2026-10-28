import { useGSAP } from '../animations/gsap'
import { SCENE_ORDER, SCENES, SCROLL, SHOW_CAMERA_PANEL } from './config/scenes'
import { buildCameraTimeline, SCROLL_TRACK_ID, TIMELINE_LENGTH } from './animation/cameraTimeline'
import { useWorkspace } from './state/workspaceStore'
import WorkspaceCanvas from './scene/WorkspaceCanvas'
import TopNav from './ui/TopNav'
import DevCameraPanel from './ui/DevCameraPanel'
import './ui/v2.css'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** V2: 잠시 자리를 비운 디자이너의 작업실 */
export default function V2App() {
  const setActiveScene = useWorkspace((s) => s.setActiveScene)

  useGSAP(() => {
    buildCameraTimeline({ reduced: reducedMotion(), onScene: setActiveScene })
  })

  return (
    <>
      <div className="v2-stage">
        <WorkspaceCanvas />
      </div>
      <TopNav />
      {SHOW_CAMERA_PANEL && <DevCameraPanel />}

      {/* 스크롤 길이를 만드는 영역. 장면 이름은 스크린리더용 */}
      <main
        id={SCROLL_TRACK_ID}
        className="v2-scroll-track"
        style={{ height: `calc(${TIMELINE_LENGTH * SCROLL.vhPerUnit}vh + 100vh)` }}
      >
        <h1 className="sr-only">VIN — 잠시 자리를 비운 디자이너의 작업실</h1>
        {SCENE_ORDER.map((id) => (
          <h2 key={id} className="sr-only">
            {SCENES[id].label}
          </h2>
        ))}
      </main>
    </>
  )
}

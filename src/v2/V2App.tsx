import { useEffect } from 'react'
import { useGSAP } from '../animations/gsap'
import { SCENE_ORDER, SCENES, SCROLL, SHOW_CAMERA_PANEL } from './config/scenes'
import {
  buildCameraTimeline,
  sceneFromUrl,
  scrollToScene,
  SCROLL_TRACK_ID,
  TIMELINE_LENGTH,
} from './animation/cameraTimeline'
import { overlayOpen, useWorkspace } from './state/workspaceStore'
import WorkspaceCanvas from './scene/WorkspaceCanvas'
import TopNav from './ui/TopNav'
import DevCameraPanel from './ui/DevCameraPanel'
import WorkControls from './ui/WorkControls'
import ProjectDetail from './ui/ProjectDetail'
import FolderPreview from './ui/FolderPreview'
import ProjectGrid from './ui/ProjectGrid'
import KeyBadge from './ui/KeyBadge'
import ContactControls from './ui/ContactControls'
import MessageCard from './ui/MessageCard'
import './ui/v2.css'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** V2: 잠시 자리를 비운 디자이너의 작업실 */
export default function V2App() {
  const setActiveScene = useWorkspace((s) => s.setActiveScene)
  const covered = useWorkspace(overlayOpen)

  // 폴더·그리드·상세·메시지 카드가 떠 있는 동안 배경 스크롤을 잠근다(카메라가 움직이지 않게)
  useEffect(() => {
    if (!covered) return
    const html = document.documentElement
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = ''
    }
  }, [covered])

  useGSAP(() => {
    buildCameraTimeline({ reduced: reducedMotion(), onScene: setActiveScene })
    const start = sceneFromUrl()
    if (start) requestAnimationFrame(() => scrollToScene(start, true))
  })

  return (
    <>
      <div className="v2-stage">
        <WorkspaceCanvas />
      </div>
      <TopNav />
      <WorkControls />
      <KeyBadge />
      <ContactControls />
      <MessageCard />
      {/* 겹침 순서: 폴더 미리보기 < 전체 보기 < 상세 */}
      <FolderPreview />
      <ProjectGrid />
      <ProjectDetail />
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

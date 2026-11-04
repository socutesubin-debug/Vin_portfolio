import HomeCanvas from './scene/HomeCanvas'
import HomeChrome from './ui/HomeChrome'
import AboutPanel from './ui/AboutPanel'
import WorkList from './ui/WorkList'
import SceneNav from './ui/SceneNav'
import HotspotButtons from './ui/HotspotButtons'
import DevHud from './dev/DevHud'
import './ui/v4.css'

/** V4: 실제 3D 인터랙티브 작업실. HOME(책상) · ABOUT(노트북) · WORK(책상 밑 서랍장). 인물·인트로 영상은 이번 범위에서 제외 */
export default function V4App() {
  return (
    <>
      <main className="v4-stage">
        <h1 className="sr-only">VIN — Vision Inside 작업실</h1>
        <HomeCanvas />
      </main>
      {/* Tab 순서: 로고 → 메뉴 → 사운드 → 오브제 버튼 */}
      <HomeChrome />
      <HotspotButtons />
      <AboutPanel />
      <WorkList />
      <SceneNav />
      {import.meta.env.DEV && <DevHud />}
    </>
  )
}

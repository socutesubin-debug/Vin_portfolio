import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { focusArrival } from './focus'
import { prefersReducedMotion } from './prefs'
import { sceneOf, useRoute, type Route } from './router'
import { Nav } from './ui/Nav'
import { HomeView } from './ui/HomeView'
import './v5.css'

// 장면 화면은 들어갈 때만 불러온다(three.js·모델은 이 청크들 안에서 다시 동적 import)
const WorkView = lazy(() => import('./ui/WorkView'))
const ProjectsView = lazy(() => import('./ui/ProjectsView'))
const ContactView = lazy(() => import('./ui/ContactView'))

const TITLES: Record<ReturnType<typeof sceneOf>, string> = {
  home: 'Home',
  work: 'Work',
  projects: 'Projects',
  contact: 'Contact',
}

/** 화면 전환: 장면이 바뀌면 짧게 페이드(나감 0.15s + 들어옴 0.2s). 같은 장면 안의 패널 전환은 바로 바뀐다 */
export default function V5App() {
  const route = useRoute()
  const [shown, setShown] = useState<Route>(route)
  const stage = useRef<HTMLDivElement>(null)
  const latest = useRef(route)
  latest.current = route

  useEffect(() => {
    if (sceneOf(route) === sceneOf(shown)) {
      setShown(route)
      return
    }
    const el = stage.current!
    gsap.killTweensOf(el)
    if (prefersReducedMotion()) {
      setShown(route)
      return
    }
    gsap.to(el, {
      opacity: 0,
      duration: 0.15,
      ease: 'power1.in',
      // 연속 클릭·뒤로 가기: 페이드가 끝난 시점의 최신 주소를 보여 준다
      onComplete: () => setShown(latest.current),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.name, route.id])

  const scene = sceneOf(shown)
  const prevScene = useRef<string | null>(null)
  useLayoutEffect(() => {
    document.title = `${TITLES[scene]} — Vision INside`
    document.body.dataset.scene = scene
    if (prevScene.current === scene) return
    const first = prevScene.current === null
    prevScene.current = scene
    const el = stage.current!
    gsap.killTweensOf(el)
    gsap.to(el, { opacity: 1, duration: prefersReducedMotion() ? 0 : 0.2, ease: 'power1.out' })
    // 첫 진입은 포커스를 옮기지 않는다(스크린리더가 문서 처음부터 읽게). 그 뒤 새 화면 도착 → 제목
    if (!first && !['about', 'resume', 'message', 'project'].includes(shown.name)) focusArrival(el)
  }, [scene, shown.name])

  return (
    <>
      {/* 해시는 라우터가 쓰므로 건너뛰기는 링크 대신 버튼으로 본문 제목에 포커스를 옮긴다 */}
      <button type="button" className="v5-skip" onClick={() => focusArrival(stage.current!)}>
        본문으로 건너뛰기
      </button>
      <Nav route={route} />
      <main id="main" className="v5-stage" ref={stage}>
        <Suspense fallback={<div className="v5-screen v5-loading-screen" role="status">불러오는 중…</div>}>
          {scene === 'home' && <HomeView route={shown} />}
          {scene === 'work' && <WorkView />}
          {scene === 'projects' && <ProjectsView route={shown} />}
          {scene === 'contact' && <ContactView route={shown} />}
        </Suspense>
      </main>
      <p className="v5-copy" aria-hidden="true">
        ©2026
      </p>
    </>
  )
}

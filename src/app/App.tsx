import { Suspense, lazy, useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { gsap, useGSAP } from '../animations/gsap'
import { setInkBoost, setInkWobble } from '../animations/inkBleed'
import { buildMasterTimeline } from '../animations/masterTimeline'
import SceneLabels from '../components/three/SceneLabels'
import HeaderNav from '../components/navigation/HeaderNav'
import FocusLayer from '../components/overlays/FocusLayer'
import { ResumeSheet } from '../components/overlays/ResumeDetail'
import SectionPanels, { PanelContent } from '../scenes/Panels/SectionPanels'
import IntroTypography from '../scenes/Intro/IntroTypography'
import InkBleedFilter from '../scenes/Intro/InkBleedFilter'
import { SCROLL_VH_PER_UNIT, TIMELINE_LENGTH } from '../animations/stages'
import { PROFILE } from '../data/profile'
import { useExperience } from '../state/experienceStore'
import { useReducedMotionSync } from '../hooks/useReducedMotionSync'
import { hasWebGL } from '../utils/webgl'

// 3D(three.js)와 상세 페이지는 별도 청크로 지연 로드한다. 인트로 타이포는 먼저 그려진다.
const PortfolioCanvas = lazy(() => import('../components/three/PortfolioCanvas'))
const ProjectDetail = lazy(() => import('../pages/ProjectDetail'))

/**
 * 브랜드 프리롤이 끝나면 빈 화면에서 번진 잉크 문장이 일렁이며 자동으로 나타난다.
 * 이후 스크롤하면(마스터 타임라인) 잉크가 가라앉으며 선명해진다.
 */
function IntroStatement() {
  const ref = useRef<HTMLParagraphElement>(null)
  const introDone = useExperience((s) => s.introDone)
  const introRun = useExperience((s) => s.introRun)
  const reduced = useExperience((s) => s.reducedMotion)

  useGSAP(
    () => {
      const p = ref.current
      if (!p) return
      setInkWobble(!reduced)
      if (!introDone) {
        gsap.set(p, { opacity: 0 })
        return
      }
      if (reduced) {
        gsap.set(p, { opacity: 1 })
        setInkBoost(1)
        return
      }
      // 등장: 투명 → 불투명, 번짐은 평소보다 훨씬 강하게 시작해 가라앉는다
      const boost = { b: 2.4 }
      setInkBoost(boost.b)
      gsap.to(p, { opacity: 1, duration: 2.4, ease: 'power2.out' })
      gsap.to(boost, { b: 1, duration: 3, ease: 'power2.out', onUpdate: () => setInkBoost(boost.b) })
    },
    { dependencies: [introDone, introRun, reduced], revertOnUpdate: true },
  )

  return (
    <div className="intro-statement">
      <InkBleedFilter />
      <p ref={ref}>
        Hi, I’m <em>{PROFILE.nameDisplay}</em>.
        <br />I turn ideas
        <br />
        into experiences.
        <br />
        <span className="kern-w">W</span>elcome to my world.
      </p>
    </div>
  )
}

/** 단일 Canvas + 하나의 스크롤 타임라인으로 구성된 메인 경험 */
function Experience({ paused, focusOpen }: { paused: boolean; focusOpen: boolean }) {
  const reduced = useExperience((s) => s.reducedMotion)
  const setStage = useExperience((s) => s.setStage)

  useGSAP(() => void buildMasterTimeline({ reduced, onStage: setStage }), {
    dependencies: [reduced],
    revertOnUpdate: true,
  })

  return (
    <>
      <div className="stage-bg" aria-hidden="true" />
      <IntroStatement />
      <div className="canvas-wrap">
        <Suspense fallback={null}>
          <PortfolioCanvas paused={paused} focusOpen={focusOpen} />
        </Suspense>
      </div>
      <SceneLabels />
      {/* 스크롤 중 이력서가 서랍에서 올라왔을 때 읽을 수 있도록 나타나는 미리보기(장식 복제본이라 보조기기에서는 숨김) */}
      <div className="resume-peek" aria-hidden="true">
        <ResumeSheet peek />
      </div>
      <main>
        <SectionPanels />
      </main>
      <HeaderNav />
      <IntroTypography />
      <div id="scroll-track" aria-hidden="true" style={{ height: `${TIMELINE_LENGTH * SCROLL_VH_PER_UNIT}vh` }} />
    </>
  )
}

/** WebGL을 쓸 수 없을 때: 같은 정보와 동작을 문서형 화면으로 제공한다. */
function StaticExperience() {
  return (
    <div className="static">
      <HeaderNav onNavigate={(s) => document.getElementById(`s-${s === 'top' ? 'top' : s}`)?.scrollIntoView()} />
      <main>
        <section className="static__hero" id="s-top">
          <p className="eyebrow">
            {PROFILE.brand} — {PROFILE.meaning.toUpperCase()}
          </p>
          <h1 className="static__statement">
            Hi, I’m <em>{PROFILE.nameDisplay}</em>. I turn ideas into experiences. Welcome to my world.
          </h1>
          <p className="static__note">이 환경에서는 3D 화면을 표시할 수 없어 기본 화면으로 보여드립니다.</p>
        </section>
        {(['home', 'about', 'work', 'contact'] as const).map((s) => (
          <section key={s} id={`s-${s}`} className="static__section">
            <PanelContent section={s} />
          </section>
        ))}
      </main>
    </div>
  )
}

export default function App() {
  useReducedMotionSync()
  const webgl = useExperience((s) => s.webgl)
  const setWebgl = useExperience((s) => s.setWebgl)
  const setIntroDone = useExperience((s) => s.setIntroDone)
  const focusOpen = useExperience((s) => s.focus.type !== 'none')
  const { pathname } = useLocation()
  const detailOpen = pathname.startsWith('/work/')

  useEffect(() => {
    if (!hasWebGL()) setWebgl(false)
  }, [setWebgl])

  useEffect(() => {
    if (!webgl) setIntroDone(true)
  }, [webgl, setIntroDone])

  // Focus·상세가 열린 동안 배경 스크롤을 잠근다(스크롤 위치는 유지된다)
  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', focusOpen || detailOpen)
  }, [focusOpen, detailOpen])

  return (
    <>
      {webgl ? <Experience paused={detailOpen} focusOpen={focusOpen} /> : <StaticExperience />}
      <FocusLayer />
      <Routes>
        <Route path="/" element={null} />
        <Route
          path="/work/:slug"
          element={
            <Suspense fallback={null}>
              <ProjectDetail />
            </Suspense>
          }
        />
        <Route path="*" element={null} />
      </Routes>
    </>
  )
}

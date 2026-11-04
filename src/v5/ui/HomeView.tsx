import { useCallback, useEffect, useRef, useState } from 'react'
import { focusArrival, rememberOpener } from '../focus'
import { prefersReducedMotion } from '../prefs'
import { navigate, type Route } from '../router'
import { hasWebGL } from '../three/webgl'
import type { HomeMode, HomeScene } from '../home/HomeScene'
import { Panel } from './Panel'
import { CoverLetter } from './CoverLetter'
import { Resume } from './Resume'
import { HomeBackground } from './HomeBackground'
import { Loading } from './SceneStatus'

type Status = 'loading' | 'ready' | 'error' | 'nowebgl'

const MODES: { id: HomeMode; label: string; needs?: string }[] = [
  { id: 'composite', label: 'Home 시안' },
  { id: 'layout', label: '3D 배치' },
  { id: 'plan', label: '평면도', needs: '평면도 SVG(v5-home-floor-plan.svg)가 들어오면 열립니다' },
]

/**
 * Home · 책상
 * V6 배경 사진(HTML) 위에 투명 3D 캔버스(home/HomeScene.ts): 그림자만 받는 책상 윗면 + iMac.
 * iMac(또는 위에 붙은 '이력서 보기' 버튼) → iMac이 화면 앞으로(GSAP Timeline) → 이력서 패널.
 * 3D가 안 되거나 모델을 못 불러오면 사진 + 카드의 버튼으로 같은 내용에 도착한다.
 */
export function HomeView({ route }: { route: Route }) {
  const host = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HomeScene | null>(null)
  const busy = useRef(false)
  const [mode, setMode] = useState<HomeMode>('composite')
  const [status, setStatus] = useState<Status>(() => (hasWebGL() ? 'loading' : 'nowebgl'))
  const [progress, setProgress] = useState<number | null>(null)
  const panel = route.name === 'about' || route.name === 'resume' ? route.name : null

  /** 이력서: iMac이 앞으로 나온 뒤 패널. 3D가 없으면 바로 패널 */
  const openResume = useCallback((opener: Element | null) => {
    rememberOpener(opener)
    const s = sceneRef.current
    if (!s || busy.current) return navigate('#resume')
    busy.current = true
    s.focusImac(() => {
      busy.current = false
      navigate('#resume')
    })
  }, [])
  const imacBtn = useRef<HTMLButtonElement>(null)
  const pickRef = useRef(() => openResume(imacBtn.current))
  pickRef.current = () => openResume(imacBtn.current)

  // 장면은 Home에 들어올 때만 불러온다
  useEffect(() => {
    if (status === 'nowebgl') return
    let scene: HomeScene | null = null
    let cancelled = false
    import('../home/HomeScene')
      .then(({ HomeScene }) => {
        if (cancelled) return
        scene = new HomeScene(host.current!, {
          reducedMotion: prefersReducedMotion(),
          onProgress: setProgress,
          onPick: () => pickRef.current(),
        })
        sceneRef.current = scene
        return scene.ready
      })
      .then(() => !cancelled && setStatus('ready'))
      .catch((err) => {
        console.error('[Home] 3D 장면을 불러오지 못했습니다', err)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
      scene?.dispose()
      sceneRef.current = null
    }
  }, [status === 'nowebgl'])

  useEffect(() => sceneRef.current?.setMode(mode), [mode, status])

  // 패널이 닫혀 책상으로 돌아오면 iMac을 제자리로, 포커스는 열었던 버튼으로
  const prevPanel = useRef(panel)
  useEffect(() => {
    if (prevPanel.current && !panel) {
      sceneRef.current?.reset()
      focusArrival(document.querySelector('.v5-home') ?? document, true)
    }
    prevPanel.current = panel
  }, [panel])

  const close = () => navigate('#home')
  const ready = status === 'ready'

  return (
    <section className="v5-screen v5-home" aria-labelledby="home-title">
      <div className="v5-home-stage" data-mode={mode}>
        <HomeBackground />
        <div className="v5-home-canvas" ref={host} aria-hidden="true" />
      </div>

      {status === 'loading' && <Loading label="책상을 준비하는 중…" progress={progress} />}

      {ready && mode !== 'plan' && (
        <div className="v5-anchors">
          <button
            ref={(el) => {
              imacBtn.current = el
              sceneRef.current?.bindAnchor('imac', el)
            }}
            type="button"
            className="v5-anchor v5-anchor-label"
            onClick={(e) => openResume(e.currentTarget)}
          >
            이력서 보기
          </button>
        </div>
      )}

      <div className="v5-home-copy">
        <p className="v5-eyebrow">Home · 책상</p>
        <h1 id="home-title" tabIndex={-1} data-screen-title>
          책상 위에서 저를 소개할게요
        </h1>
        <div className="v5-home-actions">
          {!ready && (
            <button type="button" className="v5-btn v5-btn-primary" onClick={(e) => openResume(e.currentTarget)}>
              이력서 보기 <span className="v5-sub">iMac</span>
            </button>
          )}
          <button
            type="button"
            className="v5-btn"
            onClick={(e) => {
              rememberOpener(e.currentTarget)
              navigate('#about')
            }}
          >
            자기소개서 보기 <span className="v5-sub">서류더미</span>
          </button>
        </div>
        <ul className="v5-quicklinks" aria-label="바로가기">
          <li>
            <a href="#projects">프로젝트 목록 바로 보기 →</a>
          </li>
          <li>
            <a href="#message">메시지 바로 남기기 →</a>
          </li>
        </ul>
      </div>

      <div className="v5-home-modes" role="group" aria-label="Home 보기">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            disabled={!!m.needs || (m.id === 'layout' && !ready)}
            title={m.needs}
          >
            {m.label}
          </button>
        ))}
      </div>

      {panel === 'about' && (
        <Panel eyebrow="ABOUT" title="자기소개서" onClose={close}>
          <CoverLetter />
        </Panel>
      )}
      {panel === 'resume' && (
        <Panel eyebrow="RESUME" title="이력서" onClose={close}>
          <Resume />
        </Panel>
      )}
    </section>
  )
}

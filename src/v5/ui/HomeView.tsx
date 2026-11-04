import { useCallback, useEffect, useRef, useState } from 'react'
import { focusArrival, rememberOpener } from '../focus'
import { prefersReducedMotion } from '../prefs'
import { navigate, type Route } from '../router'
import { hasWebGL } from '../three/webgl'
import type { PropId } from '../home/config'
import type { HomeMode, HomeScene } from '../home/HomeScene'
import { Panel } from './Panel'
import { CoverLetter } from './CoverLetter'
import { Resume } from './Resume'
import { HomeBackground } from './HomeBackground'
import { Loading } from './SceneStatus'

type Status = 'loading' | 'ready' | 'error' | 'nowebgl'

/** 사물 위 라벨. 평소엔 보이지 않고 마우스를 올리거나 키보드로 포커스하면 나타난다 */
const LABELS: Record<PropId, (lampOn: boolean) => string> = {
  imac: () => '이력서 보기',
  papers: () => '자기소개서 보기',
  phone: () => '연락하기',
  lamp: (on) => (on ? '스탠드 끄기' : '스탠드 켜기'),
  mug: () => '커피',
  pen: () => '만년필',
}
const ORDER: PropId[] = ['imac', 'papers', 'phone', 'lamp', 'mug', 'pen']

/**
 * Home · 책상 (1번 시안: 사진 + 3D 사물, 글자는 메뉴·소리·©만)
 * iMac → 화면 앞으로 → 이력서 · 서류더미 → 맨 위 종이가 밀림 → 자기소개서 · 전화기 → Contact
 * 스탠드 켜기/끄기 · 머그·만년필은 짧게 반응. 3D가 안 되면 사진 위에 텍스트 버튼(대체 화면).
 * 확인용 보기: ?view=layout (3D 배치 — 사진 없이 책상 모델과 사물 배치)
 */
export function HomeView({ route }: { route: Route }) {
  const host = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HomeScene | null>(null)
  const busy = useRef(false)
  const btns = useRef(new Map<PropId, HTMLButtonElement>())
  const [mode] = useState<HomeMode>(() => (new URLSearchParams(location.search).get('view') === 'layout' ? 'layout' : 'composite'))
  const [status, setStatus] = useState<Status>(() => (hasWebGL() ? 'loading' : 'nowebgl'))
  const [progress, setProgress] = useState<number | null>(null)
  const [hovered, setHovered] = useState<PropId | null>(null)
  const [lampOn, setLampOn] = useState(false)
  const panel = route.name === 'about' || route.name === 'resume' ? route.name : null

  const activate = useCallback((id: PropId, opener: Element | null) => {
    const s = sceneRef.current
    const go = { imac: '#resume', papers: '#about', phone: '#contact' }[id as 'imac']
    if (go) rememberOpener(opener)
    if (!s) return go && navigate(go)
    if (busy.current) return
    busy.current = true
    s.activate(id, () => {
      busy.current = false
      if (id === 'lamp') setLampOn(s.isLampOn)
      if (go) navigate(go)
    })
  }, [])
  const pickRef = useRef(activate)
  pickRef.current = activate

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
          onHover: setHovered,
          onPick: (id) => pickRef.current(id, btns.current.get(id) ?? null),
        })
        sceneRef.current = scene
        scene.setMode(mode)
        btns.current.forEach((el, id) => scene!.bindAnchor(id, el))
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
  }, [status === 'nowebgl', mode])

  // 패널이 닫혀 책상으로 돌아오면 사물을 제자리로, 포커스는 열었던 버튼으로
  const prevPanel = useRef(panel)
  useEffect(() => {
    if (prevPanel.current && !panel) {
      sceneRef.current?.reset()
      focusArrival(document.querySelector('.v5-home') ?? document, true)
    }
    prevPanel.current = panel
  }, [panel])

  const close = () => navigate('#home')
  const fallback = status === 'error' || status === 'nowebgl'

  return (
    <section className="v5-screen v5-home" aria-labelledby="home-title" data-mode={mode}>
      <h1 id="home-title" className="v5-sr" tabIndex={-1} data-screen-title>
        Home · 책상
      </h1>
      <div className="v5-home-stage" data-mode={mode}>
        <HomeBackground />
        <div className="v5-home-canvas" ref={host} aria-hidden="true" />
      </div>

      {status === 'loading' && <Loading label="" progress={progress} />}

      {!fallback && (
        <div className="v5-anchors" role="group" aria-label="책상 위 사물">
          {ORDER.map((id) => (
            <button
              key={id}
              ref={(el) => {
                if (el) btns.current.set(id, el)
                else btns.current.delete(id)
                sceneRef.current?.bindAnchor(id, el)
              }}
              type="button"
              className="v5-anchor v5-anchor-label"
              data-hover={hovered === id}
              aria-pressed={id === 'lamp' ? lampOn : undefined}
              onClick={(e) => activate(id, e.currentTarget)}
            >
              {LABELS[id](lampOn)}
            </button>
          ))}
        </div>
      )}

      {fallback && (
        <nav className="v5-home-fallback" aria-label="책상 바로가기">
          <p className="v5-sr">3D 장면을 표시할 수 없어 텍스트 버튼으로 보여드려요.</p>
          <a className="v5-btn v5-btn-light" href="#resume" onClick={(e) => rememberOpener(e.currentTarget)}>
            이력서
          </a>
          <a className="v5-btn v5-btn-light" href="#about" onClick={(e) => rememberOpener(e.currentTarget)}>
            자기소개서
          </a>
          <a className="v5-btn v5-btn-light" href="#contact">
            연락하기
          </a>
        </nav>
      )}

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

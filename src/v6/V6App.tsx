import { useEffect, useRef, useState } from 'react'
import { applyThemeVars, PALETTES, THEME } from './theme'
import { CLEAN } from './three/cleanStyle'
import type { HomeScene, PickId } from './scene/HomeScene'
import './v6.css'

type Status = 'loading' | 'ready' | 'fallback'

const hasWebGL = () => {
  if (new URLSearchParams(location.search).has('nowebgl')) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** 호버 라벨 문구(HomeScene.PICKS와 같은 값 — 장면 코드를 기다리지 않고 바로 쓰려고 여기 둔다) */
const LABELS: Record<PickId, string> = {
  lamp: '스탠드 · 불 켜고 끄기',
  imac: '모니터 · 소개와 프로젝트',
  phone: '전화기 · 연락하기',
  card: '명함 · 소개',
  cabinet: '서랍 · 프로젝트',
  mug: '컵',
}

/**
 * V6 Home 책상(1단계). 3D는 scene/HomeScene.ts 한 장면, 글자는 HTML.
 * 1단계 범위: 마우스 둘러보기 · 스탠드 켜고 끄기 · 사물 호버 라벨. 메뉴·사물 클릭 이동은 2단계.
 * ?tune(개발 서버에서만): 선 기준(eThr) 슬라이더와 팔레트 버튼
 */
export default function V6App() {
  const host = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HomeScene | null>(null)
  const [status, setStatus] = useState<Status>(() => (hasWebGL() ? 'loading' : 'fallback'))
  const [hover, setHover] = useState<PickId | null>(null)
  const [moved, setMoved] = useState(false)
  const [lampOn, setLampOn] = useState(true)
  const [pal, setPal] = useState(0)
  const [edge, setEdge] = useState(CLEAN.edge.threshold)
  const tune = import.meta.env.DEV && new URLSearchParams(location.search).has('tune')

  useEffect(() => applyThemeVars(THEME), [])

  useEffect(() => {
    if (status === 'fallback') return
    let scene: HomeScene | null = null
    let cancelled = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    import('./scene/HomeScene')
      .then(({ HomeScene }) => {
        if (cancelled) return
        scene = new HomeScene(host.current!, { reducedMotion: reduced, onHover: setHover, onLamp: setLampOn })
        sceneRef.current = scene
        if (import.meta.env.DEV) (window as unknown as { __v6: HomeScene }).__v6 = scene // 개발용(테스트에서 사물 위치 확인)
        return scene.ready
      })
      .then(() => !cancelled && setStatus('ready'))
      .catch((err) => {
        console.error('[Home] 3D 장면을 불러오지 못했습니다', err)
        if (!cancelled) setStatus('fallback')
      })
    return () => {
      cancelled = true
      scene?.dispose()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 라벨은 커서를 따라간다(시험판: 커서 오른쪽 아래 14px)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      setMoved(true)
      if (label.current) label.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const choosePal = (i: number) => {
    setPal(i)
    const p = PALETTES[i]
    sceneRef.current?.setPalette(p)
    applyThemeVars(p)
  }

  return (
    <>
      <div className="v6-stage" ref={host} role="img" aria-label="두 가지 색으로 그린 책상 3D. 스탠드, 컴퓨터, 전화기, 명함, 컵, 서랍이 놓여 있어요." />
      {status === 'fallback' && <img className="v6-static" src="/images/home/desk-static.webp" alt="두 가지 색으로 그린 책상. 스탠드, 컴퓨터, 전화기, 명함, 컵, 서랍" />}

      <header className="v6-header">
        <div className="v6-logo">Vision INside</div>
        <nav aria-label="주 메뉴">
          <a className="on" href="#home" aria-current="page">HOME</a>
          <a href="#about">ABOUT</a>
          <a href="#work">WORK</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </header>

      <div className="v6-label" ref={label} aria-hidden="true" style={{ opacity: hover && moved ? 1 : 0 }}>
        {hover ? LABELS[hover] : ''}
      </div>
      <p className="v6-hint">마우스를 움직여 둘러보고, 사물을 눌러 보세요</p>

      {/* 키보드용: 평소엔 숨어 있다가 Tab으로 포커스하면 보인다 */}
      {status === 'ready' && (
        <div className="v6-keys" role="group" aria-label="책상 위 사물">
          <button type="button" aria-pressed={lampOn} onClick={() => sceneRef.current?.toggleLamp()}>
            스탠드 {lampOn ? '끄기' : '켜기'}
          </button>
          <button type="button" onClick={() => sceneRef.current?.activate('mug')}>
            컵
          </button>
        </div>
      )}

      {tune && (
        <>
          <div className="v6-tune">
            <label>
              선 eThr {edge.toFixed(2)}
              <input
                type="range"
                min={CLEAN.edge.min}
                max={CLEAN.edge.max}
                step={CLEAN.edge.step}
                value={edge}
                onChange={(e) => {
                  setEdge(+e.target.value)
                  sceneRef.current?.setEdge(+e.target.value)
                }}
              />
            </label>
          </div>
          <div className="v6-pal">
            {PALETTES.map((p, i) => (
              <button key={p.name} type="button" aria-label={p.name} title={p.name} aria-pressed={pal === i} onClick={() => choosePal(i)}>
                <i style={{ background: p.bg }} />
                <i style={{ background: p.light }} />
                <i style={{ background: p.dark }} />
              </button>
            ))}
          </div>
        </>
      )}

      {status === 'loading' && (
        <div className="v6-load" role="status">
          LOADING
        </div>
      )}
    </>
  )
}

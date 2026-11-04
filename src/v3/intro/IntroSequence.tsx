import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../animations/gsap'
import { INTRO_DEV_HUD, INTRO_LIGHT, INTRO_RULES, INTRO_SCROLL } from './introConfig'
import {
  buildSegments,
  c4Progress,
  clipsAt,
  drawCover,
  FrameLoader,
  frameUrl,
  loadManifest,
  pickVariant,
  pointAt,
  totalLength,
  typeProgress,
  type IntroManifest,
  type Variant,
} from './sequence'
import KineticType, { type KineticTypeHandle } from './KineticType'
import { light } from './LightOverlay'
import { waitSceneReady } from './visit'

const TRIGGER_ID = 'v3-intro'

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

interface Props {
  /** 끝까지 스크롤해서 빛이 가장 밝아졌을 때 */
  onFinish: () => void
  /** Skip을 눌렀을 때 */
  onSkip: () => void
}

/**
 * INTRO(S01~S03): 화면을 고정하고 스크롤에 맞춰 이미지 시퀀스를 canvas에 그린다.
 * c4 끝부분에서 창문 쪽 빛이 번지며 밝아지고, 끝까지 내리면 onFinish.
 */
export default function IntroSequence({ onFinish, onSkip }: Props) {
  const [manifest, setManifest] = useState<IntroManifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [variant, setVariant] = useState<Variant>(pickVariant)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadManifest().then(setManifest, (e: Error) => setError(e.message))
  }, [])

  // 화면을 돌려 세로/가로가 바뀌면 그에 맞는 시퀀스로 바꾼다
  useEffect(() => {
    const onResize = () => setVariant(pickVariant())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (error) {
    return (
      <div className="v3-intro-error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={onSkip}>
          HOME으로 가기
        </button>
      </div>
    )
  }
  if (!manifest) return <div className="v3-intro-stage" />
  return <Player key={variant} manifest={manifest} variant={variant} onFinish={onFinish} onSkip={onSkip} />
}

function Player({
  manifest,
  variant,
  onFinish,
  onSkip,
}: Props & { manifest: IntroManifest; variant: Variant }) {
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const type = useRef<KineticTypeHandle>(null)
  const finishRef = useRef(onFinish)
  useEffect(() => {
    finishRef.current = onFinish
  }, [onFinish])
  const [skipping, setSkipping] = useState(false)
  const skippingRef = useRef(false)

  useGSAP(
    () => {
      const segs = buildSegments(manifest)
      const proxy = { p: 0 }
      let drawn: HTMLImageElement | null = null
      let finished = false
      const ctx = canvas.current!.getContext('2d')!

      const render = () => {
        const p = proxy.p
        const pt = pointAt(segs, p)
        const img = loader.nearest(pt.frame)
        if (img && img !== drawn) {
          drawCover(ctx, img)
          drawn = img
        }
        type.current?.update(typeProgress(segs, p))
        if (hint.current) hint.current.style.opacity = String(1 - smooth(0, 0.02, p))
        if (!skippingRef.current) light.set(smooth(INTRO_LIGHT.rampStart, 1, c4Progress(segs, p)))
        if (hud.current) {
          const exact = loader.images[pt.frame] ? '' : ' (불러오는 중)'
          hud.current.textContent =
            `frame ${pt.frame}/${manifest.total}${exact} · ${pt.segment === 'hold' ? 'hold' : clipsAt(manifest, pt.frame)}` +
            ` · ${(p * 100).toFixed(1)}% · ${variant} ${loader.loadedCount}/${manifest.total}`
        }
        if (!finished && p >= 0.999 && !skippingRef.current) {
          finished = true
          finishRef.current()
        }
      }

      const loader = new FrameLoader(manifest, variant, () => {
        // 지금 보여줘야 할 프레임이 막 도착했으면 다시 그린다
        if (loader.nearest(pointAt(segs, proxy.p).frame) !== drawn) render()
        else if (hud.current && INTRO_DEV_HUD) render()
      })

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const c = canvas.current!
        c.width = Math.round(window.innerWidth * dpr)
        c.height = Math.round(window.innerHeight * dpr)
        drawn = null
        render()
      }
      resize()
      window.addEventListener('resize', resize)

      const scroll = () => totalLength(segs) * window.innerHeight
      // 개발 모드의 이중 마운트 등으로 남은 이전 트리거가 있으면 먼저 지운다(스크롤 길이가 두 배가 되지 않게)
      ScrollTrigger.getById(TRIGGER_ID)?.kill(true)
      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
          id: TRIGGER_ID,
          trigger: stage.current,
          start: 'top top',
          end: () => `+=${scroll()}`,
          pin: true,
          scrub: INTRO_SCROLL.scrub || true,
          invalidateOnRefresh: true,
        },
      })
      ScrollTrigger.refresh()

      return () => {
        loader.cancel()
        window.removeEventListener('resize', resize)
      }
    },
    { dependencies: [manifest, variant] },
  )

  const skip = () => {
    if (skippingRef.current) return
    skippingRef.current = true
    setSkipping(true)
    onSkip()
  }

  return (
    <div ref={stage} className="v3-intro-stage">
      <canvas ref={canvas} className="v3-intro-canvas" aria-label="작업 중인 디자이너를 지나 책상으로 다가가는 인트로 영상" role="img" />
      <KineticType ref={type} mobile={variant === 'mobile'} />
      <div ref={hint} className="v3-scroll-hint" aria-hidden="true">
        Scroll
      </div>
      {!skipping && (
        <button
          type="button"
          className="v3-skip"
          style={{ animationDelay: `${INTRO_RULES.skipDelaySec}s` }}
          onClick={skip}
        >
          Skip
        </button>
      )}
      {INTRO_DEV_HUD && <div ref={hud} className="v3-intro-hud" />}
    </div>
  )
}

/**
 * 움직임 줄이기: 시퀀스 대신 마지막 장면 정지 이미지를 3D 위에 덮어 두었다가,
 * 잠시 뒤(3D가 준비되면) 페이드로 걷어 낸다.
 */
export function IntroStill({ onDone }: { onDone: () => void }) {
  const [src, setSrc] = useState<string | null>(null)
  const [fading, setFading] = useState(false)
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    let alive = true
    const timers: number[] = []
    const wait = (sec: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, sec * 1000)))
    loadManifest()
      .then((m) => alive && setSrc(frameUrl(m, pickVariant(), m.total)))
      .catch(() => {})
    Promise.all([wait(INTRO_RULES.reducedStillSec), waitSceneReady(INTRO_LIGHT.maxWaitSec)])
      .then(() => {
        if (!alive) return
        setFading(true)
        return wait(INTRO_RULES.reducedFadeSec)
      })
      .then(() => alive && doneRef.current())
    return () => {
      alive = false
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div
      className={`v3-intro-still${fading ? ' is-fading' : ''}`}
      style={{ transitionDuration: `${INTRO_RULES.reducedFadeSec}s` }}
      aria-hidden="true"
    >
      {src && <img src={src} alt="" />}
    </div>
  )
}

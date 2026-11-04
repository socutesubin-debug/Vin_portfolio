import { useEffect, useRef, type CSSProperties } from 'react'
import { gsap } from '../../animations/gsap'
import { INTRO_LIGHT } from './introConfig'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/**
 * HOME 전환 빛. 0 = 없음, 1 = 가장 밝음(화면이 하얗게 덮임).
 * INTRO가 스크롤로 올리고, V3App이 3D 장면이 준비되면 시간으로 걷어 낸다.
 * 인트로 → 3D로 바뀌는 동안에도 남아 있어야 하므로 V3App에 하나만 둔다.
 */
class LightController {
  level = 0
  private el: HTMLElement | null = null
  private tween: gsap.core.Tween | null = null

  attach(el: HTMLElement | null) {
    this.el = el
    this.paint()
  }

  /** 잠그면 set()을 무시한다(인트로가 내려가는 동안 스크롤이 빛을 덮어쓰지 않게) */
  locked = false

  set(level: number) {
    if (this.locked) return
    this.force(level)
  }

  /** 잠금과 상관없이 바로 바꾼다 */
  force(level: number) {
    this.tween?.kill()
    this.tween = null
    this.level = clamp01(level)
    this.paint()
  }

  /** 시간으로 level을 옮긴다 */
  animate(to: number, seconds: number, ease = 'power2.inOut') {
    this.tween?.kill()
    return new Promise<void>((resolve) => {
      this.tween = gsap.to(this, {
        level: to,
        duration: seconds,
        ease,
        onUpdate: () => this.paint(),
        onComplete: () => {
          this.tween = null
          resolve()
        },
      })
    })
  }

  private paint() {
    const el = this.el
    if (!el) return
    const t = this.level
    const L = INTRO_LIGHT
    // 창문 쪽 빛 번짐 → 화면 전체가 밝아짐 → 블룸
    el.style.visibility = t > 0.001 ? 'visible' : 'hidden'
    el.style.setProperty('--light-glow', String(smooth(0, 0.55, t)))
    el.style.setProperty('--light-spread', `${(25 + 150 * smooth(0, 0.9, t)).toFixed(1)}%`)
    el.style.setProperty('--light-wash', String(smooth(0.45, 1, t) * L.peak))
    el.style.setProperty('--light-bloom', `${(smooth(0.2, 0.9, t) * L.bloom).toFixed(1)}px`)
    el.style.setProperty('--light-bright', String(1 + 0.35 * smooth(0.1, 0.8, t)))
  }
}

export const light = new LightController()

export default function LightOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    light.attach(ref.current)
    return () => light.attach(null)
  }, [])

  const L = INTRO_LIGHT
  return (
    <div
      ref={ref}
      className="v3-light"
      aria-hidden="true"
      style={
        {
          '--light-x': `${L.origin.x}%`,
          '--light-y': `${L.origin.y}%`,
          '--light-core': L.core,
          '--light-warm': L.warm,
          '--light-wash-color': L.wash,
        } as CSSProperties
      }
    >
      <div className="v3-light-bloom" />
      <div className="v3-light-glow" />
      <div className="v3-light-wash" />
    </div>
  )
}

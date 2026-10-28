import { gsap } from './gsap'

// Intro 문장의 잉크 번짐 효과.
// - scroll: 마스터 타임라인이 넘겨주는 값. 1 = 종이에 스며든 번진 상태 → 0 = 선명한 인쇄 상태
// - boost : 처음 등장할 때만 더해지는 추가 번짐(자동 재생). 2.x → 1로 가라앉는다
// 번짐 강도 = scroll × boost. 0이 되면 필터를 꺼서 가장 또렷하게 만든다.
// 번진 상태에서는 노이즈 주파수가 천천히 움직여 잉크가 일렁이는 느낌을 준다.
// 필터 구성은 scenes/Intro/InkBleedFilter.tsx 참고.

export const INK_FILTER_ID = 'vin-ink-bleed'

// 글자 크기 100px 기준 최대값(강도 1일 때). 실제 값은 글자 크기에 비례시킨다.
const MAX = {
  displace: 9, // 가장자리 유기적 왜곡(px)
  core: 2.6, // 잉크가 스민 흐림(px)
  halo: 10, // 주변으로 퍼진 옅은 잉크(px)
  haloAlpha: 0.45,
  density: 0.6, // 잉크 농도 차이
}

const state = { scroll: 1, boost: 1, wobble: true }

let els: {
  text: HTMLElement
  turb: Element
  disp: Element
  core: Element
  halo: Element
  haloA: Element
  density: Element
} | null = null

let wobbleTween: gsap.core.Tween | null = null

function lookup() {
  if (els?.text.isConnected) return els
  const text = document.querySelector<HTMLElement>('.intro-statement p')
  const get = (id: string) => document.getElementById(id)
  const turb = get('ink-turb')
  const disp = get('ink-disp')
  const core = get('ink-core')
  const halo = get('ink-halo')
  const haloA = get('ink-halo-a')
  const density = get('ink-density')
  els = text && turb && disp && core && halo && haloA && density ? { text, turb, disp, core, halo, haloA, density } : null
  if (els) wobbleTween = null // 새 요소로 교체되었으면 다시 만든다
  return els
}

function setWobble(on: boolean) {
  const e = els
  if (!e) return
  if (on && state.wobble) {
    wobbleTween ??= gsap.fromTo(
      e.turb,
      { attr: { baseFrequency: '0.038 0.034' } },
      { attr: { baseFrequency: '0.060 0.050' }, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 },
    )
    wobbleTween.play()
  } else {
    wobbleTween?.pause()
  }
}

function render() {
  const e = lookup()
  if (!e) return
  const v = state.scroll * state.boost
  if (state.scroll <= 0.002) {
    // 스크롤로 완전히 선명해지면 필터를 끈다(가장 또렷하고 렌더 비용도 없다)
    e.text.style.filter = 'none'
    setWobble(false)
    return
  }
  const k = parseFloat(getComputedStyle(e.text).fontSize) / 100
  e.disp.setAttribute('scale', (MAX.displace * k * v).toFixed(2))
  e.core.setAttribute('stdDeviation', (MAX.core * k * v).toFixed(2))
  e.halo.setAttribute('stdDeviation', (MAX.halo * k * v).toFixed(2))
  e.haloA.setAttribute('slope', Math.min(0.9, MAX.haloAlpha * v).toFixed(3))
  e.density.setAttribute('k1', Math.min(0.9, MAX.density * v).toFixed(3))
  e.density.setAttribute('k2', (1 - Math.min(0.9, MAX.density * 0.5 * v)).toFixed(3))
  e.text.style.filter = `url(#${INK_FILTER_ID})`
  setWobble(true)
}

/** 스크롤 진행에 따른 번짐(1 → 0) */
export function setInkScroll(v: number) {
  state.scroll = v
  render()
}

/** 최초 등장 시 추가 번짐(2.x → 1) */
export function setInkBoost(b: number) {
  state.boost = b
  render()
}

/** 모션 축소 환경에서는 일렁임을 끈다 */
export function setInkWobble(on: boolean) {
  state.wobble = on
  if (!on) wobbleTween?.pause()
}

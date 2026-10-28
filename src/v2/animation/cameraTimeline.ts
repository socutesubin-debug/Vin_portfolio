import { gsap, ScrollTrigger } from '../../animations/gsap'
import { SCENE_ORDER, SCENES, SCROLL, type SceneId, type Vec3 } from '../config/scenes'

const TRIGGER_ID = 'v2-camera'
export const SCROLL_TRACK_ID = 'v2-scroll-track'

const xyz = ([x, y, z]: Vec3) => ({ x, y, z })

/** GSAP가 쓰고 CameraRig가 매 프레임 읽는 카메라 값(React 상태 아님) */
export const camState = {
  position: xyz(SCENES.home.position),
  target: xyz(SCENES.home.target),
}

const { hold, travel } = SCROLL
const last = SCENE_ORDER.length - 1

/** 전체 타임라인 길이: 장면마다 머무는 구간 + 장면 사이 이동 구간 */
export const TIMELINE_LENGTH = SCENE_ORDER.length * hold + last * travel

/** i번째 장면에 도착하는 시점 */
const arriveAt = (i: number) => i * (hold + travel)

/** 메뉴로 이동할 때의 기준 시점: 첫 장면은 맨 위, 마지막 장면은 맨 아래, 나머지는 머무는 구간 가운데 */
const anchorOf = (i: number) => (i === 0 ? 0 : i === last ? TIMELINE_LENGTH : arriveAt(i) + hold / 2)

/** 타임라인 시점에서 가장 가까운 장면 */
function sceneAt(time: number): SceneId {
  const i = Math.round((time - hold / 2) / (hold + travel))
  return SCENE_ORDER[Math.min(last, Math.max(0, i))]
}

interface Options {
  reduced: boolean
  onScene: (id: SceneId) => void
}

/**
 * 스크롤 위치에 따라 카메라 위치와 target을 함께 보간하는 타임라인.
 * 둘을 같은 시점·같은 easing으로 움직여 시선이 튀지 않게 한다.
 */
export function buildCameraTimeline({ reduced, onScene }: Options) {
  let current: SceneId | null = null
  const report = (progress: number) => {
    const id = sceneAt(progress * TIMELINE_LENGTH)
    if (id !== current) onScene((current = id))
  }

  const tl = gsap.timeline({
    // immediateRender: false — 각 구간이 만들어질 때 시작값을 바로 적용하지 않게 한다(안 그러면 첫 화면이 마지막 구간 시작값이 된다)
    defaults: { ease: SCROLL.ease, duration: travel, immediateRender: false },
    scrollTrigger: {
      id: TRIGGER_ID,
      trigger: `#${SCROLL_TRACK_ID}`,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reduced ? true : SCROLL.scrub,
      onUpdate: (self) => report(self.progress),
      onRefresh: (self) => report(self.progress),
    },
  })

  for (let i = 1; i <= last; i++) {
    const from = SCENES[SCENE_ORDER[i - 1]]
    const to = SCENES[SCENE_ORDER[i]]
    const at = arriveAt(i) - travel
    tl.fromTo(camState.position, xyz(from.position), xyz(to.position), at)
    tl.fromTo(camState.target, xyz(from.target), xyz(to.target), at)
  }
  // 마지막 장면에 머무는 구간까지 타임라인을 늘린다
  tl.set({}, {}, TIMELINE_LENGTH)

  return tl
}

/** 상단 메뉴: 해당 장면 위치로 부드럽게 스크롤한다 */
export function scrollToScene(id: SceneId) {
  const st = ScrollTrigger.getById(TRIGGER_ID)
  if (!st) return
  const t = anchorOf(SCENE_ORDER.indexOf(id)) / TIMELINE_LENGTH
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: st.start + (st.end - st.start) * t, behavior: reduced ? 'auto' : 'smooth' })
}

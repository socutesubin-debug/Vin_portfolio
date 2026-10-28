import { gsap, type ScrollTrigger } from './gsap'
import { rig } from './rig'
import { setInkScroll } from './inkBleed'
import {
  CAMERA,
  INTRO,
  INTRO_SPAN,
  NAV_ANCHORS,
  TIMELINE_LENGTH,
  stageAt,
  type CameraPreset,
  type NavSection,
  type Stage,
} from './stages'

let master: ScrollTrigger | null = null

/**
 * 스크롤 전체를 하나의 타임라인으로 묶는다.
 * - 카메라·서랍·기본 오브제 값(rig)과 섹션 텍스트 패널만 다룬다. Hover/Focus는 관여하지 않는다.
 * - scrub이므로 진행률은 항상 절대값이며 역스크롤 시 같은 경로로 되돌아간다.
 * - 서랍 구간은 서로 겹치지 않는다(닫힘이 끝난 뒤 다음 서랍이 열린다).
 */
export function buildMasterTimeline(opts: { reduced: boolean; onStage: (s: Stage) => void }) {
  const { reduced, onStage } = opts
  // Reduced motion: 보간 없이 구간 끝에서 상태가 바뀐다(순간 전환).
  const ease = reduced ? 'steps(1)' : 'power2.inOut'

  const tl = gsap.timeline({
    defaults: { ease },
    scrollTrigger: {
      trigger: '#scroll-track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: reduced ? true : 0.8,
      onUpdate: (self) => onStage(stageAt(self.progress * TIMELINE_LENGTH)),
      onRefresh: (self) => onStage(stageAt(self.progress * TIMELINE_LENGTH)),
    },
  })
  master = tl.scrollTrigger ?? null

  const cam = (p: CameraPreset, at: number, duration: number, e?: string) => {
    const [x, y, z] = p.pos
    const [tx, ty, tz] = p.target
    const ease_ = reduced ? ease : (e ?? ease)
    tl.to(rig.cam, { x, y, z, duration, ease: ease_ }, at)
    tl.to(rig.target, { x: tx, y: ty, z: tz, duration, ease: ease_ }, at)
  }
  const panelIn = (sel: string, at: number) =>
    tl.fromTo(sel, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 3, ease: reduced ? ease : 'power2.out' }, at)
  const panelOut = (sel: string, at: number) =>
    tl.to(sel, { autoAlpha: 0, y: -28, duration: 2, ease: reduced ? ease : 'power2.in' }, at)

  // 01 Intro (스크롤 구간 0 ~ INTRO_SPAN): 번진 잉크 → 선명한 타이포 → 서랍장 상승. 카메라는 정면 고정.
  const ip = (r: number) => r * INTRO_SPAN
  const ink = { v: 1 }
  if (reduced) {
    setInkScroll(0) // 모션 축소: 번짐 없이 처음부터 선명하게
  } else {
    // 등장(번진 잉크가 일렁이며 나타남)은 자동 재생(IntroStatement). 스크롤은 선명화만 맡는다.
    setInkScroll(1)
    tl.fromTo(
      ink,
      { v: 1 },
      { v: 0, duration: ip(INTRO.inkEnd - INTRO.inkStart), ease: 'power1.inOut', onUpdate: () => setInkScroll(ink.v) },
      ip(INTRO.inkStart),
    )
  }
  // 서랍장 전체가 하나의 Entrance 그룹으로 상승(서랍 개폐 Transform과 분리)
  tl.fromTo(
    rig,
    { rise: 0 },
    { rise: 1, duration: ip(INTRO.riseEnd - INTRO.riseStart), ease: reduced ? ease : 'power1.inOut' },
    ip(INTRO.riseStart),
  )

  // 이하 기존 구간은 Intro 길이(o)만큼 뒤에서 시작한다
  const o = INTRO_SPAN

  // 01 Intro → 02 Home: 정면 → 상승 원근 → 상판 Top View (하나의 연속 경로)
  tl.to('.intro-statement', { autoAlpha: 0, y: -60, duration: 5, ease: reduced ? ease : 'power1.in' }, o + 3)
  cam(CAMERA.rise, o + 4, 7, 'power1.in')
  cam(CAMERA.top, o + 11, 8, 'power1.out')
  tl.to(rig, { shift: 1, duration: 15 }, o + 4)
  tl.to('.stage-bg', { backgroundColor: '#ECECEA', duration: 10 }, o + 8)
  panelIn('.panel-home', o + 17)

  // 03 Card Focus (스크롤 프리뷰): 명함 쪽으로 다가갔다가 복귀
  cam(CAMERA.cardPreview, o + 25, 4)
  cam(CAMERA.top, o + 30, 4)

  // 04 About: 첫째 서랍 열기
  panelOut('.panel-home', o + 33)
  cam(CAMERA.about, o + 34, 6)
  tl.to(rig, { about: 1, duration: 6 }, o + 36)
  panelIn('.panel-about', o + 41)

  // 05 이력서: 서랍에서 올라와 크게 보이고(HTML 이력서가 겹쳐 나타남) → 다시 서랍으로 들어간다
  tl.to(rig, { resume: 1, duration: 4, ease: reduced ? ease : 'power2.out' }, o + 43)
  tl.fromTo('.resume-peek', { autoAlpha: 0 }, { autoAlpha: 1, duration: 2, ease: reduced ? ease : 'power1.out' }, o + 46)
  tl.to('.resume-peek', { autoAlpha: 0, duration: 2, ease: reduced ? ease : 'power1.in' }, o + 50)
  tl.to(rig, { resume: 0, duration: 3.5, ease: reduced ? ease : 'power2.in' }, o + 51)

  // 06 Work: 이력서가 들어간 뒤 첫째 서랍이 닫히고 둘째 열기. 파일이 하나씩 서랍 밖으로 올라온다
  panelOut('.panel-about', o + 54)
  tl.to(rig, { about: 0, duration: 4 }, o + 55)
  cam(CAMERA.work, o + 55, 6)
  tl.to(rig, { work: 1, duration: 5 }, o + 59)
  panelIn('.panel-work', o + 63)
  tl.fromTo(rig, { fileHi: -0.6 }, { fileHi: 2.6, duration: 15, ease: 'none', immediateRender: false }, o + 65)

  // 08 Contact: 둘째 닫힘 → 셋째 열기 → 명함 재등장
  panelOut('.panel-work', o + 81)
  tl.to(rig, { work: 0, duration: 4 }, o + 82)
  cam(CAMERA.contact, o + 82, 7)
  tl.to(rig, { contact: 1, duration: 5 }, o + 86)
  panelIn('.panel-contact', o + 90)
  tl.to(rig, { contactCard: 1, duration: 4 }, o + 93)

  // 타임라인 길이 고정
  tl.set({}, {}, TIMELINE_LENGTH)
  return tl
}

export function scrollTopFor(section: NavSection) {
  if (!master) return 0
  return master.start + (master.end - master.start) * (NAV_ANCHORS[section] / TIMELINE_LENGTH)
}

export function scrollToSection(section: NavSection, smooth = true) {
  window.scrollTo({ top: scrollTopFor(section), behavior: smooth ? 'smooth' : 'auto' })
}

export function scrollToTop(smooth = true) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
}

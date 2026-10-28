import { create } from 'zustand'
import type { Stage } from '../animations/stages'
import type { ProjectSlug } from '../data/projects'

export type Focus =
  | { type: 'none' }
  | { type: 'card'; context: 'home' | 'contact' }
  | { type: 'resume' }
  | { type: 'project'; slug: ProjectSlug }
  | { type: 'call' }

/** Contact 전화 상태: idle(서랍 닫힘) → ringing → pickingUp → connected → hangingUp → ringing */
export type CallState = 'idle' | 'ringing' | 'pickingUp' | 'connected' | 'hangingUp'

export type Origin = { x: number; y: number } | null

type State = {
  stage: Stage
  focus: Focus
  origin: Origin
  hovered: string | null
  modelReady: boolean
  introDone: boolean
  introRun: number
  reducedMotion: boolean
  webgl: boolean
  call: CallState
  setCall: (c: CallState) => void
  setStage: (s: Stage) => void
  openFocus: (f: Exclude<Focus, { type: 'none' }>, origin?: Origin, opener?: Element | null) => void
  setProject: (slug: ProjectSlug) => void
  closeFocus: () => void
  setHovered: (id: string | null) => void
  setModelReady: () => void
  setIntroDone: (v: boolean) => void
  replayIntro: () => void
  setReducedMotion: (v: boolean) => void
  setWebgl: (v: boolean) => void
}

// 오버레이를 닫은 뒤 키보드 포커스를 되돌릴 요소 (DOM 참조라 상태에 넣지 않는다)
let returnTarget: Element | null = null

export const useExperience = create<State>((set) => ({
  stage: 'intro',
  focus: { type: 'none' },
  origin: null,
  hovered: null,
  modelReady: false,
  introDone: false,
  introRun: 0,
  reducedMotion: false,
  webgl: true,
  call: 'idle',
  setCall: (call) => set((s) => (s.call === call ? s : { call })),
  setStage: (stage) => set((s) => (s.stage === stage ? s : { stage })),
  openFocus: (focus, origin = null, opener) => {
    returnTarget = opener ?? (document.activeElement !== document.body ? document.activeElement : null)
    set({ focus, origin, hovered: null })
  },
  setProject: (slug) => set({ focus: { type: 'project', slug } }),
  closeFocus: () => {
    // 통화 화면을 닫는 모든 경로(HANG UP·Escape·배경 클릭·내비게이션)에서 수화기가 내려가게 한다
    set((s) => ({ focus: { type: 'none' }, origin: null, call: s.focus.type === 'call' ? 'hangingUp' : s.call }))
    const el = returnTarget
    returnTarget = null
    if (el instanceof HTMLElement && el.isConnected) requestAnimationFrame(() => el.focus({ preventScroll: true }))
  },
  setHovered: (hovered) => set((s) => (s.hovered === hovered ? s : { hovered })),
  setModelReady: () => set({ modelReady: true }),
  setIntroDone: (introDone) => set({ introDone }),
  replayIntro: () => set((s) => ({ introDone: false, introRun: s.introRun + 1 })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setWebgl: (webgl) => set({ webgl }),
}))

// 개발 중 브라우저 검증용
if (import.meta.env.DEV) Object.assign(window, { __vin: useExperience })

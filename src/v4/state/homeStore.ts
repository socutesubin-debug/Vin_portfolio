import { create } from 'zustand'
import { LAMP_LIGHT } from '../config/home'
import type { HotspotId } from '../config/hotspots'

/**
 * HOME 상태.
 * ABOUT: HOME_IDLE → OBJECT_HOVER → CAMERA_TRANSITION → ABOUT_OPEN → RETURN_HOME → HOME_IDLE
 * WORK:  HOME_IDLE → WORK_TRANSITION(카메라가 서랍장 앞으로 내려감) → WORK_OPENING(첫 서랍이 열리고 카메라가 안을 내려다봄)
 *        → WORK_FILES(파일이 보임) → WORK_LIST(프로젝트 목록) → (WORK_FILES) → RETURN_HOME
 * 전환 중(…TRANSITION, WORK_OPENING, RETURN_HOME)에는 호버·클릭을 받지 않아 카메라가 겹쳐 움직이지 않는다.
 */
export type HomeMode =
  | 'HOME_IDLE'
  | 'OBJECT_HOVER'
  | 'CAMERA_TRANSITION'
  | 'ABOUT_OPEN'
  | 'WORK_TRANSITION'
  | 'WORK_OPENING'
  | 'WORK_FILES'
  | 'WORK_LIST'
  | 'RETURN_HOME'

interface HomeState {
  mode: HomeMode
  hovered: HotspotId | null
  lampOn: boolean
  soundOn: boolean
  setHover: (id: HotspotId | null) => void
  /** 오브제 동작 실행(클릭·탭·HTML 버튼 공통) */
  activate: (id: HotspotId) => void
  openAbout: () => void
  closeAbout: () => void
  /** 서랍장으로 내려가 첫 서랍을 연다 */
  openWork: () => void
  /** 서랍 속 파일 → 프로젝트 목록 */
  showProjects: () => void
  /** 프로젝트 목록 → 서랍 속 파일 */
  backToFiles: () => void
  /** ABOUT·WORK 어디서든 HOME 구도로 */
  goHome: () => void
  /** 카메라 리그가 전환을 끝냈을 때 부른다 */
  transitionDone: () => void
  toggleLamp: () => void
  setSoundOn: (on: boolean) => void
}

/** HOME 구도에서 오브제를 다룰 수 있는 상태 */
export const isHomeInteractive = (mode: HomeMode) => mode === 'HOME_IDLE' || mode === 'OBJECT_HOVER'
/** 카메라가 움직이는 중이라 입력을 받지 않는 상태 */
export const isTransition = (mode: HomeMode) =>
  mode === 'CAMERA_TRANSITION' || mode === 'WORK_TRANSITION' || mode === 'WORK_OPENING' || mode === 'RETURN_HOME'
/** WORK(서랍장) 쪽 상태 */
export const isWork = (mode: HomeMode) => mode.startsWith('WORK_')
/** 첫 서랍이 열려 있어야 하는 상태 */
export const isDrawerOpen = (mode: HomeMode) => mode === 'WORK_OPENING' || mode === 'WORK_FILES' || mode === 'WORK_LIST'

/** 자리를 잡고 머무는 장면(여기서 다른 장면으로 갈 수 있다) */
const settled = (mode: HomeMode) => isHomeInteractive(mode) || mode === 'ABOUT_OPEN' || mode === 'WORK_FILES' || mode === 'WORK_LIST'

export const useHome = create<HomeState>((set, get) => ({
  mode: 'HOME_IDLE',
  hovered: null,
  lampOn: LAMP_LIGHT.startOn,
  soundOn: false,

  setHover: (id) =>
    set((s) => {
      if (isHomeInteractive(s.mode)) return { hovered: id, mode: id ? 'OBJECT_HOVER' : 'HOME_IDLE' }
      if (s.mode === 'WORK_FILES') return { hovered: id }
      return {}
    }),

  activate: (id) => {
    if (id === 'crt') get().openAbout()
    else if (id === 'lamp') get().toggleLamp()
    else if (id === 'files') get().showProjects()
  },

  openAbout: () => set((s) => (settled(s.mode) && s.mode !== 'ABOUT_OPEN' ? { mode: 'CAMERA_TRANSITION', hovered: null } : {})),

  closeAbout: () => set((s) => (s.mode === 'ABOUT_OPEN' ? { mode: 'RETURN_HOME' } : {})),

  openWork: () => set((s) => (settled(s.mode) && !isWork(s.mode) ? { mode: 'WORK_TRANSITION', hovered: null } : {})),

  showProjects: () => set((s) => (s.mode === 'WORK_FILES' ? { mode: 'WORK_LIST', hovered: null } : {})),

  backToFiles: () => set((s) => (s.mode === 'WORK_LIST' ? { mode: 'WORK_FILES' } : {})),

  goHome: () => set((s) => (settled(s.mode) && !isHomeInteractive(s.mode) ? { mode: 'RETURN_HOME', hovered: null } : {})),

  transitionDone: () =>
    set((s) => {
      if (s.mode === 'CAMERA_TRANSITION') return { mode: 'ABOUT_OPEN' }
      if (s.mode === 'WORK_TRANSITION') return { mode: 'WORK_OPENING' }
      if (s.mode === 'WORK_OPENING') return { mode: 'WORK_FILES' }
      if (s.mode === 'RETURN_HOME') return { mode: 'HOME_IDLE' }
      return {}
    }),

  toggleLamp: () => set((s) => (isHomeInteractive(s.mode) ? { lampOn: !s.lampOn } : {})),

  setSoundOn: (soundOn) => set({ soundOn }),
}))

import { create } from 'zustand'
import type { SceneId } from '../config/scenes'
import { DEFAULT_CABINET_FINISH, type CabinetFinish } from '../config/cabinet'
import { loadEasterEgg, saveEasterEgg } from './easterEgg'

/** 사운드 켜짐은 브라우저에 기억한다(기본 꺼짐) */
const SOUND_KEY = 'vin-v2-sound'
function loadSound() {
  try {
    return window.localStorage.getItem(SOUND_KEY) === 'on'
  } catch {
    return false
  }
}
function saveSound(on: boolean) {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    // 저장이 막혀 있으면 이번 방문 동안만
  }
}

/** 울림 시각 기준(초) */
export const nowSec = () => performance.now() / 1000

/** 서랍에서 뽑힌 카드. origin은 카드가 뽑혀 올라간 화면 위치(px) — 폴더가 여기서 날아오고 여기로 돌아간다 */
export interface Pulled {
  id: string
  origin: { x: number; y: number }
}

interface WorkspaceState {
  activeScene: SceneId
  /** 열린 서랍 번호(위에서 0부터). 한 번에 하나만 열린다 */
  openDrawer: number | null
  /** 서랍에서 뽑혀 폴더 미리보기로 떠 있는 카드 */
  pulled: Pulled | null
  /** 폴더가 서랍으로 돌아가는 중 */
  pullClosing: boolean
  /** 전체 보기 그리드 */
  gridOpen: boolean
  /** 2D 상세가 열린 프로젝트 id */
  openProject: string | null
  /** 서랍장 마감(공간 시안 비교용) */
  cabinetFinish: CabinetFinish
  /** 이스터에그: 숨은 열쇠를 주웠는지 */
  hasKey: boolean
  /** 이스터에그: 열쇠로 연 서랍 id(다시 와도 유지) */
  unlocked: string[]
  /** 화면 위쪽에 잠깐 뜨는 안내 문구 */
  toast: { text: string; at: number } | null
  /** CONTACT: 전화가 울리기 시작한 시각(nowSec). CONTACT에 들어올 때마다 새로 정한다 */
  ringAt: number | null
  /** CONTACT: 받거나 입력을 시작해서 울림을 멈췄는지 */
  ringSilenced: boolean
  /** CONTACT: 수화기를 들고 메시지 카드를 연 상태 */
  callOpen: boolean
  /** CONTACT: 마우스를 올린 위치("전화 받기" 안내용) */
  phoneHover: { x: number; y: number } | null
  /** 사운드 켜짐(벨소리 등) */
  soundOn: boolean
  setActiveScene: (id: SceneId) => void
  setOpenDrawer: (i: number | null) => void
  pull: (p: Pulled) => void
  /** 폴더를 서랍으로 돌려보내기 시작(애니메이션은 FolderPreview가 하고 끝나면 finishUnpull) */
  requestUnpull: () => void
  finishUnpull: () => void
  setGridOpen: (open: boolean) => void
  setOpenProject: (id: string | null) => void
  setCabinetFinish: (f: CabinetFinish) => void
  takeKey: () => void
  unlockDrawer: (id: string) => void
  /** 개발용: 열쇠·열린 서랍 초기화 */
  resetEasterEgg: () => void
  showToast: (text: string) => void
  answerCall: () => void
  hangUp: () => void
  silenceRing: () => void
  setPhoneHover: (p: { x: number; y: number } | null) => void
  setSoundOn: (on: boolean) => void
}

/** 주소 뒤 ?cabinet=silver|charcoal 로 시작 마감을 고를 수 있다 */
function initialFinish(): CabinetFinish {
  const q = new URLSearchParams(window.location.search).get('cabinet')
  return q === 'silver' || q === 'charcoal' ? q : DEFAULT_CABINET_FINISH
}

export const useWorkspace = create<WorkspaceState>((set) => ({
  activeScene: 'home',
  openDrawer: null,
  pulled: null,
  pullClosing: false,
  gridOpen: false,
  openProject: null,
  cabinetFinish: initialFinish(),
  ...loadEasterEgg(),
  toast: null,
  ringAt: null,
  ringSilenced: false,
  callOpen: false,
  phoneHover: null,
  soundOn: loadSound(),
  // WORK를 벗어나면 열린 서랍은 닫고, CONTACT에 들어오면 전화가 울리기 시작한다(벗어나면 통화를 끊는다)
  setActiveScene: (activeScene) =>
    set((s) => {
      if (activeScene === s.activeScene) return {}
      const toContact = activeScene === 'contact'
      return {
        activeScene,
        openDrawer: activeScene === 'work' ? s.openDrawer : null,
        ringAt: toContact ? nowSec() : null,
        ringSilenced: false,
        callOpen: toContact ? s.callOpen : false,
        phoneHover: null,
      }
    }),
  setOpenDrawer: (openDrawer) => set({ openDrawer }),
  pull: (pulled) => set({ pulled, pullClosing: false }),
  requestUnpull: () => set((s) => (s.pulled ? { pullClosing: true } : {})),
  finishUnpull: () => set({ pulled: null, pullClosing: false }),
  setGridOpen: (gridOpen) => set({ gridOpen }),
  setOpenProject: (openProject) => set({ openProject }),
  setCabinetFinish: (cabinetFinish) => set({ cabinetFinish }),
  takeKey: () =>
    set((s) => {
      saveEasterEgg({ hasKey: true, unlocked: s.unlocked })
      return { hasKey: true, toast: { text: '열쇠를 찾았어요. 잠긴 서랍을 열 수 있을지도 몰라요', at: Date.now() } }
    }),
  unlockDrawer: (id) =>
    set((s) => {
      if (s.unlocked.includes(id)) return {}
      const unlocked = [...s.unlocked, id]
      saveEasterEgg({ hasKey: s.hasKey, unlocked })
      return { unlocked }
    }),
  resetEasterEgg: () => {
    saveEasterEgg({ hasKey: false, unlocked: [] })
    set({ hasKey: false, unlocked: [], openDrawer: null })
  },
  showToast: (text) => set({ toast: { text, at: Date.now() } }),
  answerCall: () => set({ callOpen: true, ringSilenced: true, phoneHover: null }),
  hangUp: () => set({ callOpen: false }),
  silenceRing: () => set({ ringSilenced: true }),
  setPhoneHover: (phoneHover) => set({ phoneHover }),
  setSoundOn: (soundOn) => {
    saveSound(soundOn)
    set({ soundOn })
  },
}))

/** 2D 화면(폴더·그리드·상세·메시지 카드)이 하나라도 떠 있으면 3D 서랍 조작을 막는다 */
export const overlayOpen = (s: WorkspaceState) => !!(s.pulled || s.gridOpen || s.openProject || s.callOpen)

// 개발 중 브라우저 검증용
if (import.meta.env.DEV) Object.assign(window, { __v2: useWorkspace })

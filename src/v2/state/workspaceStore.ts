import { create } from 'zustand'
import type { SceneId } from '../config/scenes'

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
  setActiveScene: (id: SceneId) => void
  setOpenDrawer: (i: number | null) => void
  pull: (p: Pulled) => void
  /** 폴더를 서랍으로 돌려보내기 시작(애니메이션은 FolderPreview가 하고 끝나면 finishUnpull) */
  requestUnpull: () => void
  finishUnpull: () => void
  setGridOpen: (open: boolean) => void
  setOpenProject: (id: string | null) => void
}

export const useWorkspace = create<WorkspaceState>((set) => ({
  activeScene: 'home',
  openDrawer: null,
  pulled: null,
  pullClosing: false,
  gridOpen: false,
  openProject: null,
  // WORK를 벗어나면 열린 서랍은 닫는다
  setActiveScene: (activeScene) =>
    set((s) => ({ activeScene, openDrawer: activeScene === 'work' ? s.openDrawer : null })),
  setOpenDrawer: (openDrawer) => set({ openDrawer }),
  pull: (pulled) => set({ pulled, pullClosing: false }),
  requestUnpull: () => set((s) => (s.pulled ? { pullClosing: true } : {})),
  finishUnpull: () => set({ pulled: null, pullClosing: false }),
  setGridOpen: (gridOpen) => set({ gridOpen }),
  setOpenProject: (openProject) => set({ openProject }),
}))

/** 2D 화면(폴더·그리드·상세)이 하나라도 떠 있으면 3D 서랍 조작을 막는다 */
export const overlayOpen = (s: WorkspaceState) => !!(s.pulled || s.gridOpen || s.openProject)

// 개발 중 브라우저 검증용
if (import.meta.env.DEV) Object.assign(window, { __v2: useWorkspace })

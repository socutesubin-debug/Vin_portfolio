import { create } from 'zustand'
import type { SceneId } from '../config/scenes'

interface WorkspaceState {
  activeScene: SceneId
  setActiveScene: (id: SceneId) => void
}

export const useWorkspace = create<WorkspaceState>((set) => ({
  activeScene: 'home',
  setActiveScene: (activeScene) => set({ activeScene }),
}))

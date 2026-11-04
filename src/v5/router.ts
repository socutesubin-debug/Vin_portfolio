import { useSyncExternalStore } from 'react'

/**
 * 주소 해시 ↔ 화면. 뒤로 가기는 hashchange로 그대로 따라간다.
 *
 * #home · #about(자기소개서) · #resume(이력서)   → Home 장면
 * #work                                          → Work 수납장
 * #projects · #project-<id>                      → 프로젝트 목록·상세
 * #contact · #message                            → Contact 전화기(·메시지 양식)
 */
export type RouteName = 'home' | 'about' | 'resume' | 'work' | 'projects' | 'project' | 'contact' | 'message'
export type SceneName = 'home' | 'work' | 'projects' | 'contact'

export interface Route {
  name: RouteName
  /** #project-<id>의 id */
  id?: string
}

const SCENE_OF: Record<RouteName, SceneName> = {
  home: 'home',
  about: 'home',
  resume: 'home',
  work: 'work',
  projects: 'projects',
  project: 'projects',
  contact: 'contact',
  message: 'contact',
}

export const sceneOf = (r: Route) => SCENE_OF[r.name]

export function parseHash(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#/, ''))
  if (h.startsWith('project-') && h.length > 'project-'.length) return { name: 'project', id: h.slice('project-'.length) }
  if (h in SCENE_OF && h !== 'project') return { name: h as RouteName }
  return { name: 'home' }
}

export const hrefOf = (r: Route) => (r.name === 'project' ? `#project-${r.id}` : `#${r.name}`)

export function navigate(href: string) {
  if (location.hash === href) return
  location.hash = href
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const getHash = () => location.hash

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash)
  return parseHash(hash)
}

/**
 * VIN 색 — 이 파일 한 곳에서만 관리한다.
 * 3D 일러스트 스타일(cleanStyle.ts)과 HTML(CSS 변수 --dark --mid --light --bg --ink)이 같은 값을 쓴다.
 */
export interface CleanPalette {
  name: string
  /** 선·그림자 */
  dark: string
  /** 중간톤 */
  mid: string
  /** 밝은 면 */
  light: string
  /** 배경(3D 빈 곳과 페이지 배경이 같다) */
  bg: string
  /** 배경 위 글자색(머리글·안내) */
  ink: string
}

export const PALETTES: readonly CleanPalette[] = [
  { name: '청보라', dark: '#0f0f18', mid: '#cfd0ee', light: '#ffffff', bg: '#5b4fee', ink: '#ffffff' },
  { name: '크림', dark: '#0e0e12', mid: '#ece3dc', light: '#ffffff', bg: '#f6ece6', ink: '#0e0e12' },
]

/** 기본 팔레트(청보라) */
export const THEME: CleanPalette = PALETTES[0]

/** HTML 쪽 색을 CSS 변수로 맞춘다 */
export function applyThemeVars(p: CleanPalette = THEME) {
  const s = document.documentElement.style
  s.setProperty('--dark', p.dark)
  s.setProperty('--mid', p.mid)
  s.setProperty('--light', p.light)
  s.setProperty('--bg', p.bg)
  s.setProperty('--ink', p.ink)
}

/**
 * VIN 색 — 이 파일 한 곳에서만 관리한다. 3D 듀오톤(진한 색·연한 색)과 HTML(CSS 변수 --dark, --light)이 같은 값을 쓴다.
 */
export const THEME = {
  /** 진한 색: 그림자·배경·외곽선 */
  dark: '#1f4bd0',
  /** 연한 색: 밝은 면·라벨 바탕 */
  light: '#e9e4d8',
  /** 진한 색 버튼을 누를 때(호버) */
  darkHover: '#1639a8',
} as const

/** 시험판의 팔레트 후보(?tune 화면에서만 바꿔 볼 수 있다). 기본은 THEME */
export const PALETTES = [
  { name: '코발트', dark: THEME.dark, light: THEME.light },
  { name: '올리브', dark: '#55613f', light: '#ece6d6' },
  { name: '버건디', dark: '#6e1f2b', light: '#efe6d8' },
  { name: '차콜', dark: '#2a2a2a', light: '#efeae0' },
] as const

/** HTML 쪽 색을 CSS 변수로 맞춘다 */
export function applyThemeVars(dark: string = THEME.dark, light: string = THEME.light) {
  const s = document.documentElement.style
  s.setProperty('--dark', dark)
  s.setProperty('--light', light)
}

/**
 * 노트북 화면 위에 겹치는 HTML(ABOUT 이력서). ui/AboutPanel이 요소를 등록하고,
 * Canvas 안 Laptop이 매 프레임 화면 네 모서리를 화면 좌표로 옮겨 이 요소의 위치·크기를 맞춘다(React 렌더 없이).
 */
export const screenOverlay: { el: HTMLElement | null } = { el: null }

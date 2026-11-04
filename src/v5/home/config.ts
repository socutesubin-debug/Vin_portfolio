/**
 * Home 배경(V6) 설정. 원본: output/visuals/v5-home-desk-background-v6 (확장자 없는 PNG, 1672×941)
 * → public/images/home/v5-home-desk-background-v6.png(복사본) · .webp(화면용, 118kB)
 *
 * 구도: 정면 빈 책상(화면 아래 약 30%) · 뒤 원목 선반·화분·책 · 왼쪽 격자 창(빛이 왼쪽에서 들어와 그림자가 오른쪽 아래로) ·
 * 오른쪽 끝 회색 철제 수납장 일부.
 */
export const HOME_BG = {
  webp: '/images/home/v5-home-desk-background-v6.webp',
  png: '/images/home/v5-home-desk-background-v6.png',
  width: 1672,
  height: 941,
  /** 화면이 사진보다 좁거나 낮을 때 남길 기준점(0–1). 데스크톱·세로 화면 */
  focus: {
    wide: { x: 0.5, y: 0.5 },
    // 세로 화면: 책상 가운데와 선반 위 책이 함께 보이도록 살짝 왼쪽
    tall: { x: 0.46, y: 0.5 },
  },
  /** 사진 속 책상 앞 모서리·뒤 모서리의 세로 위치(사진 높이 비율). 3D 책상 윗면을 맞출 때 쓴다 */
  deskFrontY: 0.97,
  deskBackY: 0.705,
}

export interface CoverRect {
  /** 화면 기준 사진의 왼쪽 위(px) — 음수면 잘려 나간 부분 */
  x: number
  y: number
  width: number
  height: number
  scale: number
}

/**
 * object-fit: cover와 같은 배치를 직접 계산한다. 3D 카메라(2단계)도 같은 값을 써서 사진과 원근을 맞춘다.
 */
export function coverRect(viewW: number, viewH: number, focus = viewW / viewH < 0.8 ? HOME_BG.focus.tall : HOME_BG.focus.wide): CoverRect {
  const scale = Math.max(viewW / HOME_BG.width, viewH / HOME_BG.height)
  const width = HOME_BG.width * scale
  const height = HOME_BG.height * scale
  // 기준점이 화면 같은 비율 위치에 오도록 하되, 사진 밖(빈 곳)이 보이지 않게 자른다
  const x = Math.min(0, Math.max(viewW - width, viewW * focus.x - width * focus.x))
  const y = Math.min(0, Math.max(viewH - height, viewH * focus.y - height * focus.y))
  return { x, y, width, height, scale }
}

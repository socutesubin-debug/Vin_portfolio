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

/**
 * 사진과 맞춘 카메라(2단계). 사진은 정면·수평(기울기 0)으로 찍은 것으로 보고,
 * 사진 속 책상 뒤 모서리(deskBackY)와 앞 모서리(deskFrontY)가 3D 책상 윗면(y = 0)의 뒤(z = 0)·앞(z = deskDepth)에
 * 오도록 카메라 높이와 거리를 거꾸로 계산한다. 화각·깊이만 바꾸면 나머지가 따라온다.
 */
export const HOME_CAMERA = {
  /** 사진 전체 세로 화각(도) — 사진 비율 1672:941 기준 */
  vfov: 38,
  /** 사진 속 책상 깊이(m). 클수록 카메라가 멀어지고 사물이 작게 보인다 */
  deskDepth: 0.95,
}

export function photoCamera() {
  const t = Math.tan((HOME_CAMERA.vfov * Math.PI) / 360)
  // 수평 카메라: 화면 가운데(0.5)가 눈높이. 아래로 내려간 비율 → 내려다보는 각도의 tan
  const tb = (HOME_BG.deskBackY - 0.5) * 2 * t
  const tf = (HOME_BG.deskFrontY - 0.5) * 2 * t
  const height = HOME_CAMERA.deskDepth / (1 / tb - 1 / tf)
  const backDist = height / tb
  return { height, z: backDist, fov: HOME_CAMERA.vfov, aspect: HOME_BG.width / HOME_BG.height }
}

/** 빛: 사진의 왼쪽 창에서 들어오는 햇빛(벽 그림자가 왼쪽 위 → 오른쪽 아래) */
export const HOME_LIGHT = {
  sun: { color: '#fff0da', intensity: 2.6, position: [-2.4, 2.1, 1.4] as const },
  sky: { color: '#fbf6ee', ground: '#cdbfa9', intensity: 1.0 },
  /** 사진 위에 떨어지는 그림자 진하기(ShadowMaterial) */
  shadowOpacity: 0.26,
  contactOpacity: 0.38,
}

/** iMac 배치(책상 좌표: x 가운데 0, z 0 = 벽쪽 뒤 모서리, 앞으로 +). 세로 화면은 화면 폭이 좁아 가운데로 */
export const IMAC = {
  url: '/models/home/imac.obj',
  /** OBJ는 Z가 위, 단위가 커서(폭 6.5) 실제 24인치 폭 0.547m로 줄인다 */
  rotX: -Math.PI / 2,
  scale: 0.547 / 6.5,
  wide: { x: 0.2, z: 0.3, rotY: -0.14, scale: 1 },
  // 세로 화면은 사진 가운데 약 26%만 보여 실제 크기면 화면을 꽉 채운다 → 뒤로 물리고 줄인다(작은 화면처럼)
  tall: { x: -0.05, z: 0.12, rotY: -0.06, scale: 0.62 },
  /** 선택하면 화면 앞으로(데스크톱은 왼쪽 패널 옆, 세로 화면은 위쪽). ndc = 화면 위치, dist = 카메라에서 거리(m) */
  focus: { wide: { ndcX: -0.42, ndcY: -0.05, dist: 0.95 }, tall: { ndcX: 0, ndcY: 0.45, dist: 1.25 }, duration: 0.8 },
}

export const TABLE = { url: '/models/home/table.obj', height: 0.75 }

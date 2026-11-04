/**
 * Home 설정 — 1번 시안: 블라인드 벽 + 흰 책상 정면, 글자는 메뉴·소리·©만.
 * 배경 원본: output/visuals/v5-home-desk-background-v6.png (1432×713) → public/images/home/ PNG 복사본·WebP(58kB)
 */
export const HOME_BG = {
  webp: '/images/home/v5-home-desk-background-v6.webp',
  png: '/images/home/v5-home-desk-background-v6.png',
  width: 1432,
  height: 713,
  /** 사진 속 책상 뒤 모서리(블라인드와 만나는 선)·앞 모서리의 세로 위치(사진 높이 비율) */
  deskBackY: 0.813,
  deskFrontY: 0.972,
}

export interface CoverRect {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

/**
 * 구도(V4 HOME처럼): 사진의 아래쪽을 확대해 책상이 화면 아래 약 1/4–1/3, 블라인드 벽이 위를 채운다.
 * shownHeight = 화면 세로에 담을 사진 높이 비율(작을수록 확대), centerY = 화면 가운데에 올 사진 세로 위치.
 * margin = 포인터 카메라가 움직여도 사진 밖이 드러나지 않게 남기는 가장자리(사진 비율).
 */
export const HOME_VIEW = {
  wide: { shownHeight: 0.66, centerX: 0.5, centerY: 0.62 },
  tall: { shownHeight: 1, centerX: 0.5, centerY: 0.5 },
  margin: 0.035,
}

/**
 * 화면에 사진을 놓는 영역(px). HTML 배경(로딩·대체 화면)과 3D 카메라(setViewOffset)가 같은 값을 쓴다.
 * 사진 밖이 보이지 않도록 margin 안쪽으로 자른다.
 */
export function coverRect(viewW: number, viewH: number): CoverRect {
  const v = viewW / viewH < 0.8 ? HOME_VIEW.tall : HOME_VIEW.wide
  const W = HOME_BG.width
  const H = HOME_BG.height
  const m = HOME_VIEW.margin
  // 원하는 확대 → 화면 폭·높이가 사진(가장자리 제외) 안에 들어가도록 최소 배율 보정
  let scale = viewH / (H * v.shownHeight)
  scale = Math.max(scale, viewW / (W * (1 - 2 * m)), viewH / (H * (1 - 2 * m)))
  const width = W * scale
  const height = H * scale
  const clamp = (val: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, val))
  const x = clamp(viewW / 2 - v.centerX * width, viewW - width * (1 - m), -width * m)
  const y = clamp(viewH / 2 - v.centerY * height, viewH - height * (1 - m), -height * m)
  return { x, y, width, height, scale }
}

/**
 * 포인터 카메라(V4 POINTER_CAMERA와 같은 값): 포인터 위치(-1~1)만큼 카메라는 많이, 주시점은 조금 옮긴다.
 * 사진을 벽·책상 면에 투사해 두었기 때문에 앞(책상)·사물·뒤(블라인드)가 서로 다르게 밀린다.
 * 마우스·펜만(터치 기기 끔), 움직임 줄이기에서는 고정.
 */
export const HOME_POINTER = {
  position: { x: 0.1, y: 0.04 },
  target: { x: 0.02, y: 0.01 },
  damping: 2.6,
  returnDamping: 1.6,
}

/**
 * 사진과 맞춘 카메라: 정면·수평 카메라로 보고, 사진 속 책상 뒤·앞 모서리가 3D 책상 윗면(y = 0)의
 * 뒤(z = 0)·앞(z = deskDepth)에 오도록 높이·거리를 거꾸로 계산한다.
 */
export const HOME_CAMERA = { vfov: 34, deskDepth: 1.05 }

export function photoCamera() {
  const t = Math.tan((HOME_CAMERA.vfov * Math.PI) / 360)
  const tb = (HOME_BG.deskBackY - 0.5) * 2 * t
  const tf = (HOME_BG.deskFrontY - 0.5) * 2 * t
  const height = HOME_CAMERA.deskDepth / (1 / tb - 1 / tf)
  return { height, z: height / tb, fov: HOME_CAMERA.vfov, aspect: HOME_BG.width / HOME_BG.height }
}

/** 빛: 사진처럼 왼쪽에서 들어오는 햇빛(책상 왼쪽 앞 빛 무늬) + 밝은 회색 실내 */
export const HOME_LIGHT = {
  sun: { color: '#fff6ea', intensity: 2.4, position: [-2.6, 2.4, 1.6] as const },
  sky: { color: '#f4f5f7', ground: '#c9c9c6', intensity: 1.15 },
  shadowOpacity: 0.22,
  contactOpacity: 0.32,
}

export type PropId = 'imac' | 'papers' | 'lamp' | 'mug' | 'pen' | 'phone'

export interface Placement {
  x: number
  z: number
  rotY: number
  /** 세로 화면 등에서 줄일 때(1 = 실제 크기) */
  scale?: number
  /** 이 화면에서 숨김 */
  hidden?: boolean
}

/**
 * 소품(책상 좌표: x 가운데 0, z 0 = 뒤 모서리, 앞으로 +, 단위 m).
 * wide = 가로 화면, tall = 세로 화면(사진 가운데 약 25%만 보여 iMac·서류더미를 앞쪽에 둔다).
 * 모델에는 재질 파일(.mtl)이 없어 HomeScene의 임시 재질을 쓴다.
 */
export const PROPS: Record<PropId, { url?: string; scale?: number; fit?: number; rot?: [number, number, number]; wide: Placement; tall: Placement }> = {
  // iMac Pro(3ds Max, mm 단위 → 0.001). 패널 폭 약 65cm, 키보드·마우스·선 포함
  imac: { url: '/models/home/imac.obj', scale: 0.001, wide: { x: 0.1, z: 0.16, rotY: -0.06 }, tall: { x: 0.0, z: 0.12, rotY: 0, scale: 0.85 } },
  // 서류더미(모델 없음 — 종이 도형)
  papers: { wide: { x: -0.3, z: 0.42, rotY: 0.18 }, tall: { x: -0.1, z: 0.62, rotY: 0.12, scale: 0.9 } },
  // 스탠드(m 단위, 갓이 +x) — 왼쪽 끝에서 책상 가운데를 비춘다. 웹용 사본(면 30%)
  lamp: { url: '/models/home/web/lamp-web.obj', scale: 1, wide: { x: -0.6, z: 0.14, rotY: -0.25 }, tall: { x: -0.6, z: 0.1, rotY: 0, hidden: true } },
  // 머그(사진 컷아웃)
  mug: { wide: { x: -0.47, z: 0.44, rotY: 0 }, tall: { x: 0.17, z: 0.6, rotY: 0, scale: 1 } },
  // 만년필(111MB 원본 → 면 1.5% 웹용 사본). 길이 14cm로 맞춰 눕힌다
  pen: { url: '/models/home/web/pen-web.obj', fit: 0.14, rot: [0, 0, Math.PI / 2], wide: { x: 0.4, z: 0.5, rotY: 0.5 }, tall: { x: 0.12, z: 0.55, rotY: 0.4, hidden: true } },
  // 탁상 전화기(cm 단위 → 0.01). 웹용 사본(면 35%) → Contact로
  phone: { url: '/models/home/web/phone-web.obj', scale: 0.01, wide: { x: 0.56, z: 0.32, rotY: -0.3 }, tall: { x: 0.3, z: 0.3, rotY: 0, hidden: true } },
}

/** 선택했을 때 iMac이 나오는 위치(화면 ndc · 카메라에서 거리 m) */
export const IMAC_FOCUS = { wide: { ndcX: -0.4, ndcY: -0.1, dist: 1.05 }, tall: { ndcX: 0, ndcY: 0.35, dist: 1.3 }, duration: 0.8 }

export const MUG = { webp: '/images/home/vin-mug.webp', png: '/images/home/vin-mug.png', height: 0.095, imageTop: 0.18, imageBottom: 0.86 }

export const TABLE = { url: '/models/home/table.obj', height: 0.75 }

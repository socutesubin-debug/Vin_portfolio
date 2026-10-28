// 스크롤 타임라인의 구간·카메라 프리셋·서랍 상수.
// 타임라인 = Intro 구간(INTRO_SPAN) + 기존 Home~Contact 구간(100). 실제 체감은 테스트 후 조정한다.

export type Stage =
  | 'intro'
  | 'home'
  | 'cardFocus'
  | 'about'
  | 'resumeFocus'
  | 'work'
  | 'projectPreview'
  | 'contact'

export type NavSection = 'home' | 'about' | 'work' | 'contact'

// Intro 스크롤 구간(타임라인 단위). 그 뒤의 기존 구간은 이 길이만큼 뒤로 밀린다.
export const INTRO_SPAN = 14
export const TIMELINE_LENGTH = 100 + INTRO_SPAN
// 스크롤 트랙 높이: 타임라인 1단위 = 11vh (기존 100단위 = 1100vh 체감 유지)
export const SCROLL_VH_PER_UNIT = 11

/**
 * Intro 구간 내부 상대 진행률(0~1).
 * 0–15% 빈 화면에서 번진 타이포 등장 → 15–40% 잉크 선명화 → 40–75% 서랍장 상승(정중앙에서 문장을 가림) → 75–100% 유지
 */
export const INTRO = {
  inkStart: 0.15,
  inkEnd: 0.4,
  riseStart: 0.4,
  riseEnd: 0.75,
  // 서랍장이 화면 아래(뷰포트 밖)에서 시작하도록 내려 두는 거리(월드 단위)
  riseDistance: 3.2,
}

// [stage, 시작 위치]
const STAGE_STARTS: [Stage, number][] = [
  ['intro', 0],
  ['home', INTRO_SPAN + 12],
  ['cardFocus', INTRO_SPAN + 25],
  ['about', INTRO_SPAN + 34],
  ['resumeFocus', INTRO_SPAN + 47],
  ['work', INTRO_SPAN + 55],
  ['projectPreview', INTRO_SPAN + 72],
  ['contact', INTRO_SPAN + 82],
]

export function stageAt(t: number): Stage {
  let s: Stage = 'intro'
  for (const [stage, start] of STAGE_STARTS) if (t >= start) s = stage
  return s
}

export function sectionOf(stage: Stage): NavSection | null {
  switch (stage) {
    case 'home':
    case 'cardFocus':
      return 'home'
    case 'about':
    case 'resumeFocus':
      return 'about'
    case 'work':
    case 'projectPreview':
      return 'work'
    case 'contact':
      return 'contact'
    default:
      return null
  }
}

// 상단 메뉴가 이동할 타임라인 위치(각 구간이 안정적으로 보이는 지점)
export const NAV_ANCHORS: Record<NavSection, number> = {
  home: INTRO_SPAN + 21,
  about: INTRO_SPAN + 45,
  work: INTRO_SPAN + 68,
  contact: INTRO_SPAN + 97,
}

export const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'home', label: 'HOME' },
  { id: 'about', label: 'ABOUT' },
  { id: 'work', label: 'WORK' },
  { id: 'contact', label: 'CONTACT' },
]

type V3 = [number, number, number]
export type CameraPreset = { pos: V3; target: V3 }

// 모델 실측: 폭 1.36, 높이 1.9(상판 y≈1.9), 깊이 z −0.53~0.48, 정면 +Z.
// 카메라 위치와 주시점을 함께 보간한다. 정수직(Top) 대신 z를 살짝 앞으로 두어 lookAt 뒤집힘을 피한다.
export const CAMERA = {
  // Intro 정면: 서랍장 중심(y≈0.95)이 화면 정중앙에 오는 정면 구도
  front: { pos: [0, 0.95, 6.4], target: [0, 0.95, 0] },
  rise: { pos: [0, 3.6, 4.3], target: [0, 1.5, 0.05] },
  top: { pos: [0, 5.1, 0.5], target: [0, 1.9, -0.04] },
  cardPreview: { pos: [0, 3.9, 0.45], target: [0, 1.9, 0.02] },
  // 서랍 장면: 거의 수직으로 내려다보고(z 오프셋 최소), 서랍이 화면을 크게 채우도록 가까이 둔다
  about: { pos: [0, 4.05, 1.17], target: [0, 1.58, 0.94] },
  work: { pos: [0, 3.85, 1.27], target: [0, 1.1, 0.96] },
  contact: { pos: [0, 3.95, 1.32], target: [0, 0.55, 0.96] },
} satisfies Record<string, CameraPreset>

// 세로 화면에서도 서랍장 폭이 잘리지 않도록 확보할 가로 폭(월드 단위)
export const REQUIRED_VIEW_WIDTH = 1.75

// ---- 서랍장 (public/models/cabinet_v3.glb) ----
// GLB 실측: 폭 1.35, 높이 1.894(상판 y≈1.9), 깊이 z −0.71~0.62, 정면 +Z.
// 서랍은 앞판만 있는 독립 노드이며(drawer1 = 맨 아래), 안쪽 상자는 코드로 덧붙인다.
export const TABLETOP_Y = 1.9

// 서랍: 닫힘 = 0, 열림 = 1. 모델 로컬 +Z 방향으로 openDistance만큼 이동한다.
export const DRAWER = {
  openDistance: 0.87,
  trayDepth: 0.95,
  trayWidth: 1.12,
  frontInnerZ: 0.58,
  wall: 0.018,
}

// GLB 노드와 역할 매핑. 위에서부터 01 About · 02 Work · 03 Contact. y = 서랍 앞판의 세로 범위
export const DRAWERS = {
  about: { node: 'drawer3' as const, y: [1.352, 1.84] as const },
  work: { node: 'drawer2' as const, y: [0.82, 1.324] as const },
  contact: { node: 'drawer1' as const, y: [0.28, 0.79] as const },
}
export type DrawerKey = keyof typeof DRAWERS

/**
 * V4 HOME(3D 인터랙티브 작업실) 설정. 연출은 이 파일의 숫자만 바꿔서 조정한다.
 * 단위는 미터, 바닥이 y=0, 뒷벽 쪽이 -z, 방문자 쪽이 +z, 창문 쪽이 -x (V2 layout.ts와 같은 좌표).
 * 배치 기준 docs/v4-refs/home-layout.png, HOME 구도 home-composition.png
 * WORK 기준(서랍장 정면·서랍 속 칸막이 파일·프로젝트 목록)은 대화로 받은 이미지라 파일로 남기지 못했다 — docs/v4-plan.md에 설명
 * 재질·조명·입체감 기준: docs/v3-refs/ref-home-mood.png (가구·디자인은 따르지 않는다)
 */
import type { Vec3 } from '../../v2/config/scenes'
import { DESK, ROOM } from '../../v2/config/layout'
import { LIGHTING, type LightingPreset } from '../../v2/config/lighting'

export interface Shot {
  position: Vec3
  target: Vec3
  /** 가로 화면 기준 세로 화각(도). 없으면 기본 40도. 좁을수록 망원(원근 왜곡이 적다) */
  fov?: number
}

/**
 * HOME 구도(docs/v4-refs/home-composition.png): 책상 높이 조금 위 눈높이에서 뒷벽을 정면으로.
 * 화면 아래 약 1/3이 책상 윗면(앞 끝이 화면 아래 끝), 위 2/3가 벽. 책상은 화면 양옆 밖까지 이어진다.
 */
export const HOME_SHOT: Shot = { position: [-0.1, 1.04, 0.85], target: [-0.1, 0.95, -1.0], fov: 30 }
/** 세로 화면(모바일): 같은 정면에서 물러나 책상 위 사물이 다 들어오게 */
export const HOME_SHOT_PORTRAIT: Shot = { position: [-0.1, 1.0, 1.25], target: [-0.1, 0.84, -1.0] }

/**
 * 포인터 카메라. 포인터 위치(-1~1)만큼 카메라와 주시점을 옮긴다.
 * 카메라는 많이, 주시점은 조금만 움직여서 앞(책상 앞 끝)·중간(사물)·뒤(벽)가 서로 다르게 밀린다(실제 시차).
 * 범위가 작아야 방 가장자리(측면 벽 끝·천장 없는 윗부분)가 드러나지 않는다.
 */
export const POINTER_CAMERA = {
  /** 카메라 이동 범위(좌우, 위아래) */
  position: { x: 0.1, y: 0.04 },
  /** 주시점 이동 범위 — 카메라와 같은 방향으로 조금만 */
  target: { x: 0.02, y: 0.01 },
  /** 따라오는 빠르기(클수록 빠름, 초당 감쇠 계수). 프레임 속도와 무관 */
  damping: 2.6,
  /** 포인터가 화면 밖으로 나가 기본 구도로 돌아갈 때의 빠르기 */
  returnDamping: 1.6,
  /** 움직임 줄이기 설정에서의 범위 배율(0이면 고정) */
  reducedScale: 0,
  /** ABOUT·WORK(가까운 구도)에서의 범위: 사물과 벽 사이 시차만 살짝 보이게 */
  about: { position: { x: 0.05, y: 0.025 }, target: { x: 0.01, y: 0.006 } },
}

/**
 * 노트북 접근(ABOUT): 카메라가 노트북 화면을 정면(화면 법선 방향)에서 마주 본다 — 화면에 이력서 HTML을 겹친다.
 * 화면 가운데 ≈ [-0.1, 0.878, -0.844], 덮개가 0.28rad 젖혀져 법선은 (0, 0.276, 0.961). 거리 0.6m
 */
export const ABOUT_SHOT: Shot = { position: [-0.1, 1.044, -0.267], target: [-0.1, 0.878, -0.844], fov: 30 }
/** 세로 화면: 같은 정면에서 노트북 화면이 화면 폭에 맞게(약 0.58m) */
export const ABOUT_SHOT_PORTRAIT: Shot = { position: [-0.1, 1.038, -0.287], target: [-0.1, 0.878, -0.844] }

/**
 * WORK 1단계(서랍장 정면 기준 이미지): HOME에서 카메라가 그대로 아래로 내려와 책상 밑 서랍장을 정면으로.
 * 화면 위 끝에 책상 상판, 가운데에서 조금 오른쪽에 서랍장, 아래에 원목 바닥.
 */
export const WORK_SHOT: Shot = { position: [0.08, 0.44, 0.85], target: [0.16, 0.42, -0.6], fov: 30 }
export const WORK_SHOT_PORTRAIT: Shot = { position: [0.32, 0.45, 1.5], target: [0.32, 0.4, -0.6] }
/**
 * WORK 2단계(서랍 속 파일 기준 이미지): 첫 서랍이 열리면 카메라가 앞 위에서 서랍 안을 내려다본다.
 * 칸막이 탭에 적힌 프로젝트 이름이 읽히는 거리.
 */
export const FILES_SHOT: Shot = { position: [0.32, 1.02, 0.42], target: [0.32, 0.6, -0.16], fov: 32 }
export const FILES_SHOT_PORTRAIT: Shot = { position: [0.32, 1.08, 0.28], target: [0.32, 0.58, -0.17] }

export const TRANSITION = {
  /** 노트북으로 다가가는 시간(초) */
  approachSec: 1.6,
  /** HOME으로 돌아가는 시간(초) */
  returnSec: 1.4,
  /** 서랍장 앞으로 내려가는 시간(초) */
  descendSec: 1.5,
  /** 서랍이 열리며 안을 내려다보기까지(초) */
  drawerSec: 1.7,
  /** 프로젝트 목록 ↔ 서랍 속 파일 사이 카메라 이동(초) */
  listSec: 0.9,
  /** ABOUT 오갈 때 이동 중간에 카메라를 살짝 띄우는 높이(m) */
  arc: 0.06,
  /** 움직임 줄이기 설정에서의 시간(초). 0이면 바로 자리 잡는다 */
  reducedSec: 0,
}

/** 서랍장(책상 밑 올리브 철제 서랍장: 위 두 칸은 얕고 아래 한 칸은 깊다. 크롬 막대 손잡이, 위 틀·가운데 서랍에 열쇠 구멍) */
export const CABINET = {
  width: 0.42,
  depth: 0.58,
  /** 바닥에서 띄운 높이(책상 다리 사이에 매달린 형태) */
  lift: 0.1,
  /** 서랍 앞판 높이: 위에서부터 */
  drawers: [0.15, 0.15, 0.29],
  color: '#7b8569',
  /** 첫 서랍이 열리는 거리(m)와 빠르기 */
  openDistance: 0.44,
  openSpeed: 3.2,
  /** 서랍장 정면에 도착한 뒤 서랍이 열리기까지(초) — 닫힌 정면을 잠깐 보여 준다 */
  openDelay: 0.45,
}

/** 노트북 가운데 x — 책상 위 사물은 이 선을 기준으로 좌우에 놓는다 */
const CX = -0.1
/** 책상 위 뒤쪽(벽 가까이) 줄과 앞쪽 줄의 z */
const BACK = ROOM.wallZ + 0.26
const FRONT = ROOM.wallZ + 0.52

/**
 * 배치(docs/v4-refs/home-layout.png): 책상을 뒷벽에 붙이고, 뒤쪽 한 줄에 스탠드 · 플립 시계 · 노트북 · 전화기,
 * 앞쪽 왼쪽에 펼친 노트와 작은 책. 벽에는 왼쪽 위 포스터 묶음, 오른쪽 달력. 의자는 없다.
 * 책상 밑 오른쪽에 올리브 서랍장(WORK). 책상 위 물건은 y = DESK.height
 */
export const HOME_LAYOUT = {
  desk: [CX, 0, ROOM.wallZ + DESK.depth / 2 + 0.02] as Vec3,
  /** 서랍장: 책상 밑 오른쪽, 앞면이 책상 앞 끝보다 조금 안쪽 */
  cabinet: [CX + 0.42, 0, ROOM.wallZ + 0.04 + CABINET.depth / 2] as Vec3,
  laptop: [CX, DESK.height, BACK + 0.04] as Vec3,
  /** 스탠드: 책상 왼쪽 뒤, 팔(로컬 +x)이 오른쪽으로 뻗어 갓이 시계·노트 쪽을 비춘다 */
  lamp: [CX - 0.66, DESK.height, BACK] as Vec3,
  lampYaw: -0.25,
  clock: [CX - 0.36, DESK.height, BACK + 0.02] as Vec3,
  telephone: [CX + 0.48, DESK.height, BACK + 0.02] as Vec3,
  notebook: [CX - 0.38, DESK.height, FRONT] as Vec3,
  book: [CX - 0.7, DESK.height, FRONT + 0.02] as Vec3,
  floorColor: '#b07c52',
  rug: [CX - 0.2, 0, 0.3] as Vec3,
  /** 창턱 큰 화분 */
  plant: [ROOM.sideX + 0.1, ROOM.window.center[1] - ROOM.window.size[1] / 2, -0.35] as Vec3,
  /** 달력: 오른쪽, 전화기 위 */
  calendar: [CX + 0.6, 1.1, ROOM.wallZ + 0.006] as Vec3,
  /** 포스터 묶음: 왼쪽 위, 스탠드 위 */
  posters: [CX - 0.5, 1.17, ROOM.wallZ + 0.006] as Vec3,
  /** 오른쪽 철제 선반(뒷벽에 붙여): WORK 화면 오른쪽 끝에 걸린다 */
  shelf: [CX + 1.42, 0, ROOM.wallZ + 0.22] as Vec3,
}

/**
 * HOME 조명: V2 낮 프리셋에서 노출을 낮추고 햇살을 따뜻하고 강하게 — 기준 이미지처럼 빛 든 곳과 그늘의 차이를 키운다.
 * 창 햇빛·환경광은 스탠드를 켜고 꺼도 그대로다.
 */
export const HOME_LIGHTING: LightingPreset = {
  ...LIGHTING.day,
  background: '#efe9df',
  exposure: 1.0,
  sun: { ...LIGHTING.day.sun, color: '#ffd29a', intensity: 6.8 },
  // 주변광(하늘·보조광·환경 반사)을 줄여 빛 든 곳과 그늘의 차이를 키운다
  sky: { color: '#efe6d8', ground: '#b9a588', intensity: 0.6 },
  fill: { ...LIGHTING.day.fill, color: '#f3ece2', intensity: 0.28 },
  reflections: { ...LIGHTING.day.reflections, intensity: 0.5 },
}

/** 스탠드 조명(책상 위 국소 조명). 창 햇빛·환경광은 건드리지 않는다 */
export const LAMP_LIGHT = {
  color: '#ffcf8a',
  /** 켜졌을 때 세기(칸델라). 꺼지면 0 */
  intensity: 6,
  distance: 2.4,
  /** 퍼지는 각(라디안)과 가장자리 부드러움 */
  angle: 0.8,
  penumbra: 0.75,
  /** 전구 발광 세기 */
  bulbGlow: 6,
  /** 켜고 끌 때 빠르기(클수록 빠름) */
  fade: 9,
  /** 처음 상태 */
  startOn: true,
}

/** CRT 화면 발광 */
export const CRT_GLOW = {
  idle: 0.95,
  hover: 1.45,
  /** 접근·ABOUT 중 */
  focus: 1.25,
  /** 화면 앞 은은한 반사광(그림자 없음) */
  spill: { color: '#7fa6ff', intensity: 0.06, hoverIntensity: 0.14 },
  /** 커서 깜빡임 주기(초) */
  blinkSec: 1.06,
  speed: 6,
}

/** 창가 식물: 일부 잎만 느리고 불규칙하게 흔들린다 */
export const PLANT_SWAY = {
  /** 흔들리는 잎 비율(0~1) */
  share: 0.35,
  /** 최대 각도(라디안) */
  amplitude: 0.06,
  /** 기본 빠르기(Hz) — 잎마다 조금씩 다르게 */
  speed: 0.22,
}

/** 햇빛 속 먼지 */
export const DUST = {
  count: 70,
  /** 창에서 방 안으로 퍼지는 거리(m) */
  depth: 1.6,
  size: 0.012,
  opacity: 0.55,
  /** 떠다니는 빠르기 */
  drift: 0.012,
}

/** 책상 상판 마감 */
export const DESK_FINISH = {
  /** 상판 윗면 반사(주변 사물을 흐리게 비춘다). 거울처럼 되지 않게 흐림을 크게, 세기를 낮게 */
  reflection: {
    color: '#9da2a8',
    metalness: 0.7,
    roughness: 0.62,
    blur: [900, 300] as [number, number],
    resolution: 512,
    strength: 0.5,
  },
}

/** 빛·그림자 보정(창 햇빛·스탠드 외) */
export const SHADING = {
  /** 창틀 그림자 부드러움(PCSS): 크기·표본 수 */
  softShadows: { size: 22, samples: 12, focus: 0.5 },
  /** 물체가 닿은 곳의 접촉 그림자: 책상 위 / 바닥 */
  contactDesk: { opacity: 0.55, blur: 1.8, far: 0.14 },
  contactFloor: { opacity: 0.4, blur: 2.6, far: 0.6 },
  /** 화면 공간 차폐(구석·틈·물체 아래가 자연스럽게 어두워지는 간접광 효과) */
  ao: { radius: 0.05, intensity: 1.6, distanceFalloff: 0.3 },
}
/**
 * 개발용 고정 시점(?view=이름). 근접 품질 확인용 — 빌드에서는 쓰지 않는다.
 * about·work·files: 각 장면 기본 구도 / laptop·phone: 근접
 */
export const DEV_VIEWS: Record<string, Shot> = {
  about: ABOUT_SHOT,
  work: WORK_SHOT,
  files: FILES_SHOT,
  laptop: { position: [0.18, 0.92, -0.32], target: [-0.1, 0.85, -0.75], fov: 32 },
  phone: { position: [0.55, 0.9, -0.42], target: [0.38, 0.8, -0.72], fov: 30 },
}

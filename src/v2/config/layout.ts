import type { Vec3 } from './scenes'

/** 작업실 오브젝트 배치 치수(미터). 바닥 y=0, 뒷벽 쪽이 -z, 방문자 쪽이 +z, 창문 쪽이 -x. */

export const ROOM = {
  /** 뒷벽(모니터 뒤, 비워 두는 벽) */
  wallZ: -1.0,
  /** 왼쪽 측면 벽(창문 벽) */
  sideX: -1.55,
  wallThickness: 0.12,
  /**
   * 벽 높이. 천장 없이도 햇살이 벽 위로 넘어 뒷벽에 닿지 않고, 세로 화면(넓은 화각)에서도
   * 벽 위 배경이 보이지 않을 만큼 높게 둔다(장면 구도에서 벽 윗부분은 보이지 않는다)
   */
  height: 8,
  floorSize: 14,
  /** 측면 벽의 큰 창. center는 [z, y], size는 [폭(z 방향), 높이] */
  window: {
    center: [-0.15, 1.5] as [number, number],
    size: [1.7, 1.8] as [number, number],
    frame: 0.045,
    /** 가로 살 높이(창 아래에서부터) */
    transomAt: 1.25,
  },
  colors: { floor: '#e2cdaa', wall: '#f5f2ec', frame: '#fbfaf7', baseboard: '#fbfaf7' },
  /** 흰 걸레받이 높이 */
  baseboard: 0.09,
  /** 창턱(방 안쪽으로 나온 판) 깊이 */
  sill: 0.14,
}

export const DESK = {
  width: 1.6,
  depth: 0.75,
  height: 0.75,
  top: 0.035,
  /** 금속 다리 파이프 반지름 */
  leg: 0.014,
}

/**
 * 공간 전체에서 같이 쓰는 재질 색(기준 비주얼: 레트로 사물 + 밝은 작업실).
 * 바탕은 웜화이트·우드·회색 철재·올리브 그레이, 포인트는 노랑(스탠드)·빨강(전화기) 둘만.
 * 코발트블루는 서랍 안 폴더 전용이라 여기에는 없다.
 */
export const FINISH = {
  oak: '#d8bb94',
  /** 크롬·실버 금속(의자 프레임, 레일, 펜 클립) */
  silver: '#d6d9de',
  black: '#17171a',
  /** 회색 철제(책상 상판) */
  steel: '#9b9fa4',
  /** 짙은 철제(책상 다리) */
  steelDark: '#4e5257',
  /** 레트로 컴퓨터·키보드 베이지 */
  beige: '#e4dac4',
  beigeDark: '#cfc3a8',
  /** 의자 가죽: 빨간 전화기가 돋보이게 버건디 대신 어두운 브라운 */
  leather: '#3a2820',
  /** 포인트 ①: 스탠드 머스터드 옐로우 */
  yellow: '#d9a21b',
  /** 포인트 ②: 전화기 빨강 */
  red: '#b3302a',
}

// 서랍장 치수·서랍 설정·마감은 cabinet.ts

/** 각 오브젝트의 위치(그룹 원점). 책상 위 물건은 y = DESK.height */
export const PLACEMENT: Record<string, Vec3> = {
  desk: [0, 0, -0.45],
  // 책상 앞 모서리 가까이 둬서, 열린 서랍 안이 책상 상판에 가리지 않게 한다
  cabinet: [0.48, 0, -0.26],
  // 자리를 비운 느낌으로 왼쪽으로 빼서 비스듬히 둔다(ABOUT 정면 시점을 가리지 않게)
  chair: [-0.66, 0, 0.42],
  // 레트로 컴퓨터(본체 위에 CRT 모니터). ABOUT 카메라가 화면 가운데를 본다
  computer: [-0.1, DESK.height, -0.6],
  keyboard: [-0.1, DESK.height, -0.32],
  mouse: [0.24, DESK.height, -0.3],
  lamp: [-0.62, DESK.height, -0.64],
  // 스탠드 옆 플립 시계
  clock: [-0.47, DESK.height, -0.75],
  // 모니터 오른쪽 뒤 펜꽂이
  penHolder: [0.25, DESK.height, -0.72],
  card: [0.3, DESK.height, -0.18],
  telephone: [0.52, DESK.height, -0.5],
  // 작업 흔적
  notebook: [-0.52, DESK.height, -0.27],
  // 머그는 밑에 깔린 열쇠 두께만큼 살짝 띄운다
  mug: [-0.4, DESK.height + 0.003, -0.52],
  // 창턱 화분(창 아래 틀 위), 뒷벽 오른쪽 큰 종이 달력
  plant: [ROOM.sideX + 0.07, ROOM.window.center[1] - ROOM.window.size[1] / 2, 0.35],
  calendar: [1.05, 1.52, ROOM.wallZ + 0.006],
  // 이스터에그: 머그컵 밑에서 고리만 삐죽 나온 열쇠
  key: [-0.35, DESK.height, -0.47],
}

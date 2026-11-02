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
  colors: { floor: '#d9c09c', wall: '#f1ebe1', frame: '#f6f2ea' },
}

export const DESK = {
  width: 1.6,
  depth: 0.75,
  height: 0.75,
  top: 0.035,
  /** 금속 다리 파이프 반지름 */
  leg: 0.014,
}

/** 공간 전체에서 같이 쓰는 재질 색 */
export const FINISH = {
  oak: '#d8bb94',
  silver: '#d6d9de',
  black: '#17171a',
}

// 서랍장 치수·서랍 설정·마감은 cabinet.ts

/** 각 오브젝트의 위치(그룹 원점). 책상 위 물건은 y = DESK.height */
export const PLACEMENT: Record<string, Vec3> = {
  desk: [0, 0, -0.45],
  // 책상 앞 모서리 가까이 둬서, 열린 서랍 안이 책상 상판에 가리지 않게 한다
  cabinet: [0.48, 0, -0.26],
  // 자리를 비운 느낌으로 왼쪽으로 빼서 비스듬히 둔다(ABOUT 정면 시점을 가리지 않게)
  chair: [-0.66, 0, 0.42],
  monitor: [-0.1, DESK.height, -0.62],
  keyboard: [-0.1, DESK.height, -0.32],
  mouse: [0.24, DESK.height, -0.3],
  lamp: [-0.62, DESK.height, -0.64],
  card: [0.3, DESK.height, -0.18],
  telephone: [0.52, DESK.height, -0.5],
  // 작업 흔적
  notebook: [-0.52, DESK.height, -0.27],
  // 머그는 밑에 깔린 열쇠 두께만큼 살짝 띄운다
  mug: [-0.4, DESK.height + 0.003, -0.52],
  // 이스터에그: 머그컵 밑에서 고리만 삐죽 나온 열쇠
  key: [-0.35, DESK.height, -0.47],
}

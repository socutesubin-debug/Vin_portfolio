import type { Vec3 } from './scenes'

/** 작업실 오브젝트 배치 치수(미터). 바닥 y=0. */

export const ROOM = {
  wallZ: -1.0,
  floorSize: 14,
  window: { center: [-1.35, 1.65] as [number, number], size: [1.3, 1.1] as [number, number] },
  colors: { floor: '#d8d2c8', wall: '#ece8e1', window: '#fffaf0', frame: '#f6f4ef' },
}

export const DESK = {
  width: 1.6,
  depth: 0.75,
  height: 0.75,
  top: 0.04,
  leg: 0.04,
  color: '#c9a77c',
  legColor: '#2a2a2e',
}

// 서랍장 치수·서랍 설정은 cabinet.ts

/** 각 오브젝트의 위치(그룹 원점). 책상 위 물건은 y = DESK.height */
export const PLACEMENT: Record<string, Vec3> = {
  desk: [0, 0, -0.45],
  // 책상 앞 모서리 가까이 둬서, 열린 서랍 안이 책상 상판에 가리지 않게 한다
  cabinet: [0.48, 0, -0.26],
  // 자리를 비운 느낌으로 왼쪽으로 빼 둔다(ABOUT 정면 시점을 가리지 않게)
  chair: [-0.62, 0, 0.42],
  monitor: [-0.1, DESK.height, -0.62],
  keyboard: [-0.1, DESK.height, -0.32],
  mouse: [0.24, DESK.height, -0.3],
  lamp: [-0.6, DESK.height, -0.62],
  card: [0.3, DESK.height, -0.18],
  telephone: [0.52, DESK.height, -0.5],
}

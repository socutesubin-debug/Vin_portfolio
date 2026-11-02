/**
 * 서랍장 설정. 서랍마다 라벨과 열림/잠김을 여기서 바꾼다.
 *
 * 치수는 참고 디자인(VIN 서랍장 index.html)의 원래 크기(m)를 그대로 쓰고,
 * 장면에서는 CABINET_SCALE배로 줄여 책상 아래에 둔다.
 */

export type DrawerContents = 'projects' | null

export interface DrawerSlot {
  id: 'top' | 'middle' | 'bottom'
  /** 라벨 프레임 안에 들어갈 글자. 빈 문자열이면 빈 라벨 카드 */
  label: string
  /** true면 클릭해도 덜컥 흔들리기만 하고 열리지 않는다 */
  locked: boolean
  /** 서랍 안 내용. 나중에 이스터에그를 넣을 때 여기에 종류를 추가한다 */
  contents: DrawerContents
}

/** 위에서부터 순서대로 */
export const DRAWER_SLOTS: DrawerSlot[] = [
  { id: 'top', label: 'WORK', locked: false, contents: 'projects' },
  { id: 'middle', label: '', locked: true, contents: null },
  { id: 'bottom', label: '', locked: true, contents: null },
]

/** 참고 디자인 원래 치수(m) */
export const CAB = {
  W: 1.1,
  D: 0.8,
  /** 아치형 받침 높이 */
  BASE: 0.3,
  /** 서랍 한 칸 높이 */
  DH: 0.4,
  /** 크롬 레일 반지름 */
  R: 0.014,
}
export const CAB_N = DRAWER_SLOTS.length
export const CAB_H = CAB.BASE + CAB.DH * CAB_N + 0.03

/** 책상 아래에 맞게 줄이는 비율(높이 약 0.64m) */
export const CABINET_SCALE = 0.42

/** 서랍 움직임(참고 디자인 단위) */
export const DRAWER_MOTION = {
  /** 마우스를 올렸을 때 나오는 거리 */
  hover: 0.13,
  /** 열렸을 때 나오는 거리(거의 끝까지 빠지는 풀 익스텐션) */
  open: 0.7,
  /** 잠긴 서랍이 덜컥 당겨지는 거리 */
  rattle: 0.07,
  /** 따라가는 속도(클수록 빠름) */
  speed: 6,
}

export const CABINET_COLORS = {
  paint: '#1e278f',
  paintIn: '#1c2588',
}

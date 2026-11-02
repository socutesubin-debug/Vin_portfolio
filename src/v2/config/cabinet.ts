/**
 * 서랍장 설정. 서랍마다 라벨과 열림/잠김을 여기서 바꾼다.
 *
 * 치수는 참고 디자인(VIN 서랍장 index.html)의 원래 크기(m)를 그대로 쓰고,
 * 장면에서는 CABINET_SCALE배로 줄여 책상 아래에 둔다.
 */

/** 서랍 안 내용 종류 */
export type DrawerContents = 'projects' | 'swatches' | 'wip' | null

export interface DrawerSlot {
  id: 'top' | 'middle' | 'bottom'
  /** 라벨 프레임 안에 들어갈 글자. 빈 문자열이면 빈 라벨 카드 */
  label: string
  /**
   * true면 잠긴 서랍. 열쇠(이스터에그)가 없으면 덜컥 흔들리기만 하고, 열쇠가 있으면 열린다.
   * false로 바꾸면 처음부터 열린다.
   */
  locked: boolean
  /** 서랍 안 내용 */
  contents: DrawerContents
}

/** 위에서부터 순서대로 */
export const DRAWER_SLOTS: DrawerSlot[] = [
  { id: 'top', label: 'WORK', locked: false, contents: 'projects' },
  // 이스터에그: 숨은 열쇠로 연다
  { id: 'middle', label: '', locked: true, contents: 'swatches' },
  { id: 'bottom', label: '', locked: true, contents: 'wip' },
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
  /** 한 번 열었던(열쇠로 푼) 서랍이 닫혀 있을 때 살짝 열려 있는 거리 */
  ajar: 0.05,
  /** 잠긴 서랍이 덜컥 당겨지는 거리 */
  rattle: 0.07,
  /** 따라가는 속도(클수록 빠름) */
  speed: 6,
}

export type CabinetFinish = 'silver' | 'charcoal'

interface FinishSpec {
  label: string
  /** 몸체·서랍 앞판 */
  body: { color: string; metalness: number; roughness: number; clearcoat: number }
  /** 서랍 안쪽·칸 선반 */
  inside: { color: string; metalness: number; roughness: number }
}

/** 서랍장 마감 두 가지. 개발용 패널에서 바꿔 비교한다(주소 뒤 ?cabinet=charcoal 로도 고를 수 있다) */
export const CABINET_FINISHES: Record<CabinetFinish, FinishSpec> = {
  // 브러시드 알루미늄
  silver: {
    label: '실버',
    body: { color: '#dadde1', metalness: 0.7, roughness: 0.32, clearcoat: 0 },
    inside: { color: '#c3c6cb', metalness: 0.5, roughness: 0.5 },
  },
  // 분체 도장(무광에 가까운 차콜)
  charcoal: {
    label: '차콜',
    body: { color: '#4b4d53', metalness: 0.3, roughness: 0.48, clearcoat: 0.25 },
    inside: { color: '#3e4045', metalness: 0.2, roughness: 0.65 },
  },
}

export const DEFAULT_CABINET_FINISH: CabinetFinish = 'silver'

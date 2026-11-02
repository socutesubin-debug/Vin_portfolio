import type { Vec3 } from './scenes'

/**
 * 조명 프리셋. 낮/밤 등 분위기마다 같은 형태의 프리셋을 하나씩 둔다.
 * 밤 버전은 LIGHTING에 night를 추가하고 ACTIVE_LIGHTING을 바꾸면 된다.
 */

export interface LightingPreset {
  /** 방 밖으로 보이는 배경색 */
  background: string
  /** 톤 매핑 노출 */
  exposure: number
  /** 창으로 들어오는 직사광. 장면에서 그림자를 만드는 유일한 빛 */
  sun: {
    color: string
    intensity: number
    /** 빛이 오는 위치(창밖) */
    position: Vec3
    /** 빛이 향하는 지점 */
    target: Vec3
    /** 그림자 가장자리 부드러움 */
    softness: number
  }
  /** 하늘·바닥 반사로 생기는 부드러운 환경광 */
  sky: { color: string; ground: string; intensity: number }
  /** 방 안쪽(방문자 쪽)에서 오는 약한 보조광. 그림자 없음 */
  fill: { color: string; intensity: number; position: Vec3 }
  /** 금속 반사용 환경맵 */
  reflections: {
    intensity: number
    /** 환경맵 바탕색(금속에 비치는 실내 톤) */
    base: string
    /** 환경맵 속 창 모양 밝은 면 */
    window: { color: string; intensity: number }
    /** 환경맵 속 천장·벽 반사 */
    room: { color: string; intensity: number }
  }
  /** 창밖 빛 면(밝게 날아간 느낌) */
  windowGlow: { color: string; intensity: number }
}

export const LIGHTING: Record<'day', LightingPreset> = {
  // 기준 비주얼(레트로 사물 + 밝은 작업실): 전체는 밝고 깨끗하게, 햇살만 따뜻하고 선명하게
  day: {
    background: '#f5f2ec',
    exposure: 1.12,
    sun: {
      color: '#ffe6c2',
      intensity: 4.8,
      // 왼쪽 창에서 낮은 각도로, 뒷벽 쪽으로 비춘다 → 창 모양 빛과 창틀 그림자가 뒷벽 왼쪽(모니터 왼편)과
      // 창가 바닥에 대각선으로 길게 떨어진다
      position: [-4.78, 3.16, 4.68],
      target: [-0.3, 0.6, -0.6],
      softness: 1.6,
    },
    sky: { color: '#f8f6f1', ground: '#d9cfbf', intensity: 1.15 },
    fill: { color: '#f7f4ee', intensity: 0.6, position: [2.2, 2.4, 3.5] },
    reflections: {
      intensity: 0.65,
      base: '#d8d3cb',
      window: { color: '#fff6e8', intensity: 4 },
      room: { color: '#f5f2ec', intensity: 0.8 },
    },
    // 창밖 풍경(벽돌·나무) 밝기
    windowGlow: { color: '#ffffff', intensity: 1.12 },
  },
}

export const ACTIVE_LIGHTING: keyof typeof LIGHTING = 'day'

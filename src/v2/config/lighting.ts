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
  day: {
    background: '#efe9df',
    exposure: 1.05,
    sun: {
      color: '#ffdcae',
      intensity: 4.4,
      // 뒷벽(모니터 뒤)에 햇살 무늬가 생기지 않도록 살짝 방문자 쪽으로 비춘다 → 창 모양 빛은 책상·바닥에 떨어진다
      position: [-4.6, 3.3, -0.7],
      target: [0.2, 0.3, 0.1],
      softness: 3,
    },
    sky: { color: '#fff3e2', ground: '#cdb89c', intensity: 1.05 },
    fill: { color: '#f6efe4', intensity: 0.55, position: [2.2, 2.4, 3.5] },
    reflections: {
      intensity: 0.6,
      base: '#c9bfb2',
      window: { color: '#fff1da', intensity: 4 },
      room: { color: '#f2ebe0', intensity: 0.7 },
    },
    windowGlow: { color: '#fff6e8', intensity: 1.35 },
  },
}

export const ACTIVE_LIGHTING: keyof typeof LIGHTING = 'day'

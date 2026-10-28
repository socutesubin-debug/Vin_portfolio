/**
 * V2 카메라 설정. 장면 구도는 이 파일의 숫자만 바꿔서 조정한다.
 * 단위는 미터, 바닥이 y=0, 뒷벽 쪽이 -z, 방문자 쪽이 +z.
 * 오브젝트 위치는 layout.ts 참고.
 */

export type Vec3 = [number, number, number]
export type SceneId = 'home' | 'about' | 'work' | 'contact'

export interface CameraShot {
  label: string
  /** 카메라 위치 */
  position: Vec3
  /** 카메라가 바라보는 지점 */
  target: Vec3
}

export const SCENE_ORDER: SceneId[] = ['home', 'about', 'work', 'contact']

export const SCENES: Record<SceneId, CameraShot> = {
  // 작업실 전체를 정면에서, 약간 위에서 내려다본다
  home: { label: 'HOME', position: [0, 2.1, 3.6], target: [0, 0.75, -0.35] },
  // 모니터 정면(눈높이), 아래로 키보드·마우스까지
  about: { label: 'ABOUT', position: [-0.1, 1.05, 0.75], target: [-0.1, 1.0, -0.62] },
  // 서랍장 정면, 위에서 아래로 내려다보는 근접 구도(서랍 속 프로젝트가 잘 보이게)
  work: { label: 'WORK', position: [0.5, 0.95, 0.65], target: [0.5, 0.4, -0.15] },
  // 책상 위 전화기, 오른쪽 앞 35도 측면(45도에서 왼쪽으로 10도)
  contact: { label: 'CONTACT', position: [0.99, 1.22, 0.17], target: [0.52, 0.8, -0.5] },
}

export const CAMERA = {
  /** 가로 화면(referenceAspect 이상)에서의 세로 화각(도) */
  fov: 40,
  referenceAspect: 16 / 9,
  /** 세로 화면에서 화각을 넓힐 때의 상한(도) */
  maxFov: 72,
  /**
   * 화각이 상한에 걸린 뒤에는 카메라를 뒤로 빼서 이 비율만큼의 가로 시야를 지킨다.
   * 키우면 모바일에서 더 멀리(작게), 줄이면 더 가까이(크게) 보인다.
   */
  minKeepAspect: 1.1,
  near: 0.05,
  far: 50,
}

export const SCROLL = {
  /** 각 장면에 머무는 구간 길이(타임라인 단위) */
  hold: 0.6,
  /** 장면 사이 이동 구간 길이(타임라인 단위) */
  travel: 1,
  /** 타임라인 1단위당 스크롤 길이(vh) */
  vhPerUnit: 90,
  /** 스크롤을 따라가는 지연(초). 클수록 부드럽고 느리게 따라온다 */
  scrub: 1,
  ease: 'power2.inOut',
}

/** 개발용 카메라 좌표 패널. false로 바꾸면 숨긴다 */
export const SHOW_CAMERA_PANEL = import.meta.env.DEV

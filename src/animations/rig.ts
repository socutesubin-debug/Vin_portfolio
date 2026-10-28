import { CAMERA } from './stages'

// GSAP 타임라인이 쓰고, 렌더 루프(useFrame)가 읽어 3D에 적용하는 값.
// React 상태가 아니므로 스크롤 중 리렌더링이 일어나지 않는다.
// three.js에 의존하지 않는 일반 객체로 두어, 3D 청크를 지연 로드해도 타임라인이 먼저 동작한다.
function vec([x, y, z]: readonly [number, number, number]) {
  return { x, y, z }
}

export const rig = {
  cam: vec(CAMERA.front.pos),
  target: vec(CAMERA.front.target),
  shift: 0, // 데스크톱 좌측 패널용 프레이밍 이동 (0~1)
  rise: 0, // Intro 서랍장 상승 (0 = 화면 아래, 1 = 제자리)
  about: 0, // 서랍 진행률
  work: 0,
  contact: 0,
  resume: 0, // 이력서가 서랍 밖으로 올라와 크게 보이는 정도 (0~1)
  fileHi: -1, // Work 구간 스크롤 순차 강조 (0..2 = 파일 인덱스)
  contactCard: 0, // Contact 서랍 명함 재등장 (0~1)
}

export type Rig = typeof rig

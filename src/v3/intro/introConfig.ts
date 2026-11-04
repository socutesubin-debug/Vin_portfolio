/**
 * INTRO(S01~S03) 스크롤 영상 설정. 연출은 이 파일의 숫자만 바꿔서 조정한다.
 * 프레임 번호는 public/media/intro/manifest.json(npm run build:intro가 만든다)에서 읽는다.
 */

export const INTRO_MEDIA = {
  /** manifest.json과 seq/ 폴더가 있는 곳 */
  base: '/media/intro/',
  /** S04 카메라 맞춤용 기준 이미지(개발용 겹쳐 보기) */
  homeReference: '/media/intro/k5_desk.png',
}

/**
 * 구간별 스크롤 길이(화면 높이 배수). 1 = 화면 한 장 높이만큼 스크롤.
 * 합계 6.8 → 보통 속도로 끝까지 내리면 6~8초.
 */
export const INTRO_SCROLL = {
  /** c1 오비트(모니터 뒤 → 옆) */
  c1: 2.0,
  /** c2 오비트(옆 → 정면) */
  c2: 2.0,
  /** 정면에 도착한 뒤 잠깐 멈추는 구간(프레임 고정) */
  hold: 0.6,
  /** c3 기지개·퇴장 */
  c3: 1.4,
  /** c4 책상으로 줌인 */
  c4: 0.8,
  /** 스크롤을 따라가는 지연(초). 클수록 부드럽고 느리게 따라온다. 0이면 바로 */
  scrub: 0.5,
}

/** 첫 화면을 띄운 뒤 먼저 불러올 앞부분 길이(프레임). 나머지는 뒤에서 이어서 불러온다 */
export const INTRO_LOADING = {
  headFrames: 48,
  /** 동시에 받는 이미지 수 */
  concurrency: 6,
  /** 휴대폰(세로 화면)용 시퀀스를 쓰는 화면 비율(가로/세로) 기준 */
  mobileBelowAspect: 1,
}

/**
 * 키네틱 타이포. start·end는 c1~c2 안의 진행률(0 = c1 시작, 1 = c2 끝).
 * lines는 한 줄씩 아래에서 올라온다.
 */
export const INTRO_TYPE = {
  items: [
    { lines: ['PARK', 'SU VIN'], start: 0.04, end: 0.32 },
    { lines: ['VISION', 'INSIDE'], start: 0.38, end: 0.66 },
    { lines: ['VIN'], start: 0.72, end: 0.97 },
  ],
  /**
   * 화면 속 위치. 영상의 빈 여백(벽) 쪽에 둔다.
   * align: 'left' | 'center' | 'right', x·y는 CSS 길이(가장자리에서 떨어진 거리)
   */
  position: { align: 'left' as 'left' | 'center' | 'right', x: '7vw', y: '13vh' },
  /** 모바일(세로 화면) 위치 */
  mobilePosition: { align: 'center' as 'left' | 'center' | 'right', x: '0px', y: '6vh' },
  color: '#2b2d31',
  /** 글자 크기(CSS clamp) */
  size: 'clamp(40px, 7.2vw, 132px)',
  mobileSize: 'clamp(32px, 11vw, 56px)',
  /** 등장·소멸에 쓰는 길이(각 항목 구간 대비 비율) */
  enter: 0.22,
  exit: 0.2,
  /** 줄 사이 시차(각 항목 구간 대비 비율) */
  stagger: 0.07,
}

/**
 * HOME 전환 빛 효과. 창문 쪽(왼쪽 위)에서 따뜻한 빛이 번지며 밝아졌다가, 걷히면서 S04 3D HOME이 드러난다.
 */
export const INTRO_LIGHT = {
  /** 빛이 번지기 시작하는 곳(화면 기준 %) */
  origin: { x: 8, y: 6 },
  /** 빛 가운데 색 / 번지는 색 / 화면 전체가 하얗게 될 때의 색 */
  core: '#fffaf0',
  warm: '#ffd59a',
  wash: '#fff6e8',
  /** 가장 밝을 때 화면을 덮는 정도(0~1). 1이면 완전히 하얗게 */
  peak: 1,
  /** 블룸 느낌(가장 밝을 때 뒤 화면을 흐리게 하는 정도, px) */
  bloom: 12,
  /** c4 구간 중 빛이 번지기 시작하는 지점(0~1). 0.45면 c4의 45% 지점부터 끝까지 밝아진다 */
  rampStart: 0.45,
  /** 가장 밝은 상태로 머무는 시간(초) — 3D 장면이 준비되면 그 뒤부터 */
  holdSec: 0.25,
  /** 빛이 걷히는 시간(초) */
  revealSec: 1.4,
  /** Skip을 눌렀을 때 밝아지는 시간(초) */
  skipRampSec: 0.8,
  /** 3D 장면 준비를 기다리는 최대 시간(초) */
  maxWaitSec: 6,
}

/** 6-1장 규칙 */
export const INTRO_RULES = {
  /** Skip 텍스트가 나타나기까지(초) */
  skipDelaySec: 2.5,
  /** INTRO를 본 적 있는지 저장하는 키 */
  seenKey: 'vin-v3-intro-seen',
  /** 이 주소로 들어오면 INTRO 생략 */
  skipPaths: [/^\/work\/.+/, /^\/quick\/?$/],
  /** 움직임 줄이기: 마지막 장면 정지 이미지를 보여주는 시간(초)과 페이드 시간(초) */
  reducedStillSec: 1.2,
  reducedFadeSec: 0.8,
}

/** 개발용 표시(프레임 번호·클립·진행률). false로 바꾸면 숨긴다 */
export const INTRO_DEV_HUD = import.meta.env.DEV
